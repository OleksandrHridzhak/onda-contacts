import type {
  Contact,
  DbChangeEvent,
  IContactsAppApi,
  Interaction,
  Setting,
  Tag,
} from "@onda/shared";
import {
  contactMatchKeys,
  draftToContactInput,
  mergeDraftIntoContact,
} from "@onda/shared";

const ok = <T>(data: T) => ({ success: true, data });
const notFound = (what: string) => ({
  success: false,
  error: `${what} not found`,
});

/**
 * In-memory driver so the UI can run in a plain browser (vite dev /
 * preview) without the Electron IPC bridge. Mirrors the desktop services.
 */
function createMemoryFallbackApi(): IContactsAppApi {
  const listeners = new Set<(event: DbChangeEvent) => void>();
  let contacts: Contact[] = [];
  let interactions: Interaction[] = [];
  let tags: Tag[] = [
    { id: "tag-friends", name: "Friends", color: "accent2" },
    { id: "tag-family", name: "Family", color: "accent4" },
    { id: "tag-work", name: "Work", color: "accent6" },
  ];
  let settings: Setting = {
    id: "global",
    preferences: { defaultKeepInTouchDays: 0 },
  };

  const emit = (event: DbChangeEvent) => {
    queueMicrotask(() => listeners.forEach((listener) => listener(event)));
  };

  const newContact = (input: Partial<Contact>): Contact => {
    const now = new Date().toISOString();
    const defined = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    return {
      firstName: "",
      lastName: "",
      headline: "",
      company: "",
      position: "",
      location: "",
      emails: [],
      phones: [],
      socials: {},
      tagIds: [],
      sources: ["manual"],
      notes: "",
      howWeMet: "",
      birthday: null,
      avatarColor: `accent${1 + Math.floor(Math.random() * 10)}`,
      isFavorite: false,
      keepInTouchDays: settings.preferences.defaultKeepInTouchDays || null,
      lastContactedAt: null,
      connectedAt: null,
      ...defined,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  };

  const patchContact = (id: string, fields: Partial<Contact>) => {
    const index = contacts.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    contacts[index] = {
      ...contacts[index],
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    return contacts[index];
  };

  console.warn(
    "[Onda Contacts API] Running without Electron IPC bridge. Using in-memory fallback.",
  );

  return {
    contacts: {
      getAll: async () => ok([...contacts]),
      getById: async (id) => {
        const contact = contacts.find((c) => c.id === id);
        return contact ? ok(contact) : notFound("Contact");
      },
      create: async (input) => {
        const contact = newContact(input);
        contacts.push(contact);
        emit({ table: "contacts", action: "create" });
        return ok(contact);
      },
      update: async (id, fields) => {
        const contact = patchContact(id, fields);
        if (!contact) return notFound("Contact");
        emit({ table: "contacts", action: "update" });
        return ok(contact);
      },
      delete: async (id) => {
        contacts = contacts.filter((c) => c.id !== id);
        interactions = interactions.filter((i) => i.contactId !== id);
        emit({ table: "contacts", action: "delete" });
        return ok({ contactId: id });
      },
      markContacted: async (id, type = "message") => {
        const now = new Date().toISOString();
        const contact = patchContact(id, { lastContactedAt: now });
        if (!contact) return notFound("Contact");
        interactions.push({
          id: crypto.randomUUID(),
          contactId: id,
          type,
          text: "",
          date: now,
          createdAt: now,
        });
        emit({ table: "contacts", action: "update" });
        emit({ table: "interactions", action: "create" });
        return ok(contact);
      },
    },
    interactions: {
      getForContact: async (contactId) =>
        ok(
          interactions
            .filter((i) => i.contactId === contactId)
            .sort((a, b) => b.date.localeCompare(a.date)),
        ),
      create: async (input) => {
        const interaction: Interaction = {
          ...input,
          date: input.date || new Date().toISOString(),
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        interactions.push(interaction);
        const contact = contacts.find((c) => c.id === input.contactId);
        if (
          contact &&
          input.type !== "note" &&
          (!contact.lastContactedAt ||
            contact.lastContactedAt < interaction.date)
        ) {
          patchContact(contact.id, { lastContactedAt: interaction.date });
        }
        emit({ table: "interactions", action: "create" });
        emit({ table: "contacts", action: "update" });
        return ok(interaction);
      },
      delete: async (id) => {
        interactions = interactions.filter((i) => i.id !== id);
        emit({ table: "interactions", action: "delete" });
        return ok({ interactionId: id });
      },
    },
    tags: {
      getAll: async () => ok([...tags]),
      save: async (tag) => {
        const saved: Tag = {
          ...tag,
          id: "id" in tag && tag.id ? tag.id : crypto.randomUUID(),
        };
        tags = [...tags.filter((t) => t.id !== saved.id), saved];
        emit({ table: "tags", action: "update" });
        return ok(saved);
      },
      delete: async (id) => {
        tags = tags.filter((t) => t.id !== id);
        contacts = contacts.map((c) => ({
          ...c,
          tagIds: c.tagIds.filter((tagId) => tagId !== id),
        }));
        emit({ table: "tags", action: "delete" });
        emit({ table: "contacts", action: "update" });
        return ok({ tagId: id });
      },
    },
    import: {
      importDrafts: async (drafts) => {
        const summary = { created: 0, merged: 0, skipped: 0 };
        for (const draft of drafts) {
          if (!draft.firstName && !draft.lastName) {
            summary.skipped++;
            continue;
          }
          const keys = new Set(contactMatchKeys(draft));
          const match = contacts.find((c) =>
            contactMatchKeys(c).some((key) => keys.has(key)),
          );
          if (match) {
            patchContact(match.id, mergeDraftIntoContact(match, draft));
            summary.merged++;
          } else {
            contacts.push(newContact(draftToContactInput(draft)));
            summary.created++;
          }
        }
        emit({ table: "contacts", action: "import" });
        return ok(summary);
      },
    },
    settings: {
      get: async () => ok(settings),
      update: async (updates) => {
        settings = {
          ...settings,
          preferences: { ...settings.preferences, ...updates.preferences },
        };
        emit({ table: "settings", action: "update" });
        return ok({ updatedCount: 1 });
      },
    },
    system: {
      clearAllData: async () => {
        contacts = [];
        interactions = [];
        tags = [];
        emit({ table: "all", action: "clear" });
        return ok(true);
      },
    },
    onDbChange: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

let memoryFallbackApi: IContactsAppApi | null = null;
function getTargetApi(): IContactsAppApi {
  if (typeof window !== "undefined" && window.electronAPI?.db) {
    return window.electronAPI.db;
  }
  if (!memoryFallbackApi) {
    memoryFallbackApi = createMemoryFallbackApi();
  }
  return memoryFallbackApi;
}

export const api: IContactsAppApi = new Proxy({} as IContactsAppApi, {
  get(_target, prop: keyof IContactsAppApi) {
    const target = getTargetApi();
    const value = target[prop];
    if (typeof value === "function") {
      return value.bind(target);
    }
    return value;
  },
});
