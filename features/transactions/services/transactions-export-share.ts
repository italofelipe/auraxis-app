import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { TransactionExportBlob } from "@/features/transactions/contracts";

const documentDirectory = (): string | null => {
  // Expo File System exposes a sandboxed dir per platform. Falls back to
  // the cache dir when document dir is missing (paranoid; should never
  // happen on iOS / Android).
  return (
    (FileSystem.documentDirectory as string | null) ??
    (FileSystem.cacheDirectory as string | null) ??
    null
  );
};

/**
 * Writes the export blob to a temp file under the app's document
 * directory and opens the OS share sheet so the user can save / send
 * it. Each call uses a fresh path that includes the filename so the
 * receiving app sees a meaningful name.
 *
 * Throws when:
 * - no writable directory is available (catastrophic; never on real RN)
 * - sharing is unavailable on the platform (browser preview)
 *
 * @param blob Result of `transactionsExportService.download`.
 */
export const shareTransactionsExport = async (
  blob: TransactionExportBlob,
): Promise<void> => {
  const dir = documentDirectory();
  if (!dir) {
    throw new Error("export.no_writable_directory");
  }
  const path = `${dir}${blob.filename}`;
  await FileSystem.writeAsStringAsync(path, blob.base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("export.sharing_unavailable");
  }
  await Sharing.shareAsync(path, {
    mimeType: blob.contentType,
    dialogTitle: blob.filename,
    UTI: blob.contentType === "application/pdf" ? "com.adobe.pdf" : undefined,
  });
};
