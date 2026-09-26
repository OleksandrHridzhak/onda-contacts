import React, { useState } from "react";
import type { Contact, ContactInput, SocialPlatform, Tag } from "@onda/shared";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@onda/shared";
import { ModalShell } from "shared/ui/ModalShell";
import { Field } from "shared/ui/Field";
import { Input } from "shared/ui/Input";
import { Textarea } from "shared/ui/Textarea";
import { Select } from "shared/ui/Select";
import { Button } from "shared/ui/Button";
import { Heading } from "shared/ui/Heading";
import { PLATFORM_ICONS } from "shared/lib/platforms";
import { KEEP_IN_TOUCH_OPTIONS } from "shared/lib/keepInTouch";
import { TagPicker } from "./TagPicker";

interface ContactFormModalProps {
  isOpen: boolean;
  contact?: Contact | null;
  tags: Tag[];
  defaultKeepInTouchDays?: number;
  onClose: () => void;
  onSubmit: (input: ContactInput) => Promise<void> | void;
}

type FormState = {
  firstName: string;
  lastName: string;
  headline: string;
  company: string;
  position: string;
  location: string;
  emails: string;
  phones: string;
  socials: Partial<Record<SocialPlatform, string>>;
  birthday: string;
  howWeMet: string;
  notes: string;
  keepInTouchDays: number;
  tagIds: string[];
};

const toForm = (contact?: Contact | null, defaultDays = 0): FormState => ({
  firstName: contact?.firstName ?? "",
  lastName: contact?.lastName ?? "",
  headline: contact?.headline ?? "",
  company: contact?.company ?? "",
  position: contact?.position ?? "",
  location: contact?.location ?? "",
  emails: (contact?.emails ?? []).join("\n"),
  phones: (contact?.phones ?? []).join("\n"),
  socials: { ...(contact?.socials ?? {}) },
  birthday: contact?.birthday ?? "",
  howWeMet: contact?.howWeMet ?? "",
  notes: contact?.notes ?? "",
  keepInTouchDays: contact ? (contact.keepInTouchDays ?? 0) : defaultDays,
  tagIds: contact?.tagIds ?? [],
});

const splitLines = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export function ContactFormModal({
  isOpen,
  contact,
  tags,
  defaultKeepInTouchDays = 0,
  onClose,
  onSubmit,
}: ContactFormModalProps): React.ReactElement | null {
  const [form, setForm] = useState<FormState>(() =>
    toForm(contact, defaultKeepInTouchDays),
  );
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = Boolean(form.firstName.trim() || form.lastName.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSubmit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        headline: form.headline.trim(),
        company: form.company.trim(),
        position: form.position.trim(),
        location: form.location.trim(),
        emails: splitLines(form.emails),
        phones: splitLines(form.phones),
        socials: form.socials,
        birthday: form.birthday || null,
        howWeMet: form.howWeMet.trim(),
        notes: form.notes,
        keepInTouchDays: form.keepInTouchDays || null,
        tagIds: form.tagIds,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? "Edit contact" : "New contact"}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pr-1">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="First name" htmlFor="contact-first-name" required>
            <Input
              id="contact-first-name"
              inputSize="sm"
              autoFocus
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name" htmlFor="contact-last-name">
            <Input
              id="contact-last-name"
              inputSize="sm"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
          <Field
            label="Headline"
            hint="Who they are in one line"
            htmlFor="contact-headline"
            className="md:col-span-2"
          >
            <Input
              id="contact-headline"
              inputSize="sm"
              placeholder="Product designer, climbing buddy, met at Lviv IT Arena"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
          </Field>
          <Field label="Company" htmlFor="contact-company">
            <Input
              id="contact-company"
              inputSize="sm"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </Field>
          <Field label="Position" htmlFor="contact-position">
            <Input
              id="contact-position"
              inputSize="sm"
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
            />
          </Field>
          <Field label="Location" htmlFor="contact-location">
            <Input
              id="contact-location"
              inputSize="sm"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>
          <Field
            label="Birthday"
            hint="YYYY-MM-DD, or --MM-DD without a year"
            htmlFor="contact-birthday"
          >
            <Input
              id="contact-birthday"
              inputSize="sm"
              placeholder="1995-03-12"
              value={form.birthday}
              onChange={(e) => set("birthday", e.target.value)}
            />
          </Field>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Emails" hint="One per line" htmlFor="contact-emails">
            <Textarea
              id="contact-emails"
              rows={2}
              value={form.emails}
              onChange={(e) => set("emails", e.target.value)}
            />
          </Field>
          <Field label="Phones" hint="One per line" htmlFor="contact-phones">
            <Textarea
              id="contact-phones"
              rows={2}
              value={form.phones}
              onChange={(e) => set("phones", e.target.value)}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <Heading as="h3" variant="s">
            Social profiles
          </Heading>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = PLATFORM_ICONS[platform];
              return (
                <label
                  key={platform}
                  className="flex items-center gap-2"
                  htmlFor={`contact-social-${platform}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surfaceMuted text-textMuted">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <Input
                    id={`contact-social-${platform}`}
                    inputSize="sm"
                    placeholder={
                      platform === "website"
                        ? "https://…"
                        : `${SOCIAL_LABELS[platform]} username or link`
                    }
                    value={form.socials[platform] ?? ""}
                    onChange={(e) =>
                      set("socials", {
                        ...form.socials,
                        [platform]: e.target.value,
                      })
                    }
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Keep in touch" htmlFor="contact-keep-in-touch">
            <Select
              id="contact-keep-in-touch"
              inputSize="sm"
              value={form.keepInTouchDays}
              onChange={(e) => set("keepInTouchDays", Number(e.target.value))}
            >
              {KEEP_IN_TOUCH_OPTIONS.map((option) => (
                <option key={option.days} value={option.days}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="How we met" htmlFor="contact-how-we-met">
            <Input
              id="contact-how-we-met"
              inputSize="sm"
              value={form.howWeMet}
              onChange={(e) => set("howWeMet", e.target.value)}
            />
          </Field>
          <Field label="Tags" className="md:col-span-2">
            <TagPicker
              tags={tags}
              selectedIds={form.tagIds}
              onChange={(tagIds) => set("tagIds", tagIds)}
            />
          </Field>
          <Field
            label="Notes"
            htmlFor="contact-notes"
            className="md:col-span-2"
          >
            <Textarea
              id="contact-notes"
              rows={4}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </section>

        <div className="flex justify-end gap-3 pb-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave || isSaving}>
            {contact ? "Save changes" : "Create contact"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
