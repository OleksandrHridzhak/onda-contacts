export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const SOCIAL_PLATFORMS = [
  "telegram",
  "instagram",
  "threads",
  "linkedin",
  "x",
  "facebook",
  "github",
  "website",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Handle (username / profile URL) per platform. */
export type ContactSocials = Partial<Record<SocialPlatform, string>>;

/** Where a contact (or a part of it) came from. */
export type ContactSource =
  | "manual"
  | "telegram"
  | "instagram"
  | "threads"
  | "linkedin"
  | "vcard"
  | "csv";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  /** Short "who is this" line, e.g. "Product Designer at Figma". */
  headline: string;
  company: string;
  position: string;
  location: string;
  emails: string[];
  phones: string[];
  socials: ContactSocials;
  tagIds: string[];
  sources: ContactSource[];
  notes: string;
  howWeMet: string;
  /** ISO date (YYYY-MM-DD) or "--MM-DD" when the year is unknown. */
  birthday: string | null;
  avatarColor: string;
  isFavorite: boolean;
  /** Keep-in-touch cadence in days. null/0 → no reminder. */
  keepInTouchDays: number | null;
  lastContactedAt: string | null;
  /** When the connection was made on the source network (if known). */
  connectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContactInput = Partial<
  Omit<Contact, "id" | "createdAt" | "updatedAt">
>;

export type InteractionType = "note" | "call" | "meeting" | "message" | "email";

export interface Interaction {
  id: string;
  contactId: string;
  type: InteractionType;
  text: string;
  date: string;
  createdAt: string;
}

export type InteractionInput = Omit<Interaction, "id" | "createdAt">;

/**
 * A contact candidate produced by an importer, before it is merged
 * into the database.
 */
export interface ContactDraft {
  source: ContactSource;
  firstName: string;
  lastName: string;
  headline?: string;
  company?: string;
  position?: string;
  location?: string;
  emails?: string[];
  phones?: string[];
  socials?: ContactSocials;
  notes?: string;
  birthday?: string | null;
  connectedAt?: string | null;
  lastContactedAt?: string | null;
}

export interface ImportSummary {
  created: number;
  merged: number;
  skipped: number;
}

export interface Setting {
  id: "global";
  preferences: {
    /** Default cadence applied to newly created contacts (0 → none). */
    defaultKeepInTouchDays: number;
  };
}
