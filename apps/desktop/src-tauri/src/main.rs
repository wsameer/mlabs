#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod sidecar;

fn main() {
    // TODO(security): Tighten CSP in tauri.conf.json before shipping a signed DMG.
    // Currently `csp` is null for the v1 scaffold. Needs at minimum
    // `connect-src http://127.0.0.1:3001` (plus navigate-to equivalent) once the
    // sidecar lands in Task 5.
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|_app| {
            sidecar::preflight_port(sidecar::API_PORT)
                .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
