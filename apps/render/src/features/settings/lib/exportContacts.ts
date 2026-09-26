import type { Contact, Tag } from "@onda/shared";
import { SOCIAL_PLATFORMS } from "@onda/shared";

const escapeCsv = (value: string) =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** CSV that the "Any CSV" importer can read back (no lock-in). */
export function contactsToCsv(contacts: Contact[], tags: Tag[]): string {
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const header = [
    "First Name",
    "Last Name",
    "Headline",
    "Company",
    "Position",
    "Location",
    "Email",
    "Phone",
    ...SOCIAL_PLATFORMS.map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
    "Birthday",
    "Tags",
    "How We Met",
    "Notes",
    "Last Contacted",
  ];

  const rows = contacts.map((contact) => [
    contact.firstName,
    contact.lastName,
    contact.headline,
    contact.company,
    contact.position,
    contact.location,
    contact.emails.join(" ::: "),
    contact.phones.join(" ::: "),
    ...SOCIAL_PLATFORMS.map((platform) => contact.socials[platform] ?? ""),
    contact.birthday ?? "",
    contact.tagIds
      .map((id) => tagNames.get(id) ?? "")
      .filter(Boolean)
      .join(", "),
    contact.howWeMet,
    contact.notes,
    contact.lastContactedAt ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(String(cell))).join(","))
    .join("\n");
}

export function downloadTextFile(
  fileName: string,
  content: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
