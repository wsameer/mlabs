use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SidecarError {
    #[error("port {0} is already in use")]
    PortInUse(u16),
    #[error("failed to spawn sidecar: {0}")]
    Spawn(String),
    #[error("failed to resolve app data directory: {0}")]
    Path(String),
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("tauri: {0}")]
    Tauri(#[from] tauri::Error),
}

#[derive(Serialize)]
pub struct SerializedError {
    pub code: &'static str,
    pub message: String,
}

impl SidecarError {
    pub fn code(&self) -> &'static str {
        match self {
            SidecarError::PortInUse(_) => "PORT_3001_IN_USE",
            SidecarError::Path(_) => "DB_PATH_NOT_WRITABLE",
            _ => "API_START_FAILED",
        }
    }

    pub fn serialize(&self) -> SerializedError {
        SerializedError {
            code: self.code(),
            message: self.to_string(),
        }
    }
}
