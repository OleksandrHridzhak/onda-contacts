import React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { SOURCE_META } from "shared/lib/platforms";
import { Card } from "shared/ui/Card";
import { Text } from "shared/ui/Text";
import type { ImportGuide } from "../lib/sources";

interface SourceGuideCardProps {
  guide: ImportGuide;
  isOpen: boolean;
  onToggle: () => void;
}

export function SourceGuideCard({
  guide,
  isOpen,
  onToggle,
}: SourceGuideCardProps): React.ReactElement {
  const Icon = SOURCE_META[guide.id].icon;

  return (
    <Card className={`p-0 transition-shadow ${isOpen ? "shadow-md" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor text-white">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">{guide.title}</p>
          <Text variant="caption" tone="muted" className="truncate">
            {guide.accepts}
          </Text>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-textMuted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-text">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {guide.note && (
            <Text variant="caption" tone="subtle">
              {guide.note}
            </Text>
          )}
          {guide.exportUrl && (
            <a
              href={guide.exportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primaryColor hover:underline"
            >
              Open export page <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
