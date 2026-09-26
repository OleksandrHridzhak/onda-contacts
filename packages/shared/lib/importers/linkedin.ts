import type { Importer, ImportDraft, ImportFile } from "./types";
import { parseCsvRecords } from "./csv";
import { fileBaseName, toIsoDate } from "./utils";

/** LinkedIn "Get a copy of your data" → Connections.csv */

const isHeader = (cells: string[]) =>
  cells.includes("First Name") &&
  cells.includes("Last Name") &&
  cells.includes("URL");

export const linkedinImporter: Importer = {
  source: "linkedin",

  accepts(file: ImportFile) {
    if (!fileBaseName(file.name).endsWith(".csv")) return false;
    const head = file.content.slice(0, 3000);
    return (
      (head.includes("First Name") && head.includes("linkedin.com")) ||
      (head.includes("First Name") && head.includes("Connected On"))
    );
  },

  parse(files: ImportFile[]) {
    const drafts: ImportDraft[] = [];

    for (const file of files) {
      for (const row of parseCsvRecords(file.content, isHeader)) {
        const firstName = row["First Name"] ?? "";
        const lastName = row["Last Name"] ?? "";
        if (!firstName && !lastName) continue;
        const company = row["Company"] ?? "";
        const position = row["Position"] ?? "";
        const email = row["Email Address"] ?? "";
        drafts.push({
          source: "linkedin",
          firstName,
          lastName,
          company,
          position,
          headline: [position, company].filter(Boolean).join(" at "),
          emails: email ? [email] : [],
          socials: row["URL"] ? { linkedin: row["URL"] } : {},
          connectedAt: toIsoDate(row["Connected On"]),
        });
      }
    }

    return drafts;
  },
};
