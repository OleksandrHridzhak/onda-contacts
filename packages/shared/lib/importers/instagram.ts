import type {
  Importer,
  ImportDraft,
  ImportFile,
  ImportRelation,
} from "./types";
import {
  fileBaseName,
  fixMetaEncoding,
  toIsoDate,
  tryParseJson,
} from "./utils";

/**
 * Handles Instagram "Download your information" (JSON) exports, which
 * also contain Threads followers/following.
 */

interface StringListItem {
  href?: string;
  value?: string;
  timestamp?: number;
}

interface RelationshipItem {
  title?: string;
  string_list_data?: StringListItem[];
}

interface SyncedContact {
  string_map_data?: Record<string, { value?: string }>;
}

type Platform = "instagram" | "threads";

function detectRelation(key: string, fileName: string): ImportRelation | null {
  const hint = `${key} ${fileName}`.toLowerCase();
  if (hint.includes("close_friends")) return "close_friend";
  if (hint.includes("following")) return "following";
  if (hint.includes("follower")) return "follower";
  return null;
}

function detectPlatform(key: string, fileName: string, href = ""): Platform {
  const hint = `${key} ${fileName} ${href}`.toLowerCase();
  return hint.includes("text_post_app") ||
    hint.includes("threads") ||
    /threads\.(net|com)/.test(hint)
    ? "threads"
    : "instagram";
}

function handleFromItem(item: RelationshipItem): string {
  const data = item.string_list_data?.[0];
  const fromHref = data?.href?.match(
    /\.(?:com|net)\/(?:_u\/)?@?([^/?#]+)/,
  )?.[1];
  return (data?.value || item.title || fromHref || "").trim().replace(/^@/, "");
}

function collectRelationshipArrays(
  data: unknown,
): { key: string; items: RelationshipItem[] }[] {
  if (Array.isArray(data)) return [{ key: "", items: data }];
  if (!data || typeof data !== "object") return [];
  return Object.entries(data as Record<string, unknown>)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, items: value as RelationshipItem[] }));
}

function isRelationshipArray(items: unknown[]): boolean {
  return items.some(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      Array.isArray((item as RelationshipItem).string_list_data),
  );
}

function parseSyncedContacts(items: SyncedContact[]): ImportDraft[] {
  const drafts: ImportDraft[] = [];
  for (const item of items) {
    const map = item.string_map_data ?? {};
    const firstName = fixMetaEncoding(map["First Name"]?.value ?? "").trim();
    const lastName = fixMetaEncoding(map["Last Name"]?.value ?? "").trim();
    const info = (map["Contact Information"]?.value ?? "").trim();
    if (!firstName && !lastName) continue;
    const isEmail = info.includes("@");
    drafts.push({
      source: "instagram",
      firstName,
      lastName,
      emails: info && isEmail ? [info] : [],
      phones: info && !isEmail ? [info] : [],
    });
  }
  return drafts;
}

export const instagramImporter: Importer = {
  source: "instagram",

  accepts(file: ImportFile) {
    if (!fileBaseName(file.name).endsWith(".json")) return false;
    const head = file.content.slice(0, 5000);
    return (
      head.includes("string_list_data") || head.includes("string_map_data")
    );
  },

  parse(files: ImportFile[]) {
    // key: platform:handle → draft
    const byHandle = new Map<string, ImportDraft>();
    const synced: ImportDraft[] = [];

    for (const file of files) {
      const data = tryParseJson(file.content);
      const fileName = fileBaseName(file.name);

      if (data && typeof data === "object" && "contacts_contact_info" in data) {
        synced.push(
          ...parseSyncedContacts(
            (data as { contacts_contact_info: SyncedContact[] })
              .contacts_contact_info,
          ),
        );
        continue;
      }

      for (const { key, items } of collectRelationshipArrays(data)) {
        if (!isRelationshipArray(items)) continue;
        const relation = detectRelation(key, fileName);
        if (!relation) continue;

        for (const item of items) {
          const handle = fixMetaEncoding(handleFromItem(item));
          if (!handle) continue;
          const href = item.string_list_data?.[0]?.href ?? "";
          const platform = detectPlatform(key, fileName, href);
          const mapKey = `${platform}:${handle.toLowerCase()}`;
          const timestamp = toIsoDate(item.string_list_data?.[0]?.timestamp);

          const existing = byHandle.get(mapKey);
          if (existing) {
            if (!existing.relations?.includes(relation)) {
              existing.relations = [...(existing.relations ?? []), relation];
            }
            if (
              timestamp &&
              (!existing.connectedAt || timestamp < existing.connectedAt)
            ) {
              existing.connectedAt = timestamp;
            }
            continue;
          }

          byHandle.set(mapKey, {
            source: platform,
            firstName: handle,
            lastName: "",
            socials: { [platform]: handle },
            connectedAt: timestamp,
            relations: [relation],
          });
        }
      }
    }

    return [...byHandle.values(), ...synced];
  },
};
