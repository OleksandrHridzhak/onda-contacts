import type { IpcMainInvokeEvent } from "electron";
import type { InteractionInput } from "@onda/shared";
import {
  createInteraction,
  deleteInteraction,
  getInteractionsForContact,
} from "./services/interactions";
import { notifyDbChanged } from "../../core/lib/events";

export const interactionsController = {
  async getForContact(_e: IpcMainInvokeEvent, contactId: string) {
    return getInteractionsForContact(contactId);
  },

  async create(_e: IpcMainInvokeEvent, input: InteractionInput) {
    const res = await createInteraction(input);
    if (res.success) {
      notifyDbChanged({ table: "interactions", action: "create" });
      notifyDbChanged({ table: "contacts", action: "update" });
    }
    return res;
  },

  async delete(_e: IpcMainInvokeEvent, id: string) {
    const res = await deleteInteraction(id);
    if (res.success)
      notifyDbChanged({ table: "interactions", action: "delete" });
    return res;
  },
};
