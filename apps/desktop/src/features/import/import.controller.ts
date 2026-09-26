import type { IpcMainInvokeEvent } from "electron";
import type { ContactDraft } from "@onda/shared";
import { importDrafts } from "./services/import-drafts";
import { notifyDbChanged } from "../../core/lib/events";

export const importController = {
  async importDrafts(_e: IpcMainInvokeEvent, drafts: ContactDraft[]) {
    const res = await importDrafts(drafts);
    if (res.success) notifyDbChanged({ table: "contacts", action: "import" });
    return res;
  },
};
