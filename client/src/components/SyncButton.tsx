import { useOfflineSync } from "@/hooks/use-offline-sync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Wifi, WifiOff, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function SyncButton() {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    failedCount, 
    lastSyncTime,
    lastError,
    syncNow 
  } = useOfflineSync();

  const totalPending = pendingCount + failedCount;

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (failedCount > 0) return <AlertCircle className="h-4 w-4" />;
    if (totalPending === 0 && lastSyncTime) return <Check className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (!isOnline) return "text-muted-foreground";
    if (failedCount > 0) return "text-destructive";
    if (isSyncing) return "text-primary";
    return "text-emerald-500";
  };

  const getTooltipContent = () => {
    if (!isOnline) return "Offline - Changes will sync when online";
    if (isSyncing) return "Syncing...";
    if (failedCount > 0) return `${failedCount} failed sync(s) - Click to retry`;
    if (pendingCount > 0) return `${pendingCount} pending sync(s)`;
    if (lastSyncTime) return `Last sync: ${format(lastSyncTime, "HH:mm:ss")}`;
    return "All synced";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={syncNow}
          disabled={!isOnline || isSyncing}
          className={cn("relative", getStatusColor())}
          data-testid="button-sync"
        >
          {getStatusIcon()}
          {totalPending > 0 && (
            <Badge 
              variant={failedCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs"
            >
              {totalPending}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p data-testid="text-sync-status">{getTooltipContent()}</p>
        {lastError && (
          <p className="text-destructive text-xs mt-1" data-testid="text-sync-error">
            Error: {lastError}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
