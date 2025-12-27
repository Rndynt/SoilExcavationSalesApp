import { useState, useEffect, useCallback } from 'react';
import { 
  addToOutbox, 
  getPendingItems, 
  getFailedItems,
  updateOutboxItem, 
  removeFromOutbox, 
  getOutboxCount,
  generateIdempotencyKeys,
  type OutboxItem 
} from '@/lib/offline-store';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime: Date | null;
  lastError: string | null;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncTime: null,
    lastError: null,
  });

  const refreshCounts = useCallback(async () => {
    try {
      const counts = await getOutboxCount();
      setSyncState(prev => ({
        ...prev,
        isOnline,
        pendingCount: counts.pending,
        failedCount: counts.failed,
      }));
    } catch (error) {
      console.error('Failed to refresh outbox counts:', error);
    }
  }, [isOnline]);

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 5000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  useEffect(() => {
    setSyncState(prev => ({ ...prev, isOnline }));
  }, [isOnline]);

  const syncNow = useCallback(async (includeFailed = false) => {
    if (!isOnline || syncState.isSyncing) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const pendingItems = await getPendingItems();
      const failedItems = includeFailed ? await getFailedItems() : [];
      const itemsToSync = [...pendingItems, ...failedItems];

      for (const item of itemsToSync) {
        await updateOutboxItem(item.id, { status: 'syncing' });

        try {
          const payload = { ...item.body } as Record<string, unknown>;
          if (typeof payload.clientCreatedAt === 'string') {
            payload.clientCreatedAt = new Date(payload.clientCreatedAt);
          }
          await apiRequest(item.method, item.url, payload);
          await removeFromOutbox(item.id);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateOutboxItem(item.id, { 
            status: 'failed', 
            lastError: errorMessage 
          });
          setSyncState(prev => ({ 
            ...prev, 
            lastError: `Failed to sync item: ${errorMessage}` 
          }));
          break;
        }
      }

      queryClient.invalidateQueries();

      await refreshCounts();
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncTime: new Date() 
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastError: 'Sync failed' 
      }));
    }
  }, [isOnline, syncState.isSyncing, refreshCounts]);

  useEffect(() => {
    if (isOnline && syncState.pendingCount > 0 && !syncState.isSyncing) {
      syncNow();
    }
  }, [isOnline, syncState.pendingCount, syncState.isSyncing, syncNow]);

  const queueSaleTrip = useCallback(async (data: Record<string, unknown>) => {
    const keys = generateIdempotencyKeys();
    const item = await addToOutbox({
      entityType: 'saleTrip',
      action: 'create',
      url: '/api/sale-trips',
      method: 'POST',
      body: { ...data, ...keys },
      clientId: keys.clientId,
      clientCreatedAt: keys.clientCreatedAt,
    });
    await refreshCounts();
    return item;
  }, [refreshCounts]);

  const queueExpense = useCallback(async (data: Record<string, unknown>) => {
    const keys = generateIdempotencyKeys();
    const item = await addToOutbox({
      entityType: 'expense',
      action: 'create',
      url: '/api/expenses',
      method: 'POST',
      body: { ...data, ...keys },
      clientId: keys.clientId,
      clientCreatedAt: keys.clientCreatedAt,
    });
    await refreshCounts();
    return item;
  }, [refreshCounts]);

  return {
    ...syncState,
    syncNow,
    queueSaleTrip,
    queueExpense,
    refreshCounts,
  };
}
