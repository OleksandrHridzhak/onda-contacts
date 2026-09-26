import type { IpcMain } from "electron";
import { importController } from "./import.controller";

export function registerImportHandlers(ipcMain: IpcMain): void {
  ipcMain.handle("db:import:importDrafts", importController.importDrafts);
}
