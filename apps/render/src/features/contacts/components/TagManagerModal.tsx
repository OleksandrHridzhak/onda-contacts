import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Tag } from "@onda/shared";
import { ModalShell } from "shared/ui/ModalShell";
import { Input } from "shared/ui/Input";
import { Button } from "shared/ui/Button";
import { ColorPicker } from "shared/ui/ColorPicker";
import { Text } from "shared/ui/Text";
import {
  DEFAULT_COLOR_NAME,
  getColorStyle,
  type ColorName,
} from "shared/lib/color";
import { deleteTag, saveTag } from "../api/contacts";

interface TagManagerModalProps {
  isOpen: boolean;
  tags: Tag[];
  onClose: () => void;
}

export function TagManagerModal({
  isOpen,
  tags,
  onClose,
}: TagManagerModalProps): React.ReactElement | null {
  const [name, setName] = useState("");
  const [color, setColor] = useState<ColorName>(DEFAULT_COLOR_NAME);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await saveTag({ name: name.trim(), color });
    setName("");
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Tags">
      <div className="space-y-4">
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex gap-2">
            <Input
              inputSize="sm"
              placeholder="New tag, e.g. Climbing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Tag name"
            />
            <Button type="submit" size="sm" disabled={!name.trim()}>
              <Plus size={14} /> Add
            </Button>
          </div>
          <ColorPicker value={color} onChange={setColor} />
        </form>

        <ul className="max-h-72 space-y-1 overflow-y-auto custom-scroll">
          {tags.length === 0 && (
            <Text tone="subtle" variant="caption">
              No tags yet.
            </Text>
          )}
          {tags.map((tag) => {
            const style = getColorStyle(tag.color);
            return (
              <li
                key={tag.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surfaceMuted"
              >
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                >
                  {tag.name}
                </span>
                <button
                  type="button"
                  onClick={() => void deleteTag(tag.id)}
                  className="rounded-lg p-1 text-textSubtle hover:text-danger"
                  aria-label={`Delete tag ${tag.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </ModalShell>
  );
}
