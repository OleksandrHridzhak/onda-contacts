import { prisma } from "../../../core/lib/database";
import { safeDbCall } from "../../../core/utils";
import {
  contactMatchKeys,
  draftToContactInput,
  mergeDraftIntoContact,
} from "@onda/shared";
import type {
  Contact,
  ContactDraft,
  DbResult,
  ImportSummary,
} from "@onda/shared";
import {
  serializeContact,
  toContactData,
} from "../../contacts/services/serialize-contact";
import {
  buildNewContact,
  toContactCreateData,
} from "../../contacts/services/create-contact";
import { getPreferences } from "../../settings/services/get-settings";

/**
 * Merges imported drafts into the address book. A draft sharing any
 * identity key (social handle, email, phone, full name) with a known
 * contact is merged into it; otherwise a new contact is created.
 */
export async function importDrafts(
  drafts: ContactDraft[],
): Promise<DbResult<ImportSummary>> {
  return safeDbCall(async () => {
    const preferences = await getPreferences();
    const existingRows = await prisma.contact.findMany();

    const contacts = new Map<string, Contact>();
    const keyIndex = new Map<string, string>();
    const created = new Set<string>();
    const updated = new Set<string>();
    const summary: ImportSummary = { created: 0, merged: 0, skipped: 0 };

    const indexContact = (contact: Contact) => {
      contacts.set(contact.id, contact);
      for (const key of contactMatchKeys(contact)) {
        if (!keyIndex.has(key)) keyIndex.set(key, contact.id);
      }
    };

    existingRows.map(serializeContact).forEach(indexContact);

    for (const draft of drafts) {
      if (!draft.firstName && !draft.lastName) {
        summary.skipped++;
        continue;
      }

      const matchId = contactMatchKeys(draft)
        .map((key) => keyIndex.get(key))
        .find(Boolean);
      const match = matchId ? contacts.get(matchId) : undefined;

      if (match) {
        indexContact({ ...match, ...mergeDraftIntoContact(match, draft) });
        if (!created.has(match.id)) updated.add(match.id);
        summary.merged++;
        continue;
      }

      const contact = buildNewContact(
        draftToContactInput(draft),
        preferences.defaultKeepInTouchDays,
      );
      indexContact(contact);
      created.add(contact.id);
      summary.created++;
    }

    await prisma.$transaction(
      async (tx) => {
        for (const id of created) {
          await tx.contact.create({
            data: toContactCreateData(contacts.get(id)!),
          });
        }
        for (const id of updated) {
          await tx.contact.update({
            where: { id },
            data: toContactData(contacts.get(id)!),
          });
        }
      },
      { timeout: 120_000 },
    );

    return summary;
  });
}
