import { prisma } from "../../../core/lib/database";
import { safeJsonStringify } from "../../../core/utils";
import type { Setting, DbResult } from "@onda/shared";
import { getPreferences } from "./get-settings";

export async function updateSettings(
  updates: Partial<Omit<Setting, "id">>,
): Promise<DbResult<{ updatedCount: number }>> {
  try {
    const preferences = {
      ...(await getPreferences()),
      ...updates.preferences,
    };

    await prisma.setting.upsert({
      where: { id: "global" },
      create: { id: "global", preferences: safeJsonStringify(preferences) },
      update: { preferences: safeJsonStringify(preferences) },
    });

    return { success: true, data: { updatedCount: 1 } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
