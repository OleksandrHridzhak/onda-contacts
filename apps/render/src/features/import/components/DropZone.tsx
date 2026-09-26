import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "shared/ui/Button";
import { Text } from "shared/ui/Text";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  isBusy?: boolean;
}

export function DropZone({
  onFiles,
  isBusy = false,
}: DropZoneProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? "border-primaryColor bg-surfaceMuted"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primaryColor text-white">
        <UploadCloud size={26} />
      </div>
      <div>
        <Text className="font-medium">
          {isBusy ? "Reading your export…" : "Drop export files here"}
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          .zip, .json, .csv or .vcf — we detect the source automatically.
          Everything is processed locally on your device.
        </Text>
      </div>
      <Button
        variant="secondary"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
      >
        Choose files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".zip,.json,.csv,.vcf,.vcard"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
