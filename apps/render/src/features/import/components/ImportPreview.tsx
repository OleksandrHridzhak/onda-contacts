import React, { useMemo, useState } from "react";
import type { ContactSource, ImportDraft } from "@onda/shared";
import { SOURCE_META } from "shared/lib/platforms";
import { Badge } from "shared/ui/Badge";
import { Button } from "shared/ui/Button";
import { Card } from "shared/ui/Card";
import { Heading } from "shared/ui/Heading";
import { Select } from "shared/ui/Select";
import { Text } from "shared/ui/Text";

export type RelationFilter = "all" | "mutual" | "following" | "none";

const RELATION_LABELS: Record<RelationFilter, string> = {
  all: "Everyone (followers + following)",
  mutual: "Mutual followers & close friends",
  following: "People I follow",
  none: "Skip Instagram/Threads profiles",
};

export function applyRelationFilter(
  drafts: ImportDraft[],
  filter: RelationFilter,
): ImportDraft[] {
  return drafts.filter((draft) => {
    if (!draft.relations?.length || filter === "all") return true;
    const relations = new Set(draft.relations);
    if (filter === "none") return false;
    if (filter === "following")
      return relations.has("following") || relations.has("close_friend");
    return (
      relations.has("close_friend") ||
      (relations.has("following") && relations.has("follower"))
    );
  });
}

interface ImportPreviewProps {
  drafts: ImportDraft[];
  unrecognized: string[];
  isImporting: boolean;
  onImport: (drafts: ImportDraft[]) => void;
  onCancel: () => void;
}

const PREVIEW_LIMIT = 60;

export function ImportPreview({
  drafts,
  unrecognized,
  isImporting,
  onImport,
  onCancel,
}: ImportPreviewProps): React.ReactElement {
  const hasSocialGraph = drafts.some((draft) => draft.relations?.length);
  const [relationFilter, setRelationFilter] = useState<RelationFilter>(
    hasSocialGraph ? "mutual" : "all",
  );
  const selected = useMemo(
    () => applyRelationFilter(drafts, relationFilter),
    [drafts, relationFilter],
  );

  const counts = selected.reduce<Partial<Record<ContactSource, number>>>(
    (acc, draft) => ({ ...acc, [draft.source]: (acc[draft.source] ?? 0) + 1 }),
    {},
  );

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h2" variant="base">
          Found {selected.length} people
        </Heading>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(counts) as ContactSource[]).map((source) => {
            const Icon = SOURCE_META[source].icon;
            return (
              <Badge key={source} size="md">
                <Icon size={12} className="mr-1" aria-hidden="true" />
                {SOURCE_META[source].label}: {counts[source]}
              </Badge>
            );
          })}
        </div>
      </div>

      {hasSocialGraph && (
        <label className="block space-y-1">
          <Text variant="caption" tone="muted">
            Instagram & Threads profiles to import
          </Text>
          <Select
            inputSize="sm"
            value={relationFilter}
            onChange={(e) =>
              setRelationFilter(e.target.value as RelationFilter)
            }
          >
            {(Object.keys(RELATION_LABELS) as RelationFilter[]).map((key) => (
              <option key={key} value={key}>
                {RELATION_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>
      )}

      <ul className="custom-scroll max-h-72 divide-y divide-border overflow-y-auto rounded-xl border border-border">
        {selected.slice(0, PREVIEW_LIMIT).map((draft, index) => {
          const Icon = SOURCE_META[draft.source].icon;
          const detail =
            draft.headline ||
            draft.phones?.[0] ||
            draft.emails?.[0] ||
            (draft.relations ?? []).join(", ");
          return (
            <li
              key={`${draft.source}-${index}`}
              className="flex items-center gap-3 px-3 py-2"
            >
              <Icon
                size={14}
                className="shrink-0 text-textSubtle"
                aria-hidden="true"
              />
              <span className="truncate text-sm text-text">
                {`${draft.firstName} ${draft.lastName}`.trim()}
              </span>
              {detail && (
                <span className="ml-auto truncate text-xs text-textMuted">
                  {detail}
                </span>
              )}
            </li>
          );
        })}
        {selected.length > PREVIEW_LIMIT && (
          <li className="px-3 py-2 text-xs text-textMuted">
            …and {selected.length - PREVIEW_LIMIT} more
          </li>
        )}
      </ul>

      {unrecognized.length > 0 && (
        <Text variant="caption" tone="subtle">
          Skipped {unrecognized.length} unrecognized file
          {unrecognized.length === 1 ? "" : "s"}:{" "}
          {unrecognized.slice(0, 3).join(", ")}
          {unrecognized.length > 3 ? "…" : ""}
        </Text>
      )}

      <Text variant="caption" tone="muted">
        Duplicates are merged automatically by social handle, email, phone or
        full name. Existing details are never overwritten.
      </Text>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isImporting}>
          Cancel
        </Button>
        <Button
          onClick={() => onImport(selected)}
          disabled={isImporting || selected.length === 0}
        >
          {isImporting ? "Importing…" : `Import ${selected.length} contacts`}
        </Button>
      </div>
    </Card>
  );
}
