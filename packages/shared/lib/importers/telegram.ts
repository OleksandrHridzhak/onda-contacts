import type { Importer, ImportDraft, ImportFile } from "./types";
import { fileBaseName, splitFullName, toIsoDate, tryParseJson } from "./utils";

interface TelegramContact {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date?: string;
  date_unixtime?: string;
}

interface TelegramMessage {
  date?: string;
  date_unixtime?: string;
  type?: string;
}

interface TelegramChat {
  name?: string | null;
  type?: string;
  id?: number;
  messages?: TelegramMessage[];
}

interface TelegramExport {
  contacts?: { list?: TelegramContact[] };
  frequent_contacts?: { list?: { name?: string; category?: string }[] };
  chats?: { list?: TelegramChat[] };
  // Single-chat export
  name?: string;
  type?: string;
  messages?: TelegramMessage[];
}

const SKIPPED_NAMES = new Set(["deleted account", ""]);

function isTelegramExport(data: unknown): data is TelegramExport {
  if (!data || typeof data !== "object") return false;
  const obj = data as TelegramExport;
  return Boolean(
    obj.contacts?.list ||
    obj.chats?.list ||
    (obj.type === "personal_chat" && Array.isArray(obj.messages)),
  );
}

function lastMessageDate(chat: TelegramChat): string | null {
  const messages = (chat.messages ?? []).filter((m) => m.type !== "service");
  const last = messages[messages.length - 1];
  return last ? toIsoDate(last.date_unixtime ?? last.date) : null;
}

function chatToDraft(chat: TelegramChat): ImportDraft | null {
  if (chat.type !== "personal_chat") return null;
  const name = (chat.name ?? "").trim();
  if (SKIPPED_NAMES.has(name.toLowerCase())) return null;
  return {
    source: "telegram",
    ...splitFullName(name),
    lastContactedAt: lastMessageDate(chat),
  };
}

export const telegramImporter: Importer = {
  source: "telegram",

  accepts(file: ImportFile) {
    if (!fileBaseName(file.name).endsWith(".json")) return false;
    if (!/"(contacts|chats|personal_chat)"/.test(file.content.slice(0, 50000)))
      return false;
    return isTelegramExport(tryParseJson(file.content));
  },

  parse(files: ImportFile[]) {
    const drafts: ImportDraft[] = [];

    for (const file of files) {
      const data = tryParseJson(file.content);
      if (!isTelegramExport(data)) continue;

      for (const contact of data.contacts?.list ?? []) {
        const firstName = (contact.first_name ?? "").trim();
        const lastName = (contact.last_name ?? "").trim();
        if (!firstName && !lastName && !contact.phone_number) continue;
        drafts.push({
          source: "telegram",
          firstName: firstName || contact.phone_number || "",
          lastName,
          phones: contact.phone_number ? [contact.phone_number] : [],
          connectedAt: toIsoDate(contact.date_unixtime ?? contact.date),
        });
      }

      for (const chat of data.chats?.list ?? []) {
        const draft = chatToDraft(chat);
        if (draft) drafts.push(draft);
      }

      if (data.type === "personal_chat") {
        const draft = chatToDraft(data as TelegramChat);
        if (draft) drafts.push(draft);
      }
    }

    return drafts;
  },
};
