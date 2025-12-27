import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { getAllOutboxItems, type OutboxItem } from "@/lib/offline-store";
import { format } from "date-fns";
import { useTranslate } from "@/hooks/use-translate";

const getStatusBadge = (status: OutboxItem["status"]) => {
  switch (status) {
    case "failed":
      return "destructive";
    case "syncing":
      return "secondary";
    case "synced":
      return "outline";
    default:
      return "secondary";
  }
};

const getActionLabel = (item: OutboxItem) => {
  if (item.entityType === "saleTrip") {
    return item.action === "create" ? "Sale Trip - Create" : `Sale Trip - ${item.action}`;
  }
  return item.action === "create" ? "Expense - Create" : `Expense - ${item.action}`;
};

export default function SyncQueue() {
  const t = useTranslate();
  const { isOnline, isSyncing, syncNow, pendingCount, failedCount } = useOfflineSync();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = async () => {
    try {
      const outboxItems = await getAllOutboxItems();
      setItems(outboxItems.sort((a, b) => b.createdAt - a.createdAt));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const interval = setInterval(loadItems, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("syncqueue.title")}</h2>
          <p className="text-muted-foreground mt-1">{t("syncqueue.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{t("syncqueue.pending")}: {pendingCount}</Badge>
          <Badge variant={failedCount > 0 ? "destructive" : "secondary"}>{t("syncqueue.failed")}: {failedCount}</Badge>
          <Button onClick={syncNow} disabled={!isOnline || isSyncing}>
            {isSyncing ? t("syncqueue.syncing") : t("syncqueue.syncnow")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">{t("syncqueue.loading")}</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">{t("syncqueue.empty")}</div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(item.status)}>{item.status}</Badge>
                      <span className="text-sm font-medium">{getActionLabel(item)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("syncqueue.createdat")}: {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </div>
                    {item.lastError && (
                      <div className="text-xs text-destructive">
                        {t("syncqueue.lasterror")}: {item.lastError}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("syncqueue.endpoint")}: {item.method} {item.url}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
