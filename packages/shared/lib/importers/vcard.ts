import type { ContactSocials, SocialPlatform } from "../../types/models";
import type { Importer, ImportDraft, ImportFile } from "./types";
import { fileBaseName, normalizeBirthday, splitFullName } from "./utils";

/** vCard 2.1 / 3.0 / 4.0 — iPhone, Android, Google Contacts, Outlook. */

interface VCardLine {
  name: string;
  params: string[];
  value: string;
}

function decodeQuotedPrintable(value: string): string {
  const bytes: number[] = [];
  const input = value.replace(/=\r?\n/g, "");
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "=" && /^[0-9A-F]{2}$/i.test(input.slice(i + 1, i + 3))) {
      bytes.push(parseInt(input.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(input.charCodeAt(i));
    }
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\([,;:\\])/g, "$1")
    .trim();
}

function parseLines(card: string): VCardLine[] {
  // Unfold continuation lines (RFC 6350 §3.2) and QP soft breaks.
  const unfolded = card
    .replace(/=\r?\n(?=[^\r\n])/g, "=\n")
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/);

  const lines: VCardLine[] = [];
  let pendingQp = "";

  for (const raw of unfolded) {
    const line = pendingQp ? `${pendingQp}\n${raw}` : raw;
    if (/ENCODING=QUOTED-PRINTABLE/i.test(line) && line.endsWith("=")) {
      pendingQp = line;
      continue;
    }
    pendingQp = "";

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const [nameWithGroup, ...params] = line.slice(0, colon).split(";");
    const name = nameWithGroup.split(".").pop()!.toUpperCase();
    let value = line.slice(colon + 1);
    if (params.some((p) => /QUOTED-PRINTABLE/i.test(p))) {
      value = decodeQuotedPrintable(value);
    }
    lines.push({ name, params: params.map((p) => p.toUpperCase()), value });
  }

  return lines;
}

const SOCIAL_HINTS: [SocialPlatform, RegExp][] = [
  ["telegram", /telegram|t\.me/i],
  ["instagram", /instagram/i],
  ["threads", /threads/i],
  ["linkedin", /linkedin/i],
  ["x", /twitter|x\.com/i],
  ["facebook", /facebook/i],
  ["github", /github/i],
];

function socialFromLine(line: VCardLine): [SocialPlatform, string] | null {
  const hint = `${line.params.join(";")} ${line.value}`;
  for (const [platform, pattern] of SOCIAL_HINTS) {
    if (pattern.test(hint)) return [platform, unescapeValue(line.value)];
  }
  return null;
}

function cardToDraft(card: string): ImportDraft | null {
  const lines = parseLines(card);
  let firstName = "";
  let lastName = "";
  let fullName = "";
  const emails: string[] = [];
  const phones: string[] = [];
  const socials: ContactSocials = {};
  let company = "";
  let position = "";
  let birthday: string | null = null;
  let notes = "";

  for (const line of lines) {
    const value = unescapeValue(line.value);
    switch (line.name) {
      case "N": {
        const [family = "", given = "", additional = ""] = line.value
          .split(";")
          .map(unescapeValue);
        firstName = [given, additional].filter(Boolean).join(" ");
        lastName = family;
        break;
      }
      case "FN":
        fullName = value;
        break;
      case "EMAIL":
        if (value) emails.push(value);
        break;
      case "TEL":
        if (value) phones.push(value.replace(/^tel:/i, ""));
        break;
      case "ORG":
        company = line.value
          .split(";")
          .map(unescapeValue)
          .filter(Boolean)
          .join(", ");
        break;
      case "TITLE":
        position = value;
        break;
      case "BDAY":
        birthday = normalizeBirthday(value);
        break;
      case "NOTE":
        notes = value;
        break;
      case "URL":
      case "X-SOCIALPROFILE":
      case "IMPP": {
        const social = socialFromLine(line);
        if (social) socials[social[0]] = social[1];
        else if (line.name === "URL" && value) socials.website = value;
        break;
      }
      default:
        if (line.name.startsWith("X-TELEGRAM")) socials.telegram = value;
        if (line.name.startsWith("X-INSTAGRAM")) socials.instagram = value;
    }
  }

  if (!firstName && !lastName && fullName) {
    ({ firstName, lastName } = splitFullName(fullName));
  }
  if (!firstName && !lastName) {
    firstName = company || emails[0] || phones[0] || "";
  }
  if (!firstName && !lastName) return null;

  return {
    source: "vcard",
    firstName,
    lastName,
    company,
    position,
    headline: [position, company].filter(Boolean).join(" at "),
    emails,
    phones,
    socials,
    birthday,
    notes,
  };
}

export const vcardImporter: Importer = {
  source: "vcard",

  accepts(file: ImportFile) {
    const name = fileBaseName(file.name);
    return (
      name.endsWith(".vcf") ||
      name.endsWith(".vcard") ||
      /BEGIN:VCARD/i.test(file.content.slice(0, 200))
    );
  },

  parse(files: ImportFile[]) {
    const drafts: ImportDraft[] = [];
    for (const file of files) {
      const cards = file.content.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) ?? [];
      for (const card of cards) {
        const draft = cardToDraft(card);
        if (draft) drafts.push(draft);
      }
    }
    return drafts;
  },
};
