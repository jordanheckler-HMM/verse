use std::fs;
use std::sync::{Arc, Mutex};

use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

const BACKEND_PORT: &str = "3001";
const BACKEND_SIDECAR_NAME: &str = "verse-backend";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let sidecar_child: Arc<Mutex<Option<CommandChild>>> = Arc::new(Mutex::new(None));
  let sidecar_child_for_setup = Arc::clone(&sidecar_child);
  let sidecar_child_for_exit = Arc::clone(&sidecar_child);

  let app = tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(move |app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let app_data_dir = app.path().app_data_dir()?;
      let projects_dir = app_data_dir.join("projects");
      fs::create_dir_all(&projects_dir)?;

      let sidecar_command = app
        .shell()
        .sidecar(BACKEND_SIDECAR_NAME)?
        .env("PORT", BACKEND_PORT)
        .env("VERSE_PROJECTS_DIR", projects_dir.to_string_lossy().to_string());

      let (mut receiver, child) = sidecar_command.spawn()?;
      log::info!("[verse-backend] spawned with pid {}", child.pid());

      if let Ok(mut child_slot) = sidecar_child_for_setup.lock() {
        *child_slot = Some(child);
      }

      tauri::async_runtime::spawn(async move {
        while let Some(event) = receiver.recv().await {
          match event {
            CommandEvent::Stdout(line) => {
              log::info!("[verse-backend] {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Stderr(line) => {
              log::error!("[verse-backend] {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Error(error) => {
              log::error!("[verse-backend] {error}");
            }
            CommandEvent::Terminated(payload) => {
              log::info!(
                "[verse-backend] terminated: code={:?}, signal={:?}",
                payload.code,
                payload.signal
              );
            }
            _ => {}
          }
        }
      });

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application");

  app.run(move |_app_handle, event| {
    let should_stop_sidecar = matches!(
      &event,
      RunEvent::ExitRequested { .. }
        | RunEvent::Exit
        | RunEvent::WindowEvent {
          event: tauri::WindowEvent::CloseRequested { .. },
          ..
        }
    );

    if should_stop_sidecar {
      if let Ok(mut child_slot) = sidecar_child_for_exit.lock() {
        if let Some(child) = child_slot.take() {
          let _ = child.kill();
        }
      }
    }
  });
}
