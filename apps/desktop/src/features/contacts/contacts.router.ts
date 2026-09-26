import type { IpcMain } from "electron";
import { contactsController } from "./contacts.controller";

export function registerContactsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle("db:contacts:getAll", contactsController.getAll);
  ipcMain.handle("db:contacts:getById", contactsController.getById);
  ipcMain.handle("db:contacts:create", contactsController.create);
  ipcMain.handle("db:contacts:update", contactsController.update);
  ipcMain.handle("db:contacts:delete", contactsController.delete);
  ipcMain.handle("db:contacts:markContacted", contactsController.markContacted);
}
