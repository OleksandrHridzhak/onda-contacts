import React from "react";
import { Download } from "lucide-react";
import { api } from "shared/api/client";
import { useSettings } from "shared/api/hooks";
import SettingsSection from "shared/ui/SettingsSection";
import { Button } from "shared/ui/Button";
import { Field } from "shared/ui/Field";
import { Select } from "shared/ui/Select";
import { Text } from "shared/ui/Text";
import { KEEP_IN_TOUCH_OPTIONS } from "shared/lib/keepInTouch";
import { updateSettings } from "../../api/settings";
import { contactsToCsv, downloadTextFile } from "../../lib/exportContacts";

export function ContactsSection(): React.ReactElement {
  const settings = useSettings();
  const defaultDays = settings?.preferences.defaultKeepInTouchDays ?? 0;

  const handleExport = async () => {
    const [contacts, tags] = await Promise.all([
      api.contacts.getAll(),
      api.tags.getAll(),
    ]);
    if (!contacts.success || !contacts.data) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `onda-contacts-${date}.csv`,
      contactsToCsv(contacts.data, tags.data ?? []),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <SettingsSection title="Contacts">
      <Field
        label="Default keep-in-touch reminder"
        hint="Applied to new and imported contacts. You can change it per person."
        htmlFor="default-keep-in-touch"
      >
        <Select
          id="default-keep-in-touch"
          inputSize="sm"
          className="max-w-xs"
          value={defaultDays}
          onChange={(e) =>
            void updateSettings({
              preferences: { defaultKeepInTouchDays: Number(e.target.value) },
            })
          }
        >
          {KEEP_IN_TOUCH_OPTIONS.map((option) => (
            <option key={option.days} value={option.days}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="space-y-2 pt-2">
        <Text tone="muted">
          Your data is yours. Export everything as CSV at any time — it can be
          imported back into Onda Contacts, Google Contacts or a spreadsheet.
        </Text>
        <Button variant="secondary" onClick={() => void handleExport()}>
          <Download className="h-4 w-4" /> Export contacts (.csv)
        </Button>
      </div>
    </SettingsSection>
  );
}

export default ContactsSection;
