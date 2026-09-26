import crypto from "node:crypto";
import { prisma } from "../../../core/lib/database";
import {
  safeDbCall,
  safeJsonParse,
  safeJsonStringify,
} from "../../../core/utils";
import type { DbResult, Tag } from "@onda/shared";

export async function getAllTags(): Promise<DbResult<Tag[]>> {
  return safeDbCall(() => prisma.tag.findMany({ orderBy: { name: "asc" } }));
}

export async function saveTag(
  tag: Tag | Omit<Tag, "id">,
): Promise<DbResult<Tag>> {
  return safeDbCall(() => {
    const id = "id" in tag && tag.id ? tag.id : crypto.randomUUID();
    const data = { name: tag.name.trim(), color: tag.color };
    return prisma.tag.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  });
}

/** Deletes the tag and removes it from every contact. */
export async function deleteTag(
  id: string,
): Promise<DbResult<{ tagId: string }>> {
  return safeDbCall(async () => {
    await prisma.$transaction(async (tx) => {
      const contacts = await tx.contact.findMany({
        where: { tagIds: { contains: `"${id}"` } },
        select: { id: true, tagIds: true },
      });
      for (const contact of contacts) {
        const tagIds = safeJsonParse<string[]>(contact.tagIds, []).filter(
          (tagId) => tagId !== id,
        );
        await tx.contact.update({
          where: { id: contact.id },
          data: { tagIds: safeJsonStringify(tagIds, "[]") },
        });
      }
      await tx.tag.delete({ where: { id } });
    });
    return { tagId: id };
  });
}
