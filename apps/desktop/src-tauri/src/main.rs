#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod sidecar;

fn main() {
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
