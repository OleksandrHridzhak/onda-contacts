import React from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  Cake,
  CalendarClock,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { contactDisplayName, contactInitials } from "@onda/shared";
import { api } from "shared/api/client";
import { useContacts } from "shared/api/hooks";
import { PageHeader } from "shared/ui/PageHeader";
import { Avatar } from "shared/ui/Avatar";
import { Button } from "shared/ui/Button";
import { Card } from "shared/ui/Card";
import { EmptyState } from "shared/ui/EmptyState";
import { Heading } from "shared/ui/Heading";
import { LoadingScreen } from "shared/ui/LoadingScreen";
import { Text } from "shared/ui/Text";
import { describeCheckIn } from "shared/lib/keepInTouch";
import { buildReminders, type ReminderItem } from "../lib/buildReminders";

interface ReminderSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ReminderItem[];
  describe: (item: ReminderItem) => string;
  tone?: "danger" | "muted";
  showDone?: boolean;
}

function ReminderSection({
  title,
  icon,
  items,
  describe,
  tone = "muted",
  showDone = true,
}: ReminderSectionProps): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primaryColor">{icon}</span>
        <Heading as="h2" variant="base">
          {title}
        </Heading>
        <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-secondaryText">
          {items.length}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.contact.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surfaceMuted"
          >
            <Link
              to={`/?contact=${item.contact.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <Avatar
                initials={contactInitials(item.contact)}
                color={item.contact.avatarColor}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {contactDisplayName(item.contact)}
                </p>
                <Text
                  variant="caption"
                  tone={tone === "danger" ? "danger" : "muted"}
                >
                  {describe(item)}
                </Text>
              </div>
            </Link>
            {showDone && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void api.contacts.markContacted(item.contact.id)}
                title="Mark as contacted today"
              >
                <CheckCircle2 size={14} /> Done
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function RemindersPage(): React.ReactElement {
  const contacts = useContacts();

  if (!contacts) return <LoadingScreen message="Loading reminders..." />;

  const reminders = buildReminders(contacts);
  const isEmpty =
    reminders.overdue.length +
      reminders.upcoming.length +
      reminders.birthdays.length +
      reminders.reconnect.length ===
    0;

  return (
    <div className="custom-scroll flex h-full min-h-0 flex-col overflow-y-auto bg-background font-poppins">
      <PageHeader title="Keep in touch" icon={<BellRing size={22} />} />
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-24 md:p-6">
        {isEmpty ? (
          <EmptyState
            icon={<Heart size={28} />}
            title="All caught up"
            description="Set a keep-in-touch cadence or a birthday on a contact and reminders will show up here."
          />
        ) : (
          <>
            <ReminderSection
              title="Reach out"
              icon={<BellRing size={18} />}
              items={reminders.overdue}
              tone="danger"
              describe={(item) => describeCheckIn(item.days)}
            />
            <ReminderSection
              title="Coming up this week"
              icon={<CalendarClock size={18} />}
              items={reminders.upcoming}
              describe={(item) => describeCheckIn(item.days)}
            />
            <ReminderSection
              title="Birthdays"
              icon={<Cake size={18} />}
              items={reminders.birthdays}
              showDone={false}
              describe={(item) =>
                item.days === 0 ? "Today 🎉" : `In ${item.days} days`
              }
            />
            <ReminderSection
              title="Favorites you haven't talked to"
              icon={<Heart size={18} />}
              items={reminders.reconnect}
              describe={(item) => `Quiet for ${-item.days} days`}
            />
          </>
        )}
      </div>
    </div>
  );
}
