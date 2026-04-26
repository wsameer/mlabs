use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use tauri::{AppHandle, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

use crate::errors::SidecarError;

pub const API_PORT: u16 = 3001;
pub const API_HOST: &str = "127.0.0.1";

static CHILD: OnceLock<Mutex<Option<CommandChild>>> = OnceLock::new();

fn child_slot() -> &'static Mutex<Option<CommandChild>> {
    CHILD.get_or_init(|| Mutex::new(None))
}

pub fn preflight_port(port: u16) -> Result<(), SidecarError> {
    match std::net::TcpListener::bind(("127.0.0.1", port)) {
        Ok(listener) => {
            drop(listener);
            Ok(())
        }
        Err(_) => Err(SidecarError::PortInUse(port)),
    }
}

fn resolve_resource(app: &AppHandle, relative: &str) -> Result<PathBuf, SidecarError> {
    app.path()
        .resolve(relative, tauri::path::BaseDirectory::Resource)
        .map_err(|e| SidecarError::Path(e.to_string()))
}

fn resolve_app_data(app: &AppHandle) -> Result<PathBuf, SidecarError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| SidecarError::Path(e.to_string()))?;
    std::fs::create_dir_all(&dir).map_err(SidecarError::from)?;
    Ok(dir)
}

pub fn start(app: &AppHandle) -> Result<(), SidecarError> {
    preflight_port(API_PORT)?;

    let app_data = resolve_app_data(app)?;
    let db_path = app_data.join("mlabs.db");
    let api_entry = resolve_resource(app, "resources/api/index.js")?;
    let web_dist = resolve_resource(app, "resources/web")?;
    let migrations = resolve_resource(app, "resources/migrations")?;
    let node_modules = resolve_resource(app, "resources/node_modules")?;

    // Allow the API to accept /api/health pings from the Tauri webview origin
    // (which is tauri://localhost in prod, http://localhost:1420 in dev) as
    // well as the real UI origin once we redirect to it.
    let cors_origin =
        format!("http://{API_HOST}:{API_PORT},http://localhost:1420,tauri://localhost,http://tauri.localhost");
    let port_str = API_PORT.to_string();

    let sidecar = app
        .shell()
        .sidecar("mlabs-api")
        .map_err(|e| SidecarError::Spawn(e.to_string()))?
        .args([api_entry.to_string_lossy().to_string()])
        .env("NODE_ENV", "production")
        .env("HOST", API_HOST)
        .env("PORT", &port_str)
        .env("DATABASE_URL", db_path.to_string_lossy().to_string())
        .env("CORS_ORIGIN", &cors_origin)
        .env("LOG_LEVEL", "info")
        .env("WEB_DIST_PATH", web_dist.to_string_lossy().to_string())
        .env("MIGRATIONS_FOLDER", migrations.to_string_lossy().to_string())
        .env("NODE_PATH", node_modules.to_string_lossy().to_string());

    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| SidecarError::Spawn(e.to_string()))?;

    *child_slot().lock().unwrap_or_else(|e| e.into_inner()) = Some(child);

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    eprintln!("[api:out] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("[api:err] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Terminated(status) => {
                    eprintln!("[api] terminated: {:?}", status);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

pub fn stop() {
    let child = {
        let mut slot = child_slot().lock().unwrap_or_else(|e| e.into_inner());
        slot.take()
    };
    let Some(child) = child else { return };

    let pid = child.pid();

    // Send SIGTERM so the API's graceful-shutdown handler runs (server.close,
    // SQLite WAL checkpoint). If it doesn't exit within the grace window, fall
    // back to kill() (SIGKILL in tauri-plugin-shell).
    #[cfg(unix)]
    unsafe {
        libc::kill(pid as libc::pid_t, libc::SIGTERM);
    }

    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(3);
    loop {
        // tauri-plugin-shell doesn't expose a try_wait; poll by sending
        // signal 0 (existence check). When the process is gone, kill(0) fails.
        #[cfg(unix)]
        let alive = unsafe { libc::kill(pid as libc::pid_t, 0) == 0 };
        #[cfg(not(unix))]
        let alive = true;

        if !alive {
            return;
        }
        if std::time::Instant::now() >= deadline {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    let _ = child.kill();
}
