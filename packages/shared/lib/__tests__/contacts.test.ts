import { describe, expect, it } from "vitest";
import type { Contact } from "../../types/models";
import {
  contactMatchKeys,
  daysUntilBirthday,
  daysUntilCheckIn,
  mergeDraftIntoContact,
  normalizeHandle,
  socialUrl,
} from "../contacts";

const baseContact: Contact = {
  id: "1",
  firstName: "olena.k",
  lastName: "",
  headline: "",
  company: "",
  position: "",
  location: "",
  emails: [],
  phones: ["+380 67 123 4567"],
  socials: { instagram: "olena.k" },
  tagIds: [],
  sources: ["instagram"],
  notes: "",
  howWeMet: "",
  birthday: null,
  avatarColor: "accent1",
  isFavorite: false,
  keepInTouchDays: null,
  lastContactedAt: "2024-01-01T00:00:00.000Z",
  connectedAt: "2022-01-01T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("normalizeHandle", () => {
  it("extracts handles from URLs and @mentions", () => {
    expect(normalizeHandle("telegram", "https://t.me/durov")).toBe("durov");
    expect(normalizeHandle("telegram", "@durov")).toBe("durov");
    expect(
      normalizeHandle("instagram", "https://www.instagram.com/_u/olena.k/"),
    ).toBe("olena.k");
    expect(normalizeHandle("threads", "https://www.threads.net/@zuck")).toBe(
      "zuck",
    );
    expect(
      normalizeHandle("linkedin", "https://www.linkedin.com/in/anna-koval?x=1"),
    ).toBe("anna-koval");
    expect(normalizeHandle("x", "https://twitter.com/jack")).toBe("jack");
    expect(socialUrl("threads", "zuck")).toBe("https://www.threads.net/@zuck");
  });
});

describe("contactMatchKeys", () => {
  it("links Threads and Instagram handles and normalises phones", () => {
    const threads = contactMatchKeys({
      firstName: "x",
      lastName: "",
      socials: { threads: "@Olena.K" },
    });
    expect(threads).toContain("instagram:olena.k");
    const phone = contactMatchKeys({
      firstName: "a",
      lastName: "",
      phones: ["067-123-45-67"],
    });
    expect(contactMatchKeys(baseContact)).toEqual(
      expect.arrayContaining(phone),
    );
  });

  it("uses full names only when there are at least two words", () => {
    expect(contactMatchKeys({ firstName: "Max", lastName: "" })).toEqual([]);
    expect(
      contactMatchKeys({ firstName: "Ivan", lastName: "Petrenko" }),
    ).toEqual(["name:ivan petrenko"]);
    expect(
      contactMatchKeys({ firstName: "Petrenko", lastName: "Ivan" }),
    ).toEqual(["name:ivan petrenko"]);
    expect(
      contactMatchKeys({ firstName: "olena.koval", lastName: "" }),
    ).toEqual(["name:koval olena"]);
  });
});

describe("mergeDraftIntoContact", () => {
  it("fills gaps, unions lists and upgrades handle-only names", () => {
    const merged = mergeDraftIntoContact(baseContact, {
      source: "telegram",
      firstName: "Olena",
      lastName: "Koval",
      phones: ["+380671234567", "+380 50 000 0000"],
      socials: { telegram: "@olenak" },
      lastContactedAt: "2024-05-01T00:00:00.000Z",
      connectedAt: "2023-01-01T00:00:00.000Z",
    });
    expect(merged.firstName).toBe("Olena");
    expect(merged.lastName).toBe("Koval");
    expect(merged.phones).toEqual(["+380 67 123 4567", "+380 50 000 0000"]);
    expect(merged.socials).toEqual({
      instagram: "olena.k",
      telegram: "olenak",
    });
    expect(merged.sources).toEqual(["instagram", "telegram"]);
    expect(merged.lastContactedAt).toBe("2024-05-01T00:00:00.000Z");
    expect(merged.connectedAt).toBe("2022-01-01T00:00:00.000Z");
  });

  it("never overwrites a real name", () => {
    const merged = mergeDraftIntoContact(
      { ...baseContact, firstName: "Olena", lastName: "Koval" },
      { source: "linkedin", firstName: "Olena", lastName: "Kovalenko" },
    );
    expect(merged.lastName).toBe("Koval");
  });
});

describe("reminders", () => {
  it("computes keep-in-touch and birthday distances", () => {
    const now = new Date("2024-03-10T12:00:00Z");
    expect(
      daysUntilCheckIn({ ...baseContact, keepInTouchDays: 30 }, now),
    ).toBeLessThan(0);
    expect(daysUntilCheckIn(baseContact, now)).toBeNull();
    expect(daysUntilBirthday("1990-03-12", new Date(2024, 2, 10))).toBe(2);
    expect(daysUntilBirthday("--03-09", new Date(2024, 2, 10))).toBe(364);
  });
});
