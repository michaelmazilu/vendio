import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ActivityEvent, Conversation, GeneratedListing } from "@/types/app";

const dataDir = path.join(process.cwd(), ".vendio");
const storePath = path.join(dataDir, "conversations.json");

export type ListingThreads = {
  listingId: string;
  listing: GeneratedListing;
  conversations: Conversation[];
  activity: ActivityEvent[];
};

type StoreData = Record<string, ListingThreads>;

async function readStore(): Promise<StoreData> {
  try {
    const contents = await readFile(storePath, "utf8");
    return JSON.parse(contents) as StoreData;
  } catch {
    return {};
  }
}

async function writeStore(data: StoreData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(data, null, 2));
}

export async function getListingThreads(listingId: string): Promise<ListingThreads | null> {
  const store = await readStore();
  return store[listingId] ?? null;
}

/** Loads the listing's thread state, creating an empty record if needed. */
export async function ensureListingThreads(
  listingId: string,
  listing: GeneratedListing,
): Promise<ListingThreads> {
  const store = await readStore();
  const existing = store[listingId];
  if (existing) {
    existing.listing = listing; // keep latest edited copy
    return existing;
  }

  const created: ListingThreads = {
    listingId,
    listing,
    conversations: [],
    activity: [],
  };
  store[listingId] = created;
  await writeStore(store);
  return created;
}

export async function saveListingThreads(entry: ListingThreads): Promise<void> {
  const store = await readStore();
  store[entry.listingId] = entry;
  await writeStore(store);
}
