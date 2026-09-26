import type { ContactDraft, ContactSource } from "../../types/models";

/** A text file extracted from an export (or picked directly). */
export interface ImportFile {
  /** Path inside the archive or plain file name. */
  name: string;
  content: string;
}

export type ImportRelation = "follower" | "following" | "close_friend";

export interface ImportDraft extends ContactDraft {
  /** Social-graph relations (Instagram / Threads) used for filtering. */
  relations?: ImportRelation[];
}

export interface Importer {
  source: ContactSource;
  /** True when this importer understands the file. */
  accepts(file: ImportFile): boolean;
  parse(files: ImportFile[]): ImportDraft[];
}
