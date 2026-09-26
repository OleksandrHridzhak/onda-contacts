import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, UserPlus, Users } from "lucide-react";
import { useContacts, useSettings, useTags } from "shared/api/hooks";
import { PageHeader } from "shared/ui/PageHeader";
import { Input } from "shared/ui/Input";
import { Button } from "shared/ui/Button";
import { EmptyState } from "shared/ui/EmptyState";
import { LoadingScreen } from "shared/ui/LoadingScreen";
import { Text } from "shared/ui/Text";
import { useContactsUiStore } from "../stores/useContactsUiStore";
import { filterContacts } from "../lib/filterContacts";
import { createContact } from "../api/contacts";
import { ContactFilters } from "./ContactFilters";
import { ContactListItem } from "./ContactListItem";
import { ContactDetail } from "./ContactDetail";
import { ContactFormModal } from "./ContactFormModal";
import { TagManagerModal } from "./TagManagerModal";

interface ContactsPageProps {
  /** Rendered when the address book is empty (e.g. import shortcuts). */
  emptyAction?: React.ReactNode;
}

export function ContactsPage({
  emptyAction,
}: ContactsPageProps): React.ReactElement {
  const contacts = useContacts();
  const tags = useTags();
  const settings = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const filters = useContactsUiStore();
  const selectedId = searchParams.get("contact");
  const isCreating = searchParams.get("new") === "1";

  const visible = useMemo(
    () => filterContacts(contacts ?? [], filters),
    [contacts, filters],
  );
  const selected = contacts?.find((contact) => contact.id === selectedId);

  const updateParams = (mutate: (params: URLSearchParams) => void) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      },
      { replace: true },
    );

  const select = (id: string | null) =>
    updateParams((params) => {
      if (id) params.set("contact", id);
      else params.delete("contact");
      params.delete("new");
    });

  const setCreating = (open: boolean) =>
    updateParams((params) => {
      if (open) params.set("new", "1");
      else params.delete("new");
    });

  // Auto-select the first contact on wide screens.
  useEffect(() => {
    if (
      !selectedId &&
      !isCreating &&
      visible.length > 0 &&
      window.innerWidth >= 768
    ) {
      select(visible[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, isCreating, visible.length]);

  if (!contacts) return <LoadingScreen message="Loading contacts..." />;

  const hasContacts = contacts.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background font-poppins">
      <PageHeader title="Contacts" icon={<Users size={22} />}>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textSubtle"
          />
          <Input
            inputSize="sm"
            className="pl-9"
            placeholder="Search people, companies, notes…"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            aria-label="Search contacts"
          />
        </div>
        <Button size="md" onClick={() => setCreating(true)}>
          <UserPlus size={16} />
          <span className="hidden sm:inline">New contact</span>
        </Button>
      </PageHeader>

      {!hasContacts ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Your people live here"
          description="Import contacts from Telegram, Instagram, Threads, LinkedIn or your phone — or add someone by hand."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {emptyAction}
              <Button variant="secondary" onClick={() => setCreating(true)}>
                <UserPlus size={16} /> Add manually
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside
            className={`${
              selected ? "hidden md:flex" : "flex"
            } w-full min-h-0 flex-col border-r border-border md:w-[360px] md:shrink-0`}
          >
            <div className="pt-3">
              <ContactFilters
                tags={tags}
                onManageTags={() => setIsTagManagerOpen(true)}
              />
            </div>
            <Text variant="caption" tone="subtle" className="px-4 pt-2">
              {visible.length} of {contacts.length} contacts
            </Text>
            <div className="custom-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 pb-24 md:pb-2">
              {visible.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  isSelected={contact.id === selectedId}
                  onSelect={select}
                />
              ))}
              {visible.length === 0 && (
                <div className="p-4 text-center">
                  <Text tone="muted">Nobody matches these filters.</Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={filters.resetFilters}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </aside>

          <section
            className={`${
              selected ? "block" : "hidden md:block"
            } custom-scroll min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0`}
          >
            {selected ? (
              <ContactDetail
                key={selected.id}
                contact={selected}
                tags={tags}
                onBack={() => select(null)}
                onDeleted={() => select(null)}
              />
            ) : (
              <EmptyState
                icon={<Users size={28} />}
                title="Pick someone"
                description="Select a contact to see their profile, notes and timeline."
              />
            )}
          </section>
        </div>
      )}

      {isCreating && (
        <ContactFormModal
          isOpen={isCreating}
          tags={tags}
          defaultKeepInTouchDays={settings?.preferences.defaultKeepInTouchDays}
          onClose={() => setCreating(false)}
          onSubmit={async (input) => {
            const res = await createContact({ ...input, sources: ["manual"] });
            if (res.success && res.data) select(res.data.id);
          }}
        />
      )}

      <TagManagerModal
        isOpen={isTagManagerOpen}
        tags={tags}
        onClose={() => setIsTagManagerOpen(false)}
      />
    </div>
  );
}
