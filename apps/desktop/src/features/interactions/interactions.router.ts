import type { IpcMain } from "electron";
import { interactionsController } from "./interactions.controller";

export function registerInteractionsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    "db:interactions:getForContact",
    interactionsController.getForContact,
  );
  ipcMain.handle("db:interactions:create", interactionsController.create);
  ipcMain.handle("db:interactions:delete", interactionsController.delete);
}
