import React from "react";
import { Star, Tags } from "lucide-react";
import type { ContactSource, Tag } from "@onda/shared";
import { Badge } from "shared/ui/Badge";
import { Select } from "shared/ui/Select";
import { getColorStyle } from "shared/lib/color";
import { SOURCE_META } from "shared/lib/platforms";
import {
  useContactsUiStore,
  type ContactsSort,
} from "../stores/useContactsUiStore";

interface ContactFiltersProps {
  tags: Tag[];
  onManageTags: () => void;
}

const chipClass = (active: boolean) =>
  `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "bg-primaryColor text-white"
      : "bg-secondary text-secondaryText hover:bg-secondaryHover"
  }`;

export function ContactFilters({
  tags,
  onManageTags,
}: ContactFiltersProps): React.ReactElement {
  const {
    tagId,
    source,
    favoritesOnly,
    sort,
    setTagId,
    setSource,
    setFavoritesOnly,
    setSort,
  } = useContactsUiStore();

  return (
    <div className="space-y-2 border-b border-border px-3 pb-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={chipClass(!tagId && !favoritesOnly)}
          onClick={() => {
            setTagId(null);
            setFavoritesOnly(false);
          }}
        >
          All
        </button>
        <button
          type="button"
          className={chipClass(favoritesOnly)}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Star size={12} /> Favorites
        </button>
        {tags.map((tag) => {
          const active = tagId === tag.id;
          const color = getColorStyle(tag.color);
          return active ? (
            <button
              key={tag.id}
              type="button"
              className={chipClass(true)}
              onClick={() => setTagId(null)}
            >
              {tag.name}
            </button>
          ) : (
            <Badge
              key={tag.id}
              as="button"
              size="md"
              colorClasses={{ bg: color.bg, text: color.text }}
              onClick={() => setTagId(tag.id)}
            >
              {tag.name}
            </Badge>
          );
        })}
        <button
          type="button"
          className={chipClass(false)}
          onClick={onManageTags}
          aria-label="Manage tags"
          title="Manage tags"
        >
          <Tags size={12} />
        </button>
      </div>
      <div className="flex gap-2">
        <Select
          inputSize="sm"
          value={source ?? ""}
          onChange={(e) =>
            setSource((e.target.value || null) as ContactSource | null)
          }
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {(Object.keys(SOURCE_META) as ContactSource[]).map((key) => (
            <option key={key} value={key}>
              {SOURCE_META[key].label}
            </option>
          ))}
        </Select>
        <Select
          inputSize="sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as ContactsSort)}
          aria-label="Sort contacts"
        >
          <option value="name">Name A–Z</option>
          <option value="recent">Recently added</option>
          <option value="lastContacted">Last contacted</option>
        </Select>
      </div>
    </div>
  );
}
