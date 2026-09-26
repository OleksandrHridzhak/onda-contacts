import { unzip } from "fflate";
import type { ImportFile } from "@onda/shared";
import { IMPORTABLE_EXTENSIONS, isRelevantExportPath } from "@onda/shared";

const decoder = new TextDecoder("utf-8");

function unzipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(
      data,
      { filter: (file) => isRelevantExportPath(file.name) },
      (error, files) => (error ? reject(error) : resolve(files)),
    );
  });
}

const isZip = (file: File) =>
  file.name.toLowerCase().endsWith(".zip") ||
  file.type === "application/zip" ||
  file.type === "application/x-zip-compressed";

/**
 * Reads picked/dropped files into text. ZIP exports (Instagram, Threads,
 * LinkedIn, Telegram) are unpacked in memory and only relevant files are
 * kept — nothing leaves the device.
 */
export async function readImportFiles(files: File[]): Promise<ImportFile[]> {
  const result: ImportFile[] = [];

  for (const file of files) {
    if (isZip(file)) {
      const entries = await unzipAsync(
        new Uint8Array(await file.arrayBuffer()),
      );
      for (const [name, bytes] of Object.entries(entries)) {
        result.push({ name, content: decoder.decode(bytes) });
      }
      continue;
    }

    const lower = file.name.toLowerCase();
    if (IMPORTABLE_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;
      result.push({ name: relativePath, content: await file.text() });
    }
  }

  return result;
}
