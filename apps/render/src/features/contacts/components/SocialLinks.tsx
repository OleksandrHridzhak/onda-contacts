import React from "react";
import type { ContactSocials, SocialPlatform } from "@onda/shared";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS, socialUrl } from "@onda/shared";
import { PLATFORM_ICONS } from "shared/lib/platforms";

interface SocialLinksProps {
  socials: ContactSocials;
}

export function SocialLinks({
  socials,
}: SocialLinksProps): React.ReactElement | null {
  const entries = SOCIAL_PLATFORMS.filter((platform) => socials[platform]);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((platform: SocialPlatform) => {
        const Icon = PLATFORM_ICONS[platform];
        const handle = socials[platform]!;
        return (
          <a
            key={platform}
            href={socialUrl(platform, handle)}
            target="_blank"
            rel="noreferrer"
            title={`${SOCIAL_LABELS[platform]}: ${handle}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-text transition-colors hover:border-primaryColor hover:text-primaryColor"
          >
            <Icon size={14} aria-hidden="true" />
            <span className="truncate">
              {platform === "website"
                ? handle.replace(/^https?:\/\//, "")
                : `@${handle}`}
            </span>
          </a>
        );
      })}
    </div>
  );
}
