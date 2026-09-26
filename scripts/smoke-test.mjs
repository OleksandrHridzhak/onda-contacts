/**
 * Launches the packaged app from an empty working directory (so nothing
 * from the repo's node_modules can leak in) and exercises the database
 * through the real IPC bridge.
 *
 *   node scripts/smoke-test.mjs dist/linux-unpacked/onda-contacts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { _electron } from "playwright";

async function main() {
  const executablePath = path.resolve(process.argv[2]);
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "onda-smoke-"));

  const app = await _electron.launch({
    executablePath,
    cwd: sandbox,
    args: ["--no-sandbox"],
    env: {
      ...process.env,
      NODE_ENV: "",
      HOME: sandbox,
      XDG_CONFIG_HOME: path.join(sandbox, ".config"),
    },
  });

  try {
    const window = await app.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    await window.waitForFunction(() => Boolean(window.electronAPI?.db));

    const result = await window.evaluate(async () => {
      const db = window.electronAPI.db;
      const created = await db.contacts.create({
        firstName: "Smoke",
        lastName: "Test",
      });
      const contacts = await db.contacts.getAll();
      const tags = await db.tags.getAll();
      return { created, contacts, tags };
    });

    for (const [name, res] of Object.entries(result)) {
      if (!res.success) throw new Error(`${name} failed: ${res.error}`);
    }
    if (result.contacts.data.length !== 1) {
      throw new Error(`expected 1 contact, got ${result.contacts.data.length}`);
    }
    console.log(
      `Smoke test passed: ${result.contacts.data.length} contact, ${result.tags.data.length} default tags.`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
