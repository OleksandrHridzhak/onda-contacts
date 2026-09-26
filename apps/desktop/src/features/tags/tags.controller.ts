import type { IpcMainInvokeEvent } from "electron";
import type { Tag } from "@onda/shared";
import { deleteTag, getAllTags, saveTag } from "./services/tags";
import { notifyDbChanged } from "../../core/lib/events";

export const tagsController = {
  async getAll() {
    return getAllTags();
  },

  async save(_e: IpcMainInvokeEvent, tag: Tag | Omit<Tag, "id">) {
    const res = await saveTag(tag);
    if (res.success) notifyDbChanged({ table: "tags", action: "update" });
    return res;
  },

  async delete(_e: IpcMainInvokeEvent, id: string) {
    const res = await deleteTag(id);
    if (res.success) {
      notifyDbChanged({ table: "tags", action: "delete" });
      notifyDbChanged({ table: "contacts", action: "update" });
    }
    return res;
  },
};
