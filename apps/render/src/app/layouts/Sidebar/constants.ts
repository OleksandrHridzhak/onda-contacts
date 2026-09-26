import { BellRing, Import, Settings, Users, LucideIcon } from "lucide-react";

export interface SideBarItem {
  name: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const sideBarItems: SideBarItem[] = [
  { name: "contacts", label: "Contacts", icon: Users, path: "/" },
  {
    name: "reminders",
    label: "Keep in touch",
    icon: BellRing,
    path: "/reminders",
  },
  { name: "import", label: "Import", icon: Import, path: "/import" },
  { name: "settings", label: "Settings", icon: Settings, path: "/settings" },
];
