import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI, DbChangeEvent, IContactsAppApi } from "@onda/shared";

const dbApi: IContactsAppApi = {
  contacts: {
    getAll: () => ipcRenderer.invoke("db:contacts:getAll"),
    getById: (id) => ipcRenderer.invoke("db:contacts:getById", id),
    create: (input) => ipcRenderer.invoke("db:contacts:create", input),
    update: (id, fields) =>
      ipcRenderer.invoke("db:contacts:update", id, fields),
    delete: (id) => ipcRenderer.invoke("db:contacts:delete", id),
    markContacted: (id, type) =>
      ipcRenderer.invoke("db:contacts:markContacted", id, type),
  },
  interactions: {
    getForContact: (contactId) =>
      ipcRenderer.invoke("db:interactions:getForContact", contactId),
    create: (input) => ipcRenderer.invoke("db:interactions:create", input),
    delete: (id) => ipcRenderer.invoke("db:interactions:delete", id),
  },
  tags: {
    getAll: () => ipcRenderer.invoke("db:tags:getAll"),
    save: (tag) => ipcRenderer.invoke("db:tags:save", tag),
    delete: (id) => ipcRenderer.invoke("db:tags:delete", id),
  },
  import: {
    importDrafts: (drafts) =>
      ipcRenderer.invoke("db:import:importDrafts", drafts),
  },
  settings: {
    get: () => ipcRenderer.invoke("db:settings:get"),
    update: (updates) => ipcRenderer.invoke("db:settings:update", updates),
  },
  system: {
    clearAllData: () => ipcRenderer.invoke("db:system:clearAllData"),
  },
  onDbChange: (callback: (event: DbChangeEvent) => void) => {
    const handler = (_event: any, data: DbChangeEvent) => callback(data);
    ipcRenderer.on("db:changed", handler);
    return () => {
      ipcRenderer.removeListener("db:changed", handler);
    };
  },
};

const electronAPI: ElectronAPI = {
  closeApp: () => ipcRenderer.invoke("close-app"),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  showNotification: (options) =>
    ipcRenderer.invoke("show-notification", options),
  db: dbApi,
  onDbChange: dbApi.onDbChange,
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
