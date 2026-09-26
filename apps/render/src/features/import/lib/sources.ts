import type { ContactSource } from "@onda/shared";

export interface ImportGuide {
  id: ContactSource;
  title: string;
  accepts: string;
  exportUrl?: string;
  steps: string[];
  note?: string;
}

export const IMPORT_GUIDES: ImportGuide[] = [
  {
    id: "telegram",
    title: "Telegram",
    accepts: "result.json or the export folder zipped",
    exportUrl: "https://desktop.telegram.org/",
    steps: [
      "Open Telegram Desktop → Settings → Advanced → Export Telegram data.",
      "Tick “Contacts list”. Optionally tick “Personal chats” (text only, no media) to get last-contacted dates.",
      "Set the format to “Machine-readable JSON” and export.",
      "Drop result.json (or the whole export folder as a .zip) here.",
    ],
    note: "Chats are only read for names and dates — message texts are never stored.",
  },
  {
    id: "instagram",
    title: "Instagram",
    accepts: "the .zip from “Download your information”",
    exportUrl: "https://accountscenter.instagram.com/info_and_permissions/dyi/",
    steps: [
      "Accounts Center → Your information and permissions → Download your information.",
      "Choose your Instagram account → “Some of your information” → “Followers and following” (and “Contacts” if you synced your phone).",
      "Format: JSON, date range: All time. Request the download.",
      "When Meta emails you, download the .zip and drop it here.",
    ],
    note: "You can import only mutual followers to keep the list personal.",
  },
  {
    id: "threads",
    title: "Threads",
    accepts: "the same Meta .zip (Threads section)",
    exportUrl: "https://accountscenter.instagram.com/info_and_permissions/dyi/",
    steps: [
      "Accounts Center → Download your information → pick your Threads profile.",
      "Select “Followers and following” under Threads, format JSON.",
      "Drop the .zip here — Threads profiles are matched with Instagram ones automatically.",
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    accepts: "Connections.csv or the LinkedIn .zip",
    exportUrl: "https://www.linkedin.com/mypreferences/d/download-my-data",
    steps: [
      "LinkedIn → Settings & Privacy → Data privacy → Get a copy of your data.",
      "Select “Connections” and request the archive (usually ready in ~10 minutes).",
      "Drop Connections.csv or the whole .zip here.",
    ],
    note: "Emails are included only for connections who allow it.",
  },
  {
    id: "vcard",
    title: "Phone / Google / iCloud",
    accepts: ".vcf files",
    exportUrl: "https://contacts.google.com/",
    steps: [
      "Google Contacts → Export → vCard. iCloud.com → Contacts → ⚙ → Export vCard.",
      "Android: Contacts app → Settings → Export → .vcf. iPhone: share contacts as vCard.",
      "Drop the .vcf file here.",
    ],
  },
  {
    id: "csv",
    title: "Any CSV",
    accepts: ".csv with name/email/phone columns",
    steps: [
      "Use columns like First Name, Last Name, Email, Phone, Company, Telegram, Instagram, LinkedIn.",
      "Google Contacts / Outlook CSV exports work as-is.",
    ],
  },
];
