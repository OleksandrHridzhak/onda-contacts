import { prisma } from "../../../core/lib/database";
import { safeDbCall } from "../../../core/utils";
import type { Contact, DbResult } from "@onda/shared";
import { serializeContact } from "./serialize-contact";

export async function getAllContacts(): Promise<DbResult<Contact[]>> {
  return safeDbCall(async () => {
    const rows = await prisma.contact.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return rows.map(serializeContact);
  });
}

export async function getContactById(id: string): Promise<DbResult<Contact>> {
  return safeDbCall(async () => {
    const row = await prisma.contact.findUniqueOrThrow({ where: { id } });
    return serializeContact(row);
  });
}
