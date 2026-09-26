import {
  AtSign,
  Contact as ContactIcon,
  Facebook,
  FileSpreadsheet,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Send,
  Twitter,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ContactSource, SocialPlatform } from "@onda/shared";
import { SOCIAL_LABELS } from "@onda/shared";

export const PLATFORM_ICONS: Record<SocialPlatform, LucideIcon> = {
  telegram: Send,
  instagram: Instagram,
  threads: AtSign,
  linkedin: Linkedin,
  x: Twitter,
  facebook: Facebook,
  github: Github,
  website: Globe,
};

export const SOURCE_META: Record<
  ContactSource,
  { label: string; icon: LucideIcon }
> = {
  manual: { label: "Added manually", icon: UserRound },
  telegram: { label: SOCIAL_LABELS.telegram, icon: PLATFORM_ICONS.telegram },
  instagram: { label: SOCIAL_LABELS.instagram, icon: PLATFORM_ICONS.instagram },
  threads: { label: SOCIAL_LABELS.threads, icon: PLATFORM_ICONS.threads },
  linkedin: { label: SOCIAL_LABELS.linkedin, icon: PLATFORM_ICONS.linkedin },
  vcard: { label: "Phone contacts", icon: ContactIcon },
  csv: { label: "CSV", icon: FileSpreadsheet },
};
