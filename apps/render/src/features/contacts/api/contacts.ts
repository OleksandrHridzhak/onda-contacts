import { api } from "shared/api/client";
import type {
  ContactInput,
  Interaction,
  InteractionInput,
  Tag,
} from "@onda/shared";

export const createContact = (input: ContactInput) =>
  api.contacts.create(input);

export const updateContact = (id: string, fields: ContactInput) =>
  api.contacts.update(id, fields);

export const deleteContact = (id: string) => api.contacts.delete(id);

export const markContacted = (id: string, type?: Interaction["type"]) =>
  api.contacts.markContacted(id, type);

export const createInteraction = (input: InteractionInput) =>
  api.interactions.create(input);

export const deleteInteraction = (id: string) => api.interactions.delete(id);

export const saveTag = (tag: Tag | Omit<Tag, "id">) => api.tags.save(tag);

export const deleteTag = (id: string) => api.tags.delete(id);
