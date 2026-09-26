import { api } from "shared/api/client";
import type { ContactDraft } from "@onda/shared";

export const importDrafts = (drafts: ContactDraft[]) =>
  api.import.importDrafts(drafts);
