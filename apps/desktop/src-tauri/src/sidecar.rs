use crate::errors::SidecarError;

pub const API_PORT: u16 = 3001;
pub const API_HOST: &str = "127.0.0.1";

pub fn preflight_port(port: u16) -> Result<(), SidecarError> {
    match std::net::TcpListener::bind(("127.0.0.1", port)) {
        Ok(listener) => {
            drop(listener);
            Ok(())
        }
        Err(_) => Err(SidecarError::PortInUse(port)),
    }
}
