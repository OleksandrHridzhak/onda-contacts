import React from "react";
import { Check } from "lucide-react";
import type { Tag } from "@onda/shared";
import { getColorStyle } from "shared/lib/color";

interface TagPickerProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({
  tags,
  selectedIds,
  onChange,
}: TagPickerProps): React.ReactElement {
  if (tags.length === 0) {
    return (
      <p className="text-xs text-textSubtle">
        No tags yet — create them with the tag button in the contact list.
      </p>
    );
  }

  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((tagId) => tagId !== id)
        : [...selectedIds, id],
    );

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        const color = getColorStyle(tag.color);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            aria-pressed={selected}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${color.bg} ${color.text} ${
              selected
                ? "ring-2 ring-primaryColor"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            {selected && <Check size={12} />}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
