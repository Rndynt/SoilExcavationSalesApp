import { openDB, type IDBPDatabase } from 'idb';

export interface OutboxItem {
  id: string;
  entityType: 'saleTrip' | 'expense';
  action: 'create' | 'update' | 'delete';
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: Record<string, unknown>;
  createdAt: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  lastError?: string;
  clientId: string;
  clientCreatedAt: string;
}

const DB_NAME = 'logitrack-offline';
const DB_VERSION = 1;
const OUTBOX_STORE = 'outbox';

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          const store = db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function addToOutbox(item: Omit<OutboxItem, 'id' | 'createdAt' | 'status'>): Promise<OutboxItem> {
  const db = await getDB();
  const fullItem: OutboxItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'pending',
  };
  await db.put(OUTBOX_STORE, fullItem);
  return fullItem;
}

export async function getPendingItems(): Promise<OutboxItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex(OUTBOX_STORE, 'status', 'pending');
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getFailedItems(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAllFromIndex(OUTBOX_STORE, 'status', 'failed');
}

export async function getAllOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAll(OUTBOX_STORE);
}

export async function updateOutboxItem(id: string, updates: Partial<OutboxItem>): Promise<void> {
  const db = await getDB();
  const item = await db.get(OUTBOX_STORE, id);
  if (item) {
    await db.put(OUTBOX_STORE, { ...item, ...updates });
  }
}

export async function removeFromOutbox(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(OUTBOX_STORE, id);
}

export async function clearSyncedItems(): Promise<void> {
  const db = await getDB();
  const syncedItems = await db.getAllFromIndex(OUTBOX_STORE, 'status', 'synced');
  for (const item of syncedItems) {
    await db.delete(OUTBOX_STORE, item.id);
  }
}

export async function getOutboxCount(): Promise<{ pending: number; failed: number }> {
  const db = await getDB();
  const pending = await db.countFromIndex(OUTBOX_STORE, 'status', 'pending');
  const failed = await db.countFromIndex(OUTBOX_STORE, 'status', 'failed');
  return { pending, failed };
}

export function generateIdempotencyKeys(): { clientId: string; clientCreatedAt: string } {
  return {
    clientId: crypto.randomUUID(),
    clientCreatedAt: new Date().toISOString(),
  };
}
