import { Route, Routes } from "react-router-dom";
import { ContactsRoute } from "app/routes/ContactsRoute";
import { ImportRoute } from "app/routes/ImportRoute";
import { RemindersRoute } from "app/routes/RemindersRoute";
import { SettingsPage } from "app/routes/SettingsPage";

export function AppRouter(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<ContactsRoute />} />
      <Route path="/reminders" element={<RemindersRoute />} />
      <Route path="/import" element={<ImportRoute />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
