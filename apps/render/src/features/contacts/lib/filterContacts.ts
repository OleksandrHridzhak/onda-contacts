import type { Contact, ContactSource } from "@onda/shared";
import { contactDisplayName } from "@onda/shared";
import type { ContactsSort } from "../stores/useContactsUiStore";

export interface ContactFilters {
  search: string;
  tagId: string | null;
  source: ContactSource | null;
  favoritesOnly: boolean;
  sort: ContactsSort;
}

const fold = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

function searchableText(contact: Contact): string {
  return fold(
    [
      contact.firstName,
      contact.lastName,
      contact.headline,
      contact.company,
      contact.position,
      contact.location,
      contact.notes,
      contact.howWeMet,
      ...contact.emails,
      ...contact.phones,
      ...Object.values(contact.socials),
    ].join(" "),
  );
}

const byName = (a: Contact, b: Contact) =>
  contactDisplayName(a).localeCompare(contactDisplayName(b));

const SORTERS: Record<ContactsSort, (a: Contact, b: Contact) => number> = {
  name: byName,
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b),
  lastContacted: (a, b) =>
    (b.lastContactedAt ?? "").localeCompare(a.lastContactedAt ?? "") ||
    byName(a, b),
};

export function filterContacts(
  contacts: Contact[],
  filters: ContactFilters,
): Contact[] {
  const terms = fold(filters.search).split(/\s+/).filter(Boolean);

  return contacts
    .filter((contact) => {
      if (filters.favoritesOnly && !contact.isFavorite) return false;
      if (filters.tagId && !contact.tagIds.includes(filters.tagId))
        return false;
      if (filters.source && !contact.sources.includes(filters.source))
        return false;
      if (terms.length === 0) return true;
      const text = searchableText(contact);
      return terms.every((term) => text.includes(term));
    })
    .sort(SORTERS[filters.sort]);
}
