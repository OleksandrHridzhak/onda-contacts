import { prisma, DEFAULT_PREFERENCES } from "../../../core/lib/database";
import { safeJsonParse, safeJsonStringify } from "../../../core/utils";
import type { Setting, DbResult } from "@onda/shared";

export async function getPreferences(): Promise<Setting["preferences"]> {
  let setting = await prisma.setting.findUnique({ where: { id: "global" } });
  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        id: "global",
        preferences: safeJsonStringify(DEFAULT_PREFERENCES),
      },
    });
  }
  return {
    ...DEFAULT_PREFERENCES,
    ...safeJsonParse<Partial<Setting["preferences"]>>(setting.preferences, {}),
  };
}

export async function getSettings(): Promise<DbResult<Setting>> {
  try {
    return {
      success: true,
      data: { id: "global", preferences: await getPreferences() },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
