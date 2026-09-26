import { useState, useEffect, useRef } from "react";
import { api } from "./client";
import type {
  Contact,
  DbChangeEvent,
  DbResult,
  DbTable,
  Interaction,
  Setting,
  Tag,
} from "@onda/shared";

export function useDbQuery<T>(
  queryFn: () => Promise<T>,
  tables: DbTable[],
  depsKey = "",
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  const tablesKey = tables.join(",");

  useEffect(() => {
    let isCurrent = true;

    const runQuery = async () => {
      try {
        const result = await queryFnRef.current();
        if (isCurrent) {
          setData(result);
        }
      } catch (error) {
        console.error("[useDbQuery Error]:", error);
      }
    };

    void runQuery();

    const watchedTables = tablesKey.split(",") as DbTable[];
    const unsubscribe = api.onDbChange((event: DbChangeEvent) => {
      if (
        watchedTables.includes(event.table) ||
        event.table === "all" ||
        watchedTables.includes("all")
      ) {
        void runQuery();
      }
    });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [depsKey, tablesKey]);

  return data;
}

const unwrap = <T>(res: DbResult<T>, fallback: T): T =>
  res.success && res.data !== undefined ? res.data : fallback;

/** undefined while the first load is in flight. */
export function useContacts(): Contact[] | undefined {
  return useDbQuery(
    async () => unwrap(await api.contacts.getAll(), []),
    ["contacts"],
  );
}

export function useTags(): Tag[] {
  const data = useDbQuery(
    async () => unwrap(await api.tags.getAll(), []),
    ["tags"],
  );
  return data || [];
}

export function useInteractions(contactId: string | null): Interaction[] {
  const data = useDbQuery(
    async () =>
      contactId
        ? unwrap(await api.interactions.getForContact(contactId), [])
        : [],
    ["interactions"],
    contactId ?? "",
  );
  return data || [];
}

export function useSettings(): Setting | undefined {
  return useDbQuery(async () => {
    const res = await api.settings.get();
    return res.success ? res.data : undefined;
  }, ["settings"]);
}
