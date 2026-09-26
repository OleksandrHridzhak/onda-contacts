import React from "react";
import { Star } from "lucide-react";
import type { Contact } from "@onda/shared";
import {
  contactDisplayName,
  contactInitials,
  daysUntilCheckIn,
} from "@onda/shared";
import { Avatar } from "shared/ui/Avatar";
import { PLATFORM_ICONS } from "shared/lib/platforms";

interface ContactListItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ContactListItem({
  contact,
  isSelected,
  onSelect,
}: ContactListItemProps): React.ReactElement {
  const checkIn = daysUntilCheckIn(contact);
  const subtitle =
    contact.headline ||
    contact.company ||
    contact.emails[0] ||
    contact.phones[0] ||
    "";
  const platforms = Object.keys(
    contact.socials,
  ) as (keyof typeof PLATFORM_ICONS)[];

  return (
    <button
      type="button"
      onClick={() => onSelect(contact.id)}
      aria-current={isSelected}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isSelected ? "bg-backgrundHover" : "hover:bg-surfaceMuted"
      }`}
    >
      <Avatar initials={contactInitials(contact)} color={contact.avatarColor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-text">
            {contactDisplayName(contact)}
          </span>
          {contact.isFavorite && (
            <Star
              size={12}
              className="shrink-0 fill-primaryColor text-primaryColor"
              aria-label="Favorite"
            />
          )}
        </div>
        {subtitle && (
          <p className="truncate text-xs text-textMuted">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {checkIn !== null && checkIn < 0 && (
          <span className="rounded-full border border-danger px-2 py-0.5 text-[10px] font-medium text-danger">
            Reach out
          </span>
        )}
        <div className="flex gap-1 text-textSubtle">
          {platforms.slice(0, 3).map((platform) => {
            const Icon = PLATFORM_ICONS[platform];
            return <Icon key={platform} size={12} aria-hidden="true" />;
          })}
        </div>
      </div>
    </button>
  );
}
