import React, { useState } from "react";
import {
  ArrowLeft,
  BellRing,
  Building2,
  Cake,
  CheckCircle2,
  Handshake,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Trash2,
} from "lucide-react";
import type { Contact, ContactInput, Tag } from "@onda/shared";
import {
  contactDisplayName,
  contactInitials,
  daysUntilBirthday,
  daysUntilCheckIn,
} from "@onda/shared";
import { useInteractions } from "shared/api/hooks";
import { Avatar } from "shared/ui/Avatar";
import { Badge } from "shared/ui/Badge";
import { Button } from "shared/ui/Button";
import { Card } from "shared/ui/Card";
import { ConfirmModal } from "shared/ui/ConfirmModal";
import { Heading } from "shared/ui/Heading";
import { Select } from "shared/ui/Select";
import { Text } from "shared/ui/Text";
import { getColorStyle } from "shared/lib/color";
import {
  formatBirthday,
  formatDate,
  formatRelativeDate,
} from "shared/lib/format";
import { describeCheckIn, KEEP_IN_TOUCH_OPTIONS } from "shared/lib/keepInTouch";
import { SOURCE_META } from "shared/lib/platforms";
import { deleteContact, markContacted, updateContact } from "../api/contacts";
import { ContactFormModal } from "./ContactFormModal";
import { InteractionTimeline } from "./InteractionTimeline";
import { SocialLinks } from "./SocialLinks";

interface ContactDetailProps {
  contact: Contact;
  tags: Tag[];
  onBack: () => void;
  onDeleted: () => void;
}

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-text">
      <span className="mt-0.5 text-textSubtle">{icon}</span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function ContactDetail({
  contact,
  tags,
  onBack,
  onDeleted,
}: ContactDetailProps): React.ReactElement {
  const interactions = useInteractions(contact.id);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkIn = daysUntilCheckIn(contact);
  const birthdayIn = daysUntilBirthday(contact.birthday);
  const contactTags = tags.filter((tag) => contact.tagIds.includes(tag.id));

  const update = (fields: ContactInput) => updateContact(contact.id, fields);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-textMuted md:hidden"
      >
        <ArrowLeft size={16} /> All contacts
      </button>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar
            initials={contactInitials(contact)}
            color={contact.avatarColor}
            size="xl"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Heading as="h2" variant="2xl" className="break-words">
                  {contactDisplayName(contact)}
                </Heading>
                {contact.headline && (
                  <Text tone="muted" className="mt-0.5">
                    {contact.headline}
                  </Text>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={contact.isFavorite ? "Unfavorite" : "Favorite"}
                  title={contact.isFavorite ? "Unfavorite" : "Favorite"}
                  onClick={() =>
                    void update({ isFavorite: !contact.isFavorite })
                  }
                >
                  <Star
                    size={18}
                    className={
                      contact.isFavorite
                        ? "fill-primaryColor text-primaryColor"
                        : "text-textMuted"
                    }
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit contact"
                  title="Edit"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil size={18} className="text-textMuted" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete contact"
                  title="Delete"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 size={18} className="text-textMuted" />
                </Button>
              </div>
            </div>

            {contactTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {contactTags.map((tag) => {
                  const color = getColorStyle(tag.color);
                  return (
                    <Badge
                      key={tag.id}
                      size="md"
                      colorClasses={{ bg: color.bg, text: color.text }}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            )}

            <SocialLinks socials={contact.socials} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <Heading as="h3" variant="s">
            Keep in touch
          </Heading>
          <Select
            inputSize="sm"
            value={contact.keepInTouchDays ?? 0}
            onChange={(e) =>
              void update({ keepInTouchDays: Number(e.target.value) || null })
            }
            aria-label="Keep in touch cadence"
          >
            {KEEP_IN_TOUCH_OPTIONS.map((option) => (
              <option key={option.days} value={option.days}>
                {option.label}
              </option>
            ))}
          </Select>
          <Text tone="muted" variant="caption">
            Last contacted: {formatRelativeDate(contact.lastContactedAt)}
            {checkIn !== null && (
              <>
                {" · "}
                <span className={checkIn < 0 ? "font-medium text-danger" : ""}>
                  {describeCheckIn(checkIn)}
                </span>
              </>
            )}
          </Text>
          <Button
            size="sm"
            onClick={() => void markContacted(contact.id)}
            fullWidth
          >
            <CheckCircle2 size={14} /> We talked today
          </Button>
        </Card>

        <Card className="space-y-2.5 p-5">
          <Heading as="h3" variant="s">
            Details
          </Heading>
          {(contact.position || contact.company) && (
            <InfoRow icon={<Building2 size={14} />}>
              {[contact.position, contact.company].filter(Boolean).join(" at ")}
            </InfoRow>
          )}
          {contact.location && (
            <InfoRow icon={<MapPin size={14} />}>{contact.location}</InfoRow>
          )}
          {contact.emails.map((email) => (
            <InfoRow key={email} icon={<Mail size={14} />}>
              <a href={`mailto:${email}`} className="hover:text-primaryColor">
                {email}
              </a>
            </InfoRow>
          ))}
          {contact.phones.map((phone) => (
            <InfoRow key={phone} icon={<Phone size={14} />}>
              <a href={`tel:${phone}`} className="hover:text-primaryColor">
                {phone}
              </a>
            </InfoRow>
          ))}
          {contact.birthday && (
            <InfoRow icon={<Cake size={14} />}>
              {formatBirthday(contact.birthday)}
              {birthdayIn !== null && birthdayIn <= 30 && (
                <span className="ml-1 text-textMuted">
                  ({birthdayIn === 0 ? "today 🎉" : `in ${birthdayIn} days`})
                </span>
              )}
            </InfoRow>
          )}
          {contact.howWeMet && (
            <InfoRow icon={<Handshake size={14} />}>{contact.howWeMet}</InfoRow>
          )}
          {checkIn !== null && checkIn < 0 && (
            <InfoRow icon={<BellRing size={14} />}>
              <span className="text-danger">Time to reach out</span>
            </InfoRow>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {contact.sources.map((source) => {
              const meta = SOURCE_META[source];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <Badge key={source}>
                  <Icon size={11} className="mr-1" aria-hidden="true" />
                  {meta.label}
                </Badge>
              );
            })}
          </div>
          {contact.connectedAt && (
            <Text variant="caption" tone="subtle">
              Connected since {formatDate(contact.connectedAt)}
            </Text>
          )}
        </Card>
      </div>

      {contact.notes && (
        <Card className="space-y-2 p-5">
          <Heading as="h3" variant="s">
            Notes
          </Heading>
          <Text className="whitespace-pre-wrap break-words">
            {contact.notes}
          </Text>
        </Card>
      )}

      <Card className="space-y-3 p-5">
        <Heading as="h3" variant="s">
          Timeline
        </Heading>
        <InteractionTimeline
          contactId={contact.id}
          interactions={interactions}
        />
      </Card>

      {isEditing && (
        <ContactFormModal
          isOpen={isEditing}
          contact={contact}
          tags={tags}
          onClose={() => setIsEditing(false)}
          onSubmit={async (input) => {
            await update(input);
          }}
        />
      )}

      <ConfirmModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={() => {
          void deleteContact(contact.id).then(onDeleted);
        }}
        title="Delete contact?"
        message={`${contactDisplayName(contact)} and their timeline will be permanently deleted.`}
        confirmText="Delete"
      />
    </div>
  );
}
