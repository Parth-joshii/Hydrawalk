import { isTauriRuntime } from "../utils/runtime";

export async function setAutostart(enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) return;

  const { enable, disable } = await import("@tauri-apps/plugin-autostart");
  if (enabled) {
    await enable();
  } else {
    await disable();
  }
}
