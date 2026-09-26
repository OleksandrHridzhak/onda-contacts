import type { ContactSocials, SocialPlatform } from "../../types/models";
import type { Importer, ImportDraft, ImportFile } from "./types";
import { parseCsvRecords } from "./csv";
import { fileBaseName, normalizeBirthday, splitFullName } from "./utils";

/**
 * Generic contacts CSV (Google Contacts, Outlook, Apple Numbers, any
 * hand-made sheet). Columns are matched by fuzzy header names.
 */

const pick = (row: Record<string, string>, patterns: RegExp[]): string[] => {
  const values: string[] = [];
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    if (patterns.some((pattern) => pattern.test(key))) {
      values.push(...value.split(/\s*:::\s*/));
    }
  }
  return values.filter(Boolean);
};

const first = (row: Record<string, string>, patterns: RegExp[]) =>
  pick(row, patterns)[0] ?? "";

const SOCIAL_COLUMNS: [SocialPlatform, RegExp][] = [
  ["telegram", /telegram/i],
  ["instagram", /instagram/i],
  ["threads", /threads/i],
  ["linkedin", /linkedin/i],
  ["x", /twitter|^x$/i],
  ["facebook", /facebook/i],
  ["github", /github/i],
  ["website", /website|web page|^url$/i],
];

const looksLikeContactsHeader = (cells: string[]) =>
  cells.some((c) =>
    /^(first ?name|given name|name|full name|ім'я|имя)$/i.test(c),
  );

export const genericCsvImporter: Importer = {
  source: "csv",

  accepts(file: ImportFile) {
    return fileBaseName(file.name).endsWith(".csv");
  },

  parse(files: ImportFile[]) {
    const drafts: ImportDraft[] = [];

    for (const file of files) {
      for (const row of parseCsvRecords(
        file.content,
        looksLikeContactsHeader,
      )) {
        let firstName = first(row, [
          /^first ?name$/i,
          /^given name$/i,
          /^ім'я$/i,
        ]);
        let lastName = first(row, [
          /^last ?name$/i,
          /^family name$/i,
          /^surname$/i,
          /^прізвище$/i,
        ]);
        const fullName = first(row, [/^(full )?name$/i]);
        if (!firstName && !lastName && fullName) {
          ({ firstName, lastName } = splitFullName(fullName));
        }
        if (!firstName && !lastName) continue;

        const socials: ContactSocials = {};
        for (const [platform, pattern] of SOCIAL_COLUMNS) {
          const value = first(row, [pattern]);
          if (value) socials[platform] = value;
        }

        const company = first(row, [/organi[sz]ation.*name/i, /^company$/i]);
        const position = first(row, [
          /organi[sz]ation.*title/i,
          /^(job )?title$/i,
          /^position$/i,
        ]);

        drafts.push({
          source: "csv",
          firstName,
          lastName,
          company,
          position,
          headline:
            first(row, [/^headline$/i]) ||
            [position, company].filter(Boolean).join(" at "),
          emails: pick(row, [/e-?mail.*value/i, /^e-?mail( address)?$/i]),
          phones: pick(row, [
            /phone.*value/i,
            /^(mobile )?phone( number)?$/i,
            /^mobile$/i,
          ]),
          socials,
          location: first(row, [/^(city|location)$/i, /address.*city/i]),
          notes: first(row, [/^notes?$/i]),
          birthday: normalizeBirthday(first(row, [/^birthday$/i])),
        });
      }
    }

    return drafts;
  },
};
