import type {
  Contact,
  ContactDraft,
  ContactInput,
  ContactSocials,
  SocialPlatform,
} from "../types/models";

const SOCIAL_URL_PATTERNS: Record<
  Exclude<SocialPlatform, "website">,
  RegExp
> = {
  telegram: /(?:t\.me|telegram\.me|telegram\.dog)\/@?([^/?#]+)/i,
  instagram: /instagram\.com\/(?:_u\/)?@?([^/?#]+)/i,
  threads: /threads\.(?:net|com)\/@?([^/?#]+)/i,
  linkedin: /linkedin\.com\/(?:in|pub)\/([^/?#]+)/i,
  x: /(?:twitter|x)\.com\/@?([^/?#]+)/i,
  facebook: /facebook\.com\/([^/?#]+)/i,
  github: /github\.com\/([^/?#]+)/i,
};

const SOCIAL_URL_BUILDERS: Record<SocialPlatform, (h: string) => string> = {
  telegram: (h) => `https://t.me/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  threads: (h) => `https://www.threads.net/@${h}`,
  linkedin: (h) => `https://www.linkedin.com/in/${h}`,
  x: (h) => `https://x.com/${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  github: (h) => `https://github.com/${h}`,
  website: (h) => (/^https?:\/\//i.test(h) ? h : `https://${h}`),
};

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  telegram: "Telegram",
  instagram: "Instagram",
  threads: "Threads",
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  github: "GitHub",
  website: "Website",
};

/**
 * Turns "@user", "user" or a profile URL into a canonical handle
 * ("user"). Websites keep their URL (without trailing slash).
 */
export function normalizeHandle(
  platform: SocialPlatform,
  value: string | null | undefined,
): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  if (platform === "website") return raw.replace(/\/+$/, "");

  const match = SOCIAL_URL_PATTERNS[platform].exec(raw);
  const handle = match ? match[1] : raw;

  try {
    return decodeURIComponent(handle).replace(/^@/, "").replace(/\/+$/, "");
  } catch {
    return handle.replace(/^@/, "").replace(/\/+$/, "");
  }
}

export function socialUrl(platform: SocialPlatform, handle: string): string {
  return SOCIAL_URL_BUILDERS[platform](normalizeHandle(platform, handle));
}

export function normalizeSocials(socials?: ContactSocials): ContactSocials {
  const result: ContactSocials = {};
  if (!socials) return result;
  for (const [platform, value] of Object.entries(socials)) {
    const handle = normalizeHandle(platform as SocialPlatform, value);
    if (handle) result[platform as SocialPlatform] = handle;
  }
  return result;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Keeps digits and a leading "+" so numbers can be compared. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

/** Last 9 digits are a good-enough cross-format phone identity. */
function phoneKey(value: string): string {
  const digits = normalizePhone(value).replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-9) : "";
}

function nameKey(firstName: string, lastName: string): string {
  const parts = `${firstName} ${lastName}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort();
  // A single word ("Max") is too ambiguous to merge on. Handles made of
  // name parts ("olena.koval") intentionally match "Olena Koval".
  return parts.length >= 2 ? parts.join(" ") : "";
}

type Matchable = Pick<ContactDraft, "firstName" | "lastName"> & {
  emails?: string[];
  phones?: string[];
  socials?: ContactSocials;
};

/**
 * Identity keys used to dedupe contacts across sources. Two records
 * sharing any key are considered the same person.
 */
export function contactMatchKeys(record: Matchable): string[] {
  const keys = new Set<string>();

  for (const [platform, value] of Object.entries(record.socials ?? {})) {
    const handle = normalizeHandle(platform as SocialPlatform, value);
    if (!handle || platform === "website") continue;
    // Threads handles are always the Instagram handle.
    const scope = platform === "threads" ? "instagram" : platform;
    keys.add(`${scope}:${handle.toLowerCase()}`);
  }
  for (const email of record.emails ?? []) {
    const normalized = normalizeEmail(email);
    if (normalized) keys.add(`email:${normalized}`);
  }
  for (const phone of record.phones ?? []) {
    const key = phoneKey(phone);
    if (key) keys.add(`phone:${key}`);
  }
  const name = nameKey(record.firstName, record.lastName);
  if (name) keys.add(`name:${name}`);

  return [...keys];
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function uniqBy(values: string[], normalize: (v: string) => string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result;
}

function earliest(a?: string | null, b?: string | null): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a < b ? a : b;
}

function latest(a?: string | null, b?: string | null): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

function isHandleName(contact: Pick<Contact, "firstName" | "lastName">) {
  return !contact.lastName && !contact.firstName.includes(" ");
}

/**
 * Builds the fields to update on `existing` so it absorbs `draft`.
 * Never overwrites data the user already has; only fills gaps and
 * unions lists.
 */
export function mergeDraftIntoContact(
  existing: Contact,
  draft: ContactDraft,
): ContactInput {
  const socials = { ...normalizeSocials(draft.socials), ...existing.socials };
  const draftHasFullName = Boolean(draft.firstName && draft.lastName);
  const replaceName = draftHasFullName && isHandleName(existing);

  const appendNote =
    draft.notes && !existing.notes.includes(draft.notes)
      ? [existing.notes, draft.notes].filter(Boolean).join("\n\n")
      : existing.notes;

  return {
    firstName: replaceName ? draft.firstName : existing.firstName,
    lastName: replaceName ? draft.lastName : existing.lastName,
    headline: existing.headline || draft.headline || "",
    company: existing.company || draft.company || "",
    position: existing.position || draft.position || "",
    location: existing.location || draft.location || "",
    emails: uniqBy(
      [...existing.emails, ...(draft.emails ?? [])],
      normalizeEmail,
    ),
    phones: uniqBy([...existing.phones, ...(draft.phones ?? [])], phoneKey),
    socials,
    sources: uniq([...existing.sources, draft.source]),
    notes: appendNote,
    birthday: existing.birthday || draft.birthday || null,
    connectedAt: earliest(existing.connectedAt, draft.connectedAt),
    lastContactedAt: latest(existing.lastContactedAt, draft.lastContactedAt),
  };
}

export function draftToContactInput(draft: ContactDraft): ContactInput {
  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    headline:
      draft.headline ||
      [draft.position, draft.company].filter(Boolean).join(" at "),
    company: draft.company ?? "",
    position: draft.position ?? "",
    location: draft.location ?? "",
    emails: uniqBy(draft.emails ?? [], normalizeEmail),
    phones: uniqBy(draft.phones ?? [], phoneKey),
    socials: normalizeSocials(draft.socials),
    sources: [draft.source],
    notes: draft.notes ?? "",
    birthday: draft.birthday ?? null,
    connectedAt: draft.connectedAt ?? null,
    lastContactedAt: draft.lastContactedAt ?? null,
  };
}

export function contactDisplayName(
  contact: Pick<Contact, "firstName" | "lastName">,
): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || "Unnamed";
}

export function contactInitials(
  contact: Pick<Contact, "firstName" | "lastName">,
): string {
  const letters = [contact.firstName, contact.lastName]
    .map((part) => part.trim().replace(/^@/, "").charAt(0))
    .filter(Boolean)
    .join("");
  return (letters || "?").toUpperCase();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Days until the next keep-in-touch reminder (negative → overdue).
 * null when the contact has no cadence.
 */
export function daysUntilCheckIn(
  contact: Pick<Contact, "keepInTouchDays" | "lastContactedAt" | "createdAt">,
  now: Date = new Date(),
): number | null {
  if (!contact.keepInTouchDays) return null;
  const since = new Date(contact.lastContactedAt ?? contact.createdAt);
  const due = since.getTime() + contact.keepInTouchDays * DAY_MS;
  return Math.floor((due - now.getTime()) / DAY_MS);
}

/** Days until the next birthday (0 → today). null when unknown. */
export function daysUntilBirthday(
  birthday: string | null,
  now: Date = new Date(),
): number | null {
  if (!birthday) return null;
  const match = /(\d{2})-(\d{2})$/.exec(birthday);
  if (!match) return null;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month, day);
  return Math.round((next.getTime() - today.getTime()) / DAY_MS);
}
