import type { IContactsAppApi, DbChangeEvent } from "./api";

export interface ElectronNotificationOptions {
  title: string;
  body: string;
}

export interface ElectronAPI {
  closeApp: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  showNotification: (options: ElectronNotificationOptions) => Promise<void>;
  db: IContactsAppApi;
  onDbChange: (callback: (event: DbChangeEvent) => void) => () => void;
}
