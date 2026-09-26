import type { ContactSource } from "../../types/models";
import type { Importer, ImportDraft, ImportFile } from "./types";
import { telegramImporter } from "./telegram";
import { instagramImporter } from "./instagram";
import { linkedinImporter } from "./linkedin";
import { vcardImporter } from "./vcard";
import { genericCsvImporter } from "./genericCsv";

export * from "./types";
export { parseCsv, parseCsvRecords } from "./csv";
export { fixMetaEncoding } from "./utils";

/** Order matters: specific importers first, generic CSV last. */
const IMPORTERS: Importer[] = [
  telegramImporter,
  instagramImporter,
  linkedinImporter,
  vcardImporter,
  genericCsvImporter,
];

export interface ParsedImport {
  drafts: ImportDraft[];
  /** Number of files recognised per importer. */
  filesBySource: Partial<Record<ContactSource, number>>;
  /** Files that no importer understood. */
  unrecognized: string[];
}

/**
 * Routes each file to the first importer that accepts it and returns
 * the combined contact drafts. Pure: no I/O, safe in any process.
 */
export function parseImportFiles(files: ImportFile[]): ParsedImport {
  const grouped = new Map<Importer, ImportFile[]>();
  const unrecognized: string[] = [];

  for (const file of files) {
    const importer = IMPORTERS.find((candidate) => candidate.accepts(file));
    if (!importer) {
      unrecognized.push(file.name);
      continue;
    }
    grouped.set(importer, [...(grouped.get(importer) ?? []), file]);
  }

  const drafts: ImportDraft[] = [];
  const filesBySource: ParsedImport["filesBySource"] = {};
  for (const [importer, importerFiles] of grouped) {
    drafts.push(...importer.parse(importerFiles));
    filesBySource[importer.source] = importerFiles.length;
  }

  return { drafts, filesBySource, unrecognized };
}

/** File extensions worth reading from an export archive. */
export const IMPORTABLE_EXTENSIONS = [".json", ".csv", ".vcf", ".vcard"];

/**
 * Archive paths worth extracting. Telegram / Instagram exports contain
 * thousands of media files and message logs we don't need.
 */
export function isRelevantExportPath(path: string): boolean {
  const lower = path.toLowerCase();
  if (!IMPORTABLE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
  if (lower.includes("__macosx/")) return false;
  if (lower.endsWith(".json")) {
    return (
      lower.endsWith("result.json") ||
      /(followers|following|close_friends|synced_contacts|contacts)[^/]*\.json$/.test(
        lower,
      )
    );
  }
  return true;
}
