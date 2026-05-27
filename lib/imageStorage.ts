import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StoredImagePublic, StoredImageRecord } from "@/types/listing";

const dataDir = path.join(process.cwd(), ".vendio");
const publicUploadDir = path.join(process.cwd(), "public", "uploads");
const imageIndexPath = path.join(dataDir, "images.json");

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function ensureStorage() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(publicUploadDir, { recursive: true });
}

async function readImageIndex(): Promise<StoredImageRecord[]> {
  try {
    const contents = await readFile(imageIndexPath, "utf8");
    return JSON.parse(contents) as StoredImageRecord[];
  } catch {
    return [];
  }
}

async function writeImageIndex(records: StoredImageRecord[]) {
  await ensureStorage();
  await writeFile(imageIndexPath, JSON.stringify(records, null, 2));
}

function safeExtension(file: File) {
  const mimeExtension = extensionByMime[file.type];
  if (mimeExtension) {
    return mimeExtension;
  }

  const sourceExtension = path.extname(file.name).replace(".", "").toLowerCase();
  return sourceExtension || "jpg";
}

export async function saveUploadedImage(file: File): Promise<StoredImageRecord> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  await ensureStorage();

  const id = randomUUID();
  const extension = safeExtension(file);
  const filename = `${id}.${extension}`;
  const absolutePath = path.join(publicUploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  const record: StoredImageRecord = {
    id,
    filename,
    absolutePath,
    mimeType: file.type || "image/jpeg",
    url: `/uploads/${filename}`,
    createdAt: new Date().toISOString(),
  };

  const records = await readImageIndex();
  records.unshift(record);
  await writeImageIndex(records.slice(0, 50));

  return record;
}

export async function saveUploadedImages(files: File[]): Promise<StoredImageRecord[]> {
  if (files.length === 0) {
    throw new Error("Upload at least one item photo.");
  }

  return Promise.all(files.map((file) => saveUploadedImage(file)));
}

export async function getStoredImage(id: string): Promise<StoredImageRecord | null> {
  const records = await readImageIndex();
  return records.find((record) => record.id === id) ?? null;
}

export async function getStoredImages(ids: string[]): Promise<StoredImageRecord[]> {
  const records = await readImageIndex();
  const imageById = new Map(records.map((record) => [record.id, record]));
  const images = ids.map((id) => imageById.get(id)).filter((record): record is StoredImageRecord => Boolean(record));

  if (images.length !== ids.length) {
    throw new Error("One or more uploaded photos could not be found.");
  }

  return images;
}

export function toPublicImage(record: StoredImageRecord): StoredImagePublic {
  return {
    id: record.id,
    url: record.url,
    filename: record.filename,
  };
}

export function toPublicImages(records: StoredImageRecord[]): StoredImagePublic[] {
  return records.map(toPublicImage);
}
