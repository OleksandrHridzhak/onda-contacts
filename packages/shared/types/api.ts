import type {
  Contact,
  ContactDraft,
  ContactInput,
  DbResult,
  ImportSummary,
  Interaction,
  InteractionInput,
  Setting,
  Tag,
} from "./models";

export interface IContactsApi {
  getAll(): Promise<DbResult<Contact[]>>;
  getById(id: string): Promise<DbResult<Contact>>;
  create(input: ContactInput): Promise<DbResult<Contact>>;
  update(id: string, fields: ContactInput): Promise<DbResult<Contact>>;
  delete(id: string): Promise<DbResult<{ contactId: string }>>;
  /** Sets lastContactedAt to now and logs an interaction. */
  markContacted(
    id: string,
    type?: Interaction["type"],
  ): Promise<DbResult<Contact>>;
}

export interface IInteractionsApi {
  getForContact(contactId: string): Promise<DbResult<Interaction[]>>;
  create(input: InteractionInput): Promise<DbResult<Interaction>>;
  delete(id: string): Promise<DbResult<{ interactionId: string }>>;
}

export interface ITagsApi {
  getAll(): Promise<DbResult<Tag[]>>;
  save(tag: Tag | Omit<Tag, "id">): Promise<DbResult<Tag>>;
  delete(id: string): Promise<DbResult<{ tagId: string }>>;
}

export interface IImportApi {
  /** Merges drafts into existing contacts (dedupe by socials/email/phone/name). */
  importDrafts(drafts: ContactDraft[]): Promise<DbResult<ImportSummary>>;
}

export interface ISettingsApi {
  get(): Promise<DbResult<Setting>>;
  update(
    updates: Partial<Omit<Setting, "id">>,
  ): Promise<DbResult<{ updatedCount: number }>>;
}

export interface ISystemApi {
  clearAllData(): Promise<DbResult<boolean>>;
}

export type DbTable = "contacts" | "interactions" | "tags" | "settings" | "all";

export type DbChangeEvent = {
  table: DbTable;
  action?: "create" | "update" | "delete" | "import" | "clear";
};

export interface IContactsAppApi {
  contacts: IContactsApi;
  interactions: IInteractionsApi;
  tags: ITagsApi;
  import: IImportApi;
  settings: ISettingsApi;
  system: ISystemApi;
  onDbChange(callback: (event: DbChangeEvent) => void): () => void;
}
