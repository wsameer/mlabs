#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod sidecar;

use tauri::{Manager, RunEvent, WindowEvent};

fn main() {
    // TODO(security): Tighten CSP before shipping a signed DMG. Tauri v2 rejects
    // unknown JSON keys in tauri.conf.json's security block, so this marker lives
    // here. The CSP should allow `connect-src http://127.0.0.1:3001` plus the
    // navigate-to equivalent. Currently `csp: null` for v1 scaffold only.
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if let Err(err) = sidecar::start(&app.handle()) {
                eprintln!("failed to start sidecar: {err}");
                // Surface the failure in stderr; the splash UI will show the
                // mapped error code once /api/health doesn't become ready.
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Destroyed = event {
                if window.label() == "main" {
                    sidecar::stop();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            sidecar::stop();
        }
    });
}
