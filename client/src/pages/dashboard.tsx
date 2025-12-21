import { useState } from "react";
import { useReportsSummary, useLocations } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowUpRight, Truck, Receipt, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslate } from "@/hooks/use-translate";

type TimePreset = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH";

const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: "TODAY", label: "dashboard.today" },
  { value: "YESTERDAY", label: "dashboard.yesterday" },
  { value: "THIS_WEEK", label: "dashboard.thisweek" },
  { value: "THIS_MONTH", label: "dashboard.thismonth" },
  { value: "LAST_MONTH", label: "dashboard.lastmonth" },
];

export default function Dashboard() {
  const t = useTranslate();
  const [preset, setPreset] = useState<TimePreset>("TODAY");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  
  const { data: locations } = useLocations();
  const { data: report, isLoading } = useReportsSummary(preset, locationId);

  const fmtMoney = (n: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const grossRevenue = report?.sales?.grossRevenue ?? 0;
  const totalDiscounts = report?.sales?.totalDiscounts ?? 0;
  const netRevenue = report?.sales?.netRevenue ?? 0;
  const cashCollected = report?.sales?.cashCollected ?? 0;
  const receivables = report?.sales?.receivables ?? 0;
  const totalTrips = report?.sales?.totalTrips ?? 0;
  const totalOperational = report?.expenses?.totalOperational ?? 0;
  
  const profit = netRevenue - totalOperational;
  const cashBasisProfit = cashCollected - totalOperational;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">{t('dashboard.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={locationId ?? "all"} onValueChange={(v) => setLocationId(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[160px]" data-testid="select-location">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations?.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {TIME_PRESETS.map(p => (
          <Button
            key={p.value}
            variant={preset === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPreset(p.value)}
            data-testid={`button-preset-${p.value.toLowerCase()}`}
          >
            {t(p.label)}
          </Button>
        ))}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {report && (
        <p className="text-sm text-muted-foreground">
          {t('dashboard.showingdata')} {report.dateFrom} {t('dashboard.to')} {report.dateTo}
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="order-1" data-testid="card-total-trips">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totaltrips')}</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-total-trips">{totalTrips}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.completedtransactions')}</p>
              </CardContent>
            </Card>

            <Card className="order-2" data-testid="card-gross-revenue">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.grossrevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-gross-revenue">{fmtMoney(grossRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.totalbaseprice')}</p>
              </CardContent>
            </Card>

            <Card className="order-3" data-testid="card-discounts">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.discountsgiven')}</CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-discounts">{fmtMoney(totalDiscounts)}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.priceadjustments')}</p>
              </CardContent>
            </Card>

            <Card className="order-4 bg-primary/5" data-testid="card-net-revenue">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.netrevenue')}</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-primary" data-testid="text-net-revenue">{fmtMoney(netRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.realizedincome')}</p>
              </CardContent>
            </Card>

            <Card className="order-5" data-testid="card-cash-collected">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.cashcollected')}</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-cash-collected">{fmtMoney(cashCollected)}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.actualpayments')}</p>
              </CardContent>
            </Card>

            <Card className="order-6" data-testid="card-receivables">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.receivables')}</CardTitle>
                <Receipt className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-receivables">{fmtMoney(receivables)}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.outstandingamount')}</p>
              </CardContent>
            </Card>

            <Card className="order-7" data-testid="card-operational">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.operationalexpenses')}</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-operational">{fmtMoney(totalOperational)}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.totalspending')}</p>
              </CardContent>
            </Card>

            <Card className="order-8" data-testid="card-profit">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.netprofit')}</CardTitle>
                {profit >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold font-mono", profit >= 0 ? "" : "text-destructive")} data-testid="text-profit">
                   {fmtMoney(profit)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.revenueminusexpenses')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             <Card className="shadow-sm" data-testid="card-cash-profit">
               <CardHeader>
                 <CardTitle>{t('dashboard.cashbasisprofit')}</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex items-center justify-between gap-4">
                   <div>
                      <div className={cn("text-3xl font-bold font-mono", cashBasisProfit >= 0 ? "" : "text-destructive")} data-testid="text-cash-profit">
                        {fmtMoney(cashBasisProfit)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{t('dashboard.cashcollectedminusexpenses')}</p>
                   </div>
                   <div className={cn("p-3 rounded-full", cashBasisProfit >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                     {cashBasisProfit >= 0 ? (
                       <TrendingUp className="w-6 h-6 text-green-500" />
                     ) : (
                       <TrendingDown className="w-6 h-6 text-red-500" />
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card className="shadow-sm" data-testid="card-collection-rate">
               <CardHeader>
                 <CardTitle>{t('dashboard.collectionrate')}</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex items-center justify-between gap-4">
                   <div>
                      <div className="text-3xl font-bold font-mono" data-testid="text-collection-rate">
                        {netRevenue > 0 ? ((cashCollected / netRevenue) * 100).toFixed(1) : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{t('dashboard.percentageofrevenuecollected')}</p>
                   </div>
                   <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                     <Wallet className="w-6 h-6 text-blue-500" />
                   </div>
                 </div>
               </CardContent>
             </Card>
          </div>
        </>
      )}
    </div>
  );
}
