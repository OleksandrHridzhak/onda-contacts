import type { IpcMain } from "electron";
import { tagsController } from "./tags.controller";

export function registerTagsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle("db:tags:getAll", tagsController.getAll);
  ipcMain.handle("db:tags:save", tagsController.save);
  ipcMain.handle("db:tags:delete", tagsController.delete);
}
