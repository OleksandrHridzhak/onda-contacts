import type { IpcMain } from "electron";
import { registerContactsHandlers } from "./contacts/contacts.router";
import { registerInteractionsHandlers } from "./interactions/interactions.router";
import { registerTagsHandlers } from "./tags/tags.router";
import { registerImportHandlers } from "./import/import.router";
import { registerSettingsHandlers } from "./settings/settings.router";
import { registerSystemHandlers } from "./system/system.router";

export function registerAllHandlers(ipcMain: IpcMain): void {
  registerContactsHandlers(ipcMain);
  registerInteractionsHandlers(ipcMain);
  registerTagsHandlers(ipcMain);
  registerImportHandlers(ipcMain);
  registerSettingsHandlers(ipcMain);
  registerSystemHandlers(ipcMain);
}
