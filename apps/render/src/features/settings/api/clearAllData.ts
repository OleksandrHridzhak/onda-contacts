import { api } from "shared/api/client";
import type { DbResult } from "@onda/shared";

export async function clearAllData(): Promise<DbResult<boolean>> {
  try {
    return await api.system.clearAllData();
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
