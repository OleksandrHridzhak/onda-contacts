import crypto from "node:crypto";
import { prisma } from "../../../core/lib/database";
import { safeDbCall } from "../../../core/utils";
import type {
  Contact,
  ContactInput,
  DbResult,
  Interaction,
} from "@onda/shared";
import { serializeContact, toContactData } from "./serialize-contact";

export async function updateContact(
  id: string,
  fields: ContactInput,
): Promise<DbResult<Contact>> {
  return safeDbCall(async () => {
    const row = await prisma.contact.update({
      where: { id },
      data: toContactData(fields),
    });
    return serializeContact(row);
  });
}

export async function markContacted(
  id: string,
  type: Interaction["type"] = "message",
): Promise<DbResult<Contact>> {
  return safeDbCall(async () => {
    const now = new Date();
    const [row] = await prisma.$transaction([
      prisma.contact.update({
        where: { id },
        data: { lastContactedAt: now },
      }),
      prisma.interaction.create({
        data: {
          id: crypto.randomUUID(),
          contactId: id,
          type,
          text: "",
          date: now,
        },
      }),
    ]);
    return serializeContact(row);
  });
}

export async function deleteContact(
  id: string,
): Promise<DbResult<{ contactId: string }>> {
  return safeDbCall(async () => {
    await prisma.contact.delete({ where: { id } });
    return { contactId: id };
  });
}
