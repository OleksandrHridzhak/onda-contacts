import type { Contact as ContactRow, Prisma } from "@prisma/client";
import type { Contact, ContactInput } from "@onda/shared";
import { normalizeSocials } from "@onda/shared";
import { safeJsonParse, safeJsonStringify } from "../../../core/utils";

const toIso = (value: Date | null): string | null =>
  value ? new Date(value).toISOString() : null;

const toDate = (value: string | null | undefined): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function serializeContact(row: ContactRow): Contact {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    headline: row.headline,
    company: row.company,
    position: row.position,
    location: row.location,
    emails: safeJsonParse<string[]>(row.emails, []),
    phones: safeJsonParse<string[]>(row.phones, []),
    socials: safeJsonParse<Contact["socials"]>(row.socials, {}),
    tagIds: safeJsonParse<string[]>(row.tagIds, []),
    sources: safeJsonParse<Contact["sources"]>(row.sources, []),
    notes: row.notes,
    howWeMet: row.howWeMet,
    birthday: row.birthday,
    avatarColor: row.avatarColor,
    isFavorite: row.isFavorite,
    keepInTouchDays: row.keepInTouchDays,
    lastContactedAt: toIso(row.lastContactedAt),
    connectedAt: toIso(row.connectedAt),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/** Maps a partial ContactInput to Prisma column values (JSON-encoded). */
export function toContactData(
  input: ContactInput,
): Prisma.ContactUncheckedUpdateInput {
  const data: Record<string, unknown> = {};
  const plainKeys = [
    "firstName",
    "lastName",
    "headline",
    "company",
    "position",
    "location",
    "notes",
    "howWeMet",
    "birthday",
    "avatarColor",
    "isFavorite",
    "keepInTouchDays",
  ] as const;

  for (const key of plainKeys) {
    if (input[key] !== undefined) data[key] = input[key];
  }
  for (const key of ["emails", "phones", "tagIds", "sources"] as const) {
    if (input[key] !== undefined)
      data[key] = safeJsonStringify(input[key], "[]");
  }
  if (input.socials !== undefined) {
    data.socials = safeJsonStringify(normalizeSocials(input.socials));
  }
  const lastContactedAt = toDate(input.lastContactedAt);
  if (lastContactedAt !== undefined) data.lastContactedAt = lastContactedAt;
  const connectedAt = toDate(input.connectedAt);
  if (connectedAt !== undefined) data.connectedAt = connectedAt;

  return data as Prisma.ContactUncheckedUpdateInput;
}
