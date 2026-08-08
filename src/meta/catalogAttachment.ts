import fs from "fs";
import path from "path";
import { CATALOG_FILENAME } from "../catalog";
import { config } from "../config";
import {
  sendInstagramFileByAttachmentId,
  uploadReusablePdf,
} from "./sendMessage";

let cachedAttachmentId: string | null = null;
let warmupPromise: Promise<string> | null = null;

function cacheFilePath(): string {
  const dir = path.dirname(path.resolve(config.databasePath));
  return path.join(dir, "catalog-attachment-id.txt");
}

function readCachedId(): string | null {
  if (cachedAttachmentId) {
    return cachedAttachmentId;
  }

  try {
    const value = fs.readFileSync(cacheFilePath(), "utf8").trim();
    if (value) {
      cachedAttachmentId = value;
      return value;
    }
  } catch {
    // no cache yet
  }

  return null;
}

function writeCachedId(attachmentId: string): void {
  cachedAttachmentId = attachmentId;
  const filePath = cacheFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, attachmentId, "utf8");
}

export function clearCatalogAttachmentCache(): void {
  cachedAttachmentId = null;
  try {
    fs.unlinkSync(cacheFilePath());
  } catch {
    // ignore
  }
}

export function localCatalogPath(): string {
  return path.join(process.cwd(), "public", CATALOG_FILENAME);
}

async function uploadFreshCatalogAttachment(): Promise<string> {
  const filePath = localCatalogPath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`Catalog PDF missing at ${filePath}`);
  }

  console.log("Uploading catalog PDF to Instagram as reusable attachment...");
  const attachmentId = await uploadReusablePdf(filePath, CATALOG_FILENAME);
  writeCachedId(attachmentId);
  console.log("Catalog attachment ready:", attachmentId);
  return attachmentId;
}

export async function getCatalogAttachmentId(
  forceRefresh = false
): Promise<string> {
  if (!forceRefresh) {
    const existing = readCachedId();
    if (existing) {
      return existing;
    }
  } else {
    clearCatalogAttachmentCache();
  }

  if (!warmupPromise) {
    warmupPromise = uploadFreshCatalogAttachment().finally(() => {
      warmupPromise = null;
    });
  }

  return warmupPromise;
}

/** Best option: send native Instagram PDF file bubble (no web link). */
export async function sendCatalogAsNativePdf(
  recipientId: string
): Promise<string> {
  const firstId = await getCatalogAttachmentId(false);
  try {
    await sendInstagramFileByAttachmentId(recipientId, firstId);
    return firstId;
  } catch (error) {
    console.warn(
      "Cached catalog attachment failed, re-uploading once:",
      error
    );
  }

  const freshId = await getCatalogAttachmentId(true);
  await sendInstagramFileByAttachmentId(recipientId, freshId);
  return freshId;
}

export async function warmCatalogAttachment(): Promise<void> {
  try {
    await getCatalogAttachmentId(false);
  } catch (error) {
    console.error("Catalog PDF warmup failed:", error);
  }
}
