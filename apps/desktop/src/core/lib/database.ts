import { PrismaClient } from "@prisma/client";
import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import type { Setting } from "@onda/shared";
import { SCHEMA_STATEMENTS } from "./schema";

export const DEFAULT_PREFERENCES: Setting["preferences"] = {
  defaultKeepInTouchDays: 0,
};

let prismaInstance: PrismaClient | null = null;

export function getDatabasePath(): string {
  if (process.env.NODE_ENV === "development" || !app?.isPackaged) {
    const devDir = path.resolve(process.cwd(), "apps/desktop/prisma");
    if (!fs.existsSync(devDir)) {
      fs.mkdirSync(devDir, { recursive: true });
    }
    return path.join(devDir, "dev.db");
  }
  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, "onda-contacts.db");
}

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const dbPath = getDatabasePath();
    const databaseUrl = `file:${dbPath}`;
    process.env.DATABASE_URL = databaseUrl;

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

const DEFAULT_TAGS = [
  { id: "tag-friends", name: "Friends", color: "accent2" },
  { id: "tag-family", name: "Family", color: "accent4" },
  { id: "tag-work", name: "Work", color: "accent6" },
];

export async function initDatabase(): Promise<void> {
  try {
    const prismaClient = getPrismaClient();

    for (const statement of SCHEMA_STATEMENTS) {
      await prismaClient.$executeRawUnsafe(statement);
    }

    const settings = await prismaClient.setting.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      await prismaClient.setting.create({
        data: {
          id: "global",
          preferences: JSON.stringify(DEFAULT_PREFERENCES),
        },
      });

      for (const tag of DEFAULT_TAGS) {
        await prismaClient.tag.upsert({
          where: { id: tag.id },
          update: {},
          create: tag,
        });
      }
    }
  } catch (err) {
    console.error("[Desktop Database] Failed to initialize database:", err);
  }
}
