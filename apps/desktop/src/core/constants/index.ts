import { app } from "electron";
import { join } from "path";

export const APP_NAME = "Onda Contacts";

// Packaged builds ship assets and the UI as extraResources.
export const APP_ICON_ICO_PATH = app.isPackaged
  ? join(process.resourcesPath, "assets/logo256.ico")
  : join(__dirname, "../../../packages/shared/assets/logo256.ico");

export const RENDER_INDEX_PATH = app.isPackaged
  ? join(process.resourcesPath, "render/build/index.html")
  : join(__dirname, "../../render/build/index.html");
