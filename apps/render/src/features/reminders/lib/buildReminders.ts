import type { Contact } from "@onda/shared";
import { daysUntilBirthday, daysUntilCheckIn } from "@onda/shared";

export interface ReminderItem {
  contact: Contact;
  days: number;
}

export interface Reminders {
  overdue: ReminderItem[];
  upcoming: ReminderItem[];
  birthdays: ReminderItem[];
  /** Favorites without a cadence that went quiet for 60+ days. */
  reconnect: ReminderItem[];
}

const UPCOMING_WINDOW = 7;
const BIRTHDAY_WINDOW = 30;
const RECONNECT_AFTER = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function buildReminders(
  contacts: Contact[],
  now: Date = new Date(),
): Reminders {
  const reminders: Reminders = {
    overdue: [],
    upcoming: [],
    birthdays: [],
    reconnect: [],
  };

  for (const contact of contacts) {
    const checkIn = daysUntilCheckIn(contact, now);
    if (checkIn !== null && checkIn < 0) {
      reminders.overdue.push({ contact, days: checkIn });
    } else if (checkIn !== null && checkIn <= UPCOMING_WINDOW) {
      reminders.upcoming.push({ contact, days: checkIn });
    } else if (checkIn === null && contact.isFavorite) {
      const since = new Date(contact.lastContactedAt ?? contact.createdAt);
      const quietDays = Math.floor((now.getTime() - since.getTime()) / DAY_MS);
      if (quietDays >= RECONNECT_AFTER) {
        reminders.reconnect.push({ contact, days: -quietDays });
      }
    }

    const birthday = daysUntilBirthday(contact.birthday, now);
    if (birthday !== null && birthday <= BIRTHDAY_WINDOW) {
      reminders.birthdays.push({ contact, days: birthday });
    }
  }

  const byDays = (a: ReminderItem, b: ReminderItem) => a.days - b.days;
  reminders.overdue.sort(byDays);
  reminders.upcoming.sort(byDays);
  reminders.birthdays.sort(byDays);
  reminders.reconnect.sort(byDays);
  return reminders;
}
