import { describe, expect, it } from "vitest";
import { parseImportFiles } from "../importers";
import { fixMetaEncoding } from "../importers/utils";

const telegramExport = JSON.stringify({
  about: "Here is the data you requested.",
  contacts: {
    about: "Contacts list",
    list: [
      {
        first_name: "Ivan",
        last_name: "Petrenko",
        phone_number: "+380 67 123 4567",
        date: "2021-05-01T10:00:00",
        date_unixtime: "1619863200",
      },
      { first_name: "", last_name: "", phone_number: "" },
    ],
  },
  chats: {
    list: [
      {
        name: "Ivan Petrenko",
        type: "personal_chat",
        id: 1,
        messages: [
          {
            type: "message",
            date: "2024-01-01T10:00:00",
            date_unixtime: "1704103200",
          },
          {
            type: "message",
            date: "2024-03-01T10:00:00",
            date_unixtime: "1709287200",
          },
        ],
      },
      { name: "Deleted Account", type: "personal_chat", id: 2, messages: [] },
      { name: "Work group", type: "private_group", id: 3, messages: [] },
    ],
  },
});

const instagramFollowers = JSON.stringify([
  {
    title: "",
    media_list_data: [],
    string_list_data: [
      {
        href: "https://www.instagram.com/olena.k",
        value: "olena.k",
        timestamp: 1650000000,
      },
    ],
  },
  {
    title: "",
    string_list_data: [
      {
        href: "https://www.instagram.com/random_fan",
        value: "random_fan",
        timestamp: 1650000001,
      },
    ],
  },
]);

const instagramFollowing = JSON.stringify({
  relationships_following: [
    {
      title: "olena.k",
      string_list_data: [
        { href: "https://www.instagram.com/_u/olena.k", timestamp: 1640000000 },
      ],
    },
  ],
});

const threadsFollowing = JSON.stringify({
  text_post_app_text_post_app_following: [
    {
      title: "",
      string_list_data: [
        {
          href: "https://www.threads.net/@olena.k",
          value: "olena.k",
          timestamp: 1700000000,
        },
      ],
    },
  ],
});

const linkedinCsv = [
  "Notes:",
  '"When exporting your connection data, you may notice that some of the email addresses are missing."',
  "",
  "First Name,Last Name,URL,Email Address,Company,Position,Connected On",
  'Anna,Koval,https://www.linkedin.com/in/anna-koval,anna@example.com,"Figma, Inc.",Product Designer,15 Mar 2021',
].join("\n");

const vcard = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "N:Shevchenko;Taras;;;",
  "FN:Taras Shevchenko",
  "TEL;TYPE=CELL:+380671234567",
  "EMAIL;TYPE=INTERNET:taras@example.com",
  "ORG:Kobzar LLC;",
  "BDAY:1814-03-09",
  "X-SOCIALPROFILE;type=telegram:https://t.me/taras",
  "END:VCARD",
  "BEGIN:VCARD",
  "VERSION:2.1",
  "N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D0=9A=D0=BE=D0=B2=D0=B0=D0=BB=D1=8C;=D0=90=D0=BD=D0=BD=D0=B0;;;",
  "TEL;CELL:067 123 45 67",
  "END:VCARD",
].join("\r\n");

const googleCsv = [
  "First Name,Last Name,E-mail 1 - Value,Phone 1 - Value,Organization Name,Organization Title,Birthday",
  "Maria,Bondar,maria@example.com,+380501112233,Monobank,Engineer,1990-07-21",
].join("\n");

describe("parseImportFiles", () => {
  it("parses Telegram contacts and personal chats", () => {
    const { drafts, filesBySource } = parseImportFiles([
      { name: "DataExport/result.json", content: telegramExport },
    ]);
    expect(filesBySource.telegram).toBe(1);
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({
      source: "telegram",
      firstName: "Ivan",
      lastName: "Petrenko",
      phones: ["+380 67 123 4567"],
    });
    expect(drafts[1]).toMatchObject({
      firstName: "Ivan",
      lastName: "Petrenko",
    });
    expect(drafts[1].lastContactedAt).toBe(
      new Date(1709287200 * 1000).toISOString(),
    );
  });

  it("parses Instagram + Threads relationships and marks mutuals", () => {
    const { drafts } = parseImportFiles([
      {
        name: "connections/followers_and_following/followers_1.json",
        content: instagramFollowers,
      },
      {
        name: "connections/followers_and_following/following.json",
        content: instagramFollowing,
      },
      {
        name: "your_instagram_activity/threads/following.json",
        content: threadsFollowing,
      },
    ]);
    const olena = drafts.find(
      (d) => d.source === "instagram" && d.firstName === "olena.k",
    );
    expect(olena?.relations?.sort()).toEqual(["follower", "following"]);
    expect(olena?.socials).toEqual({ instagram: "olena.k" });
    expect(olena?.connectedAt).toBe(new Date(1640000000 * 1000).toISOString());

    const threads = drafts.find((d) => d.source === "threads");
    expect(threads).toMatchObject({
      firstName: "olena.k",
      socials: { threads: "olena.k" },
    });
    expect(drafts.find((d) => d.firstName === "random_fan")?.relations).toEqual(
      ["follower"],
    );
  });

  it("parses LinkedIn Connections.csv with its preamble", () => {
    const { drafts } = parseImportFiles([
      { name: "Connections.csv", content: linkedinCsv },
    ]);
    expect(drafts).toEqual([
      expect.objectContaining({
        source: "linkedin",
        firstName: "Anna",
        lastName: "Koval",
        company: "Figma, Inc.",
        position: "Product Designer",
        headline: "Product Designer at Figma, Inc.",
        emails: ["anna@example.com"],
        socials: { linkedin: "https://www.linkedin.com/in/anna-koval" },
      }),
    ]);
    expect(drafts[0].connectedAt?.startsWith("2021-03-15")).toBe(true);
  });

  it("parses vCards including quoted-printable UTF-8", () => {
    const { drafts } = parseImportFiles([
      { name: "contacts.vcf", content: vcard },
    ]);
    expect(drafts[0]).toMatchObject({
      firstName: "Taras",
      lastName: "Shevchenko",
      company: "Kobzar LLC",
      birthday: "1814-03-09",
      socials: { telegram: "https://t.me/taras" },
    });
    expect(drafts[1]).toMatchObject({ firstName: "Анна", lastName: "Коваль" });
  });

  it("parses generic Google Contacts CSV", () => {
    const { drafts, filesBySource } = parseImportFiles([
      { name: "contacts.csv", content: googleCsv },
    ]);
    expect(filesBySource.csv).toBe(1);
    expect(drafts[0]).toMatchObject({
      source: "csv",
      firstName: "Maria",
      emails: ["maria@example.com"],
      phones: ["+380501112233"],
      company: "Monobank",
      birthday: "1990-07-21",
    });
  });

  it("reports unrecognized files", () => {
    const result = parseImportFiles([
      { name: "notes.json", content: '{"a":1}' },
    ]);
    expect(result.drafts).toHaveLength(0);
    expect(result.unrecognized).toEqual(["notes.json"]);
  });
});

describe("fixMetaEncoding", () => {
  it("re-decodes mojibake from Meta exports", () => {
    const mojibake = String.fromCharCode(...new TextEncoder().encode("Олена"));
    expect(fixMetaEncoding(mojibake)).toBe("Олена");
    expect(fixMetaEncoding("plain")).toBe("plain");
    expect(fixMetaEncoding("Олена")).toBe("Олена");
  });
});
