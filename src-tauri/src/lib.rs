use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[tauri::command]
fn set_overlay_click_through(app: tauri::AppHandle, ignore: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--silently"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![set_overlay_click_through])
        .setup(|app| {
            // Setup tray icon and menu
            let quit_i = MenuItem::with_id(app, "quit", "Exit HydraWalk", true, None::<&str>)?;
            let open_i = MenuItem::with_id(app, "open", "Open Dashboard", true, None::<&str>)?;
            let drink_i = MenuItem::with_id(app, "drink", "Drink Water Now", true, None::<&str>)?;
            let pause_i = MenuItem::with_id(app, "pause", "Pause Reminders", true, None::<&str>)?;
            let resume_i = MenuItem::with_id(app, "resume", "Resume Reminders", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let stats_i = MenuItem::with_id(app, "stats", "Statistics", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &open_i,
                    &drink_i,
                    &pause_i,
                    &resume_i,
                    &settings_i,
                    &stats_i,
                    &quit_i,
                ],
            )?;

            let icon = app.default_window_icon().cloned().expect("Default window icon is missing");

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "drink" => {
                        let _ = app.emit("drink-water-now", ());
                    }
                    "pause" => {
                        let _ = app.emit("pause-reminders", ());
                    }
                    "resume" => {
                        let _ = app.emit("resume-reminders", ());
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = app.emit("navigate-to", "settings");
                        }
                    }
                    "stats" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = app.emit("navigate-to", "statistics");
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Adjust position of overlay window dynamically to adapt to resolution and DPI scaling
            if let Some(monitor) = app.primary_monitor()? {
                let size = monitor.size();
                let scale_factor = monitor.scale_factor();
                
                let width = size.width;
                let height = size.height;
                
                if let Some(overlay) = app.get_webview_window("overlay") {
                    let logical_width = width as f64 / scale_factor;
                    let logical_height = 250.0;
                    
                    let new_size = tauri::LogicalSize::new(logical_width, logical_height);
                    let _ = overlay.set_size(new_size);
                    
                    let monitor_logical_height = height as f64 / scale_factor;
                    let x_pos = 0.0;
                    let y_pos = monitor_logical_height - logical_height - 40.0; // 40px offset for Windows taskbar
                    
                    let new_pos = tauri::LogicalPosition::new(x_pos, y_pos);
                    let _ = overlay.set_position(new_pos);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
