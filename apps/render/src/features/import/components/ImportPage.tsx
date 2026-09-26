import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Import } from "lucide-react";
import type { ImportDraft, ImportSummary } from "@onda/shared";
import { parseImportFiles } from "@onda/shared";
import { PageHeader } from "shared/ui/PageHeader";
import { Card } from "shared/ui/Card";
import { Heading } from "shared/ui/Heading";
import { Text } from "shared/ui/Text";
import { IMPORT_GUIDES } from "../lib/sources";
import { readImportFiles } from "../lib/readImportFiles";
import { importDrafts } from "../api/import";
import { DropZone } from "./DropZone";
import { ImportPreview } from "./ImportPreview";
import { SourceGuideCard } from "./SourceGuideCard";

interface ParsedState {
  drafts: ImportDraft[];
  unrecognized: string[];
}

export function ImportPage(): React.ReactElement {
  const [openGuide, setOpenGuide] = useState<string | null>("telegram");
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");

  const handleFiles = async (files: File[]) => {
    setIsReading(true);
    setError("");
    setSummary(null);
    try {
      const importFiles = await readImportFiles(files);
      const result = parseImportFiles(importFiles);
      if (result.drafts.length === 0) {
        setParsed(null);
        setError(
          importFiles.length === 0
            ? "No readable files found. Use a .zip, .json, .csv or .vcf export."
            : "We couldn't find any contacts in these files. Check the export format (JSON for Telegram/Instagram) and try again.",
        );
      } else {
        setParsed({ drafts: result.drafts, unrecognized: result.unrecognized });
      }
    } catch (err) {
      console.error("[Import] Failed to read files:", err);
      setError(`Couldn't read these files: ${(err as Error).message}`);
    } finally {
      setIsReading(false);
    }
  };

  const handleImport = async (drafts: ImportDraft[]) => {
    setIsImporting(true);
    setError("");
    try {
      const res = await importDrafts(drafts);
      if (res.success && res.data) {
        setSummary(res.data);
        setParsed(null);
      } else {
        setError(res.error || "Import failed");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="custom-scroll flex h-full min-h-0 flex-col overflow-y-auto bg-background font-poppins">
      <PageHeader title="Import" icon={<Import size={22} />} />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 p-4 pb-24 md:p-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div>
            <Heading as="h2" variant="lg">
              Bring your people in
            </Heading>
            <Text tone="muted" className="mt-1">
              Onda Contacts is free and local-first. Export your data from each
              network, drop the files below and we&apos;ll build one address
              book — duplicates merged across networks.
            </Text>
          </div>

          <DropZone
            onFiles={(files) => void handleFiles(files)}
            isBusy={isReading}
          />

          {error && (
            <Text tone="danger" className="rounded-xl border border-danger p-3">
              {error}
            </Text>
          )}

          {summary && (
            <Card className="flex items-start gap-3 p-5">
              <CheckCircle2
                className="mt-0.5 shrink-0 text-primaryColor"
                size={22}
              />
              <div className="space-y-1">
                <Heading as="h3" variant="base">
                  Import complete
                </Heading>
                <Text tone="muted">
                  {summary.created} new contacts, {summary.merged} merged into
                  existing ones
                  {summary.skipped ? `, ${summary.skipped} skipped` : ""}.
                </Text>
                <Link
                  to="/"
                  className="inline-block pt-1 text-sm font-medium text-primaryColor hover:underline"
                >
                  Go to contacts →
                </Link>
              </div>
            </Card>
          )}

          {parsed && (
            <ImportPreview
              key={parsed.drafts.length}
              drafts={parsed.drafts}
              unrecognized={parsed.unrecognized}
              isImporting={isImporting}
              onImport={(drafts) => void handleImport(drafts)}
              onCancel={() => setParsed(null)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Heading as="h3" variant="s" className="px-1">
            How to export
          </Heading>
          {IMPORT_GUIDES.map((guide) => (
            <SourceGuideCard
              key={guide.id}
              guide={guide}
              isOpen={openGuide === guide.id}
              onToggle={() =>
                setOpenGuide(openGuide === guide.id ? null : guide.id)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
