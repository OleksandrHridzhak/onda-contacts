import React, { useState } from "react";
import {
  Mail,
  MessageCircle,
  PhoneCall,
  StickyNote,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Interaction, InteractionType } from "@onda/shared";
import { Button } from "shared/ui/Button";
import { Input } from "shared/ui/Input";
import { Select } from "shared/ui/Select";
import { Textarea } from "shared/ui/Textarea";
import { Text } from "shared/ui/Text";
import { formatDate, toDateInputValue } from "shared/lib/format";
import { createInteraction, deleteInteraction } from "../api/contacts";

export const INTERACTION_META: Record<
  InteractionType,
  { label: string; icon: LucideIcon }
> = {
  note: { label: "Note", icon: StickyNote },
  message: { label: "Message", icon: MessageCircle },
  call: { label: "Call", icon: PhoneCall },
  meeting: { label: "Meeting", icon: Users },
  email: { label: "Email", icon: Mail },
};

interface InteractionTimelineProps {
  contactId: string;
  interactions: Interaction[];
}

export function InteractionTimeline({
  contactId,
  interactions,
}: InteractionTimelineProps): React.ReactElement {
  const [type, setType] = useState<InteractionType>("note");
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => toDateInputValue(null));

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() && type === "note") return;
    const [year, month, day] = date.split("-").map(Number);
    const now = new Date();
    const when = new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
    );
    await createInteraction({
      contactId,
      type,
      text: text.trim(),
      date: when.toISOString(),
    });
    setText("");
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="space-y-2 rounded-xl border border-border bg-background p-3"
      >
        <Textarea
          rows={2}
          placeholder="What did you talk about? Anything to remember?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Interaction text"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            inputSize="sm"
            className="!w-auto"
            value={type}
            onChange={(e) => setType(e.target.value as InteractionType)}
            aria-label="Interaction type"
          >
            {(Object.keys(INTERACTION_META) as InteractionType[]).map((key) => (
              <option key={key} value={key}>
                {INTERACTION_META[key].label}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            inputSize="sm"
            className="!w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Interaction date"
          />
          <Button
            type="submit"
            size="sm"
            className="ml-auto"
            disabled={type === "note" && !text.trim()}
          >
            Add to timeline
          </Button>
        </div>
      </form>

      {interactions.length === 0 ? (
        <Text tone="subtle" variant="caption">
          No interactions yet. Log a call, a coffee or a quick note.
        </Text>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-5">
          {interactions.map((interaction) => {
            const meta =
              INTERACTION_META[interaction.type] ?? INTERACTION_META.note;
            const Icon = meta.icon;
            return (
              <li key={interaction.id} className="group relative">
                <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-primaryColor text-white">
                  <Icon size={11} aria-hidden="true" />
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Text variant="caption" tone="muted">
                      {meta.label} · {formatDate(interaction.date)}
                    </Text>
                    {interaction.text && (
                      <Text className="mt-0.5 whitespace-pre-wrap break-words">
                        {interaction.text}
                      </Text>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteInteraction(interaction.id)}
                    className="rounded-lg p-1 text-textSubtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete interaction"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
