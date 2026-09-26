import { prisma, DEFAULT_PREFERENCES } from "../../../core/lib/database";
import { safeJsonStringify } from "../../../core/utils";
import type { DbResult } from "@onda/shared";

export async function clearAllData(): Promise<DbResult<boolean>> {
  try {
    await prisma.$transaction([
      prisma.interaction.deleteMany(),
      prisma.contact.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.setting.deleteMany(),
    ]);

    await prisma.setting.create({
      data: {
        id: "global",
        preferences: safeJsonStringify(DEFAULT_PREFERENCES),
      },
    });

    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
