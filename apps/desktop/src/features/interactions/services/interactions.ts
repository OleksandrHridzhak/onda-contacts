import crypto from "node:crypto";
import type { Interaction as InteractionRow } from "@prisma/client";
import { prisma } from "../../../core/lib/database";
import { safeDbCall } from "../../../core/utils";
import type { DbResult, Interaction, InteractionInput } from "@onda/shared";

function serializeInteraction(row: InteractionRow): Interaction {
  return {
    id: row.id,
    contactId: row.contactId,
    type: row.type as Interaction["type"],
    text: row.text,
    date: new Date(row.date).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export async function getInteractionsForContact(
  contactId: string,
): Promise<DbResult<Interaction[]>> {
  return safeDbCall(async () => {
    const rows = await prisma.interaction.findMany({
      where: { contactId },
      orderBy: { date: "desc" },
    });
    return rows.map(serializeInteraction);
  });
}

/**
 * Logs an interaction and moves the contact's lastContactedAt forward
 * when the interaction is newer (notes don't count as contact).
 */
export async function createInteraction(
  input: InteractionInput,
): Promise<DbResult<Interaction>> {
  return safeDbCall(async () => {
    const date = input.date ? new Date(input.date) : new Date();

    return prisma.$transaction(async (tx) => {
      const row = await tx.interaction.create({
        data: {
          id: crypto.randomUUID(),
          contactId: input.contactId,
          type: input.type,
          text: input.text,
          date,
        },
      });

      if (input.type !== "note") {
        const contact = await tx.contact.findUnique({
          where: { id: input.contactId },
          select: { lastContactedAt: true },
        });
        if (!contact?.lastContactedAt || contact.lastContactedAt < date) {
          await tx.contact.update({
            where: { id: input.contactId },
            data: { lastContactedAt: date },
          });
        }
      }

      return serializeInteraction(row);
    });
  });
}

export async function deleteInteraction(
  id: string,
): Promise<DbResult<{ interactionId: string }>> {
  return safeDbCall(async () => {
    await prisma.interaction.delete({ where: { id } });
    return { interactionId: id };
  });
}
