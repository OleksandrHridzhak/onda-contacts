import type { IpcMainInvokeEvent } from "electron";
import type { ContactInput, Interaction } from "@onda/shared";
import { getAllContacts, getContactById } from "./services/get-contacts";
import { createContact } from "./services/create-contact";
import {
  deleteContact,
  markContacted,
  updateContact,
} from "./services/update-contact";
import { notifyDbChanged } from "../../core/lib/events";

export const contactsController = {
  async getAll() {
    return getAllContacts();
  },

  async getById(_e: IpcMainInvokeEvent, id: string) {
    return getContactById(id);
  },

  async create(_e: IpcMainInvokeEvent, input: ContactInput) {
    const res = await createContact(input);
    if (res.success) notifyDbChanged({ table: "contacts", action: "create" });
    return res;
  },

  async update(_e: IpcMainInvokeEvent, id: string, fields: ContactInput) {
    const res = await updateContact(id, fields);
    if (res.success) notifyDbChanged({ table: "contacts", action: "update" });
    return res;
  },

  async delete(_e: IpcMainInvokeEvent, id: string) {
    const res = await deleteContact(id);
    if (res.success) {
      notifyDbChanged({ table: "contacts", action: "delete" });
      notifyDbChanged({ table: "interactions", action: "delete" });
    }
    return res;
  },

  async markContacted(
    _e: IpcMainInvokeEvent,
    id: string,
    type?: Interaction["type"],
  ) {
    const res = await markContacted(id, type);
    if (res.success) {
      notifyDbChanged({ table: "contacts", action: "update" });
      notifyDbChanged({ table: "interactions", action: "create" });
    }
    return res;
  },
};
