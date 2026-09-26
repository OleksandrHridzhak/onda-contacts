import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../core/lib/database";
import { safeDbCall } from "../../../core/utils";
import type { Contact, ContactInput, DbResult } from "@onda/shared";
import { serializeContact, toContactData } from "./serialize-contact";
import { getPreferences } from "../../settings/services/get-settings";

const AVATAR_COLORS = [
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "accent7",
  "accent8",
  "accent9",
  "accent10",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/** In-memory contact with defaults applied (shared with the importer). */
export function buildNewContact(
  input: ContactInput,
  defaultKeepInTouchDays: number,
): Contact {
  const now = new Date().toISOString();
  const defined = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as ContactInput;

  return {
    firstName: "",
    lastName: "",
    headline: "",
    company: "",
    position: "",
    location: "",
    emails: [],
    phones: [],
    socials: {},
    tagIds: [],
    sources: ["manual"],
    notes: "",
    howWeMet: "",
    birthday: null,
    avatarColor: randomAvatarColor(),
    isFavorite: false,
    keepInTouchDays: defaultKeepInTouchDays || null,
    lastContactedAt: null,
    connectedAt: null,
    ...defined,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
}

export function toContactCreateData(
  contact: Contact,
): Prisma.ContactUncheckedCreateInput {
  return {
    id: contact.id,
    ...(toContactData(contact) as Omit<
      Prisma.ContactUncheckedCreateInput,
      "id"
    >),
  };
}

export async function createContact(
  input: ContactInput,
): Promise<DbResult<Contact>> {
  return safeDbCall(async () => {
    const preferences = await getPreferences();
    const contact = buildNewContact(input, preferences.defaultKeepInTouchDays);
    const row = await prisma.contact.create({
      data: toContactCreateData(contact),
    });
    return serializeContact(row);
  });
}
