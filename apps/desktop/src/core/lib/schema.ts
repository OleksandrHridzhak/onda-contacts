/**
 * SQL that creates the schema on a fresh database (packaged builds ship
 * without `prisma db push`). Keep in sync with prisma/schema.prisma:
 *   npx prisma migrate diff --from-empty \
 *     --to-schema-datamodel apps/desktop/prisma/schema.prisma --script
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "preferences" TEXT NOT NULL DEFAULT '{}'
)`,
  `CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "emails" TEXT NOT NULL DEFAULT '[]',
    "phones" TEXT NOT NULL DEFAULT '[]',
    "socials" TEXT NOT NULL DEFAULT '{}',
    "tagIds" TEXT NOT NULL DEFAULT '[]',
    "sources" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "howWeMet" TEXT NOT NULL DEFAULT '',
    "birthday" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT 'accent2',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "keepInTouchDays" INTEGER,
    "lastContactedAt" DATETIME,
    "connectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "text" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'accent2'
)`,
  `CREATE INDEX IF NOT EXISTS "Contact_lastName_firstName_idx" ON "Contact"("lastName", "firstName")`,
  `CREATE INDEX IF NOT EXISTS "Interaction_contactId_date_idx" ON "Interaction"("contactId", "date")`,
];
