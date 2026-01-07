import { useMemo, useState } from "react";
import { useReportsSummary, useLocations, useSaleTrips, useExpenses, useExpenseCategories } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowUpRight, Truck, Receipt, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslate } from "@/hooks/use-translate";
import { format } from "date-fns";

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
  const [preset, setPreset] = useState<TimePreset | "CUSTOM">("TODAY");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  
  const { data: locations } = useLocations();
  const { data: report, isLoading } = useReportsSummary(preset === "CUSTOM" ? undefined : (preset as any), locationId, preset === "CUSTOM" ? customDateFrom : undefined, preset === "CUSTOM" ? customDateTo : undefined);
  const { data: trips } = useSaleTrips({ locationId, dateFrom: report?.dateFrom, dateTo: report?.dateTo });
  const { data: detailExpenses = [] } = useExpenses({ locationId, dateFrom: report?.dateFrom, dateTo: report?.dateTo });
  const { data: categories = [] } = useExpenseCategories();

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

  const expenseTotalsByCategory = useMemo(() => {
    const totals = new Map<string, { name: string; total: number }>();
    detailExpenses.forEach((expense) => {
      const category = categories.find((c) => c.id === expense.categoryId);
      if (!category) return;
      const existing = totals.get(category.id) ?? { name: category.name, total: 0 };
      totals.set(category.id, { ...existing, total: existing.total + expense.amount });
    });
    return Array.from(totals.values()).sort((a, b) => b.total - a.total);
  }, [detailExpenses, categories]);

  const receivableTrips = useMemo(() => {
    return (trips ?? [])
      .filter((trip) => trip.paymentStatus !== "PAID")
      .map((trip) => ({
        ...trip,
        outstanding: Math.max(0, trip.appliedPrice - trip.paidAmount),
      }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [trips]);

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
        <Button
          variant={preset === "CUSTOM" ? "default" : "outline"}
          size="sm"
          onClick={() => setPreset("CUSTOM")}
          data-testid="button-preset-custom"
        >
          {t("dashboard.customrange")}
        </Button>
        {preset === "CUSTOM" && (
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={customDateFrom}
              onChange={e => setCustomDateFrom(e.target.value)}
              className="w-32 h-9"
              data-testid="input-custom-date-from"
            />
            <span className="text-sm text-muted-foreground">{t("dashboard.to")}</span>
            <Input
              type="date"
              value={customDateTo}
              onChange={e => setCustomDateTo(e.target.value)}
              className="w-32 h-9"
              data-testid="input-custom-date-to"
            />
          </div>
        )}
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
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{t("dashboard.cashin")}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.cashindesc")}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card data-testid="card-net-revenue">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard.netrevenue')}</CardTitle>
                    <Wallet className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-primary" data-testid="text-net-revenue">{fmtMoney(netRevenue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.realizedincome')}</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-cash-collected">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.cashcollected')}</CardTitle>
                    <CreditCard className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-cash-collected">{fmtMoney(cashCollected)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.actualpayments')}</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-receivables">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.receivables')}</CardTitle>
                    <Receipt className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-receivables">{fmtMoney(receivables)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.outstandingamount')}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card data-testid="card-gross-revenue">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.grossrevenue')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-gross-revenue">{fmtMoney(grossRevenue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.totalbaseprice')}</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-discounts">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.discountsgiven')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-discounts">{fmtMoney(totalDiscounts)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.priceadjustments')}</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-trips">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totaltrips')}</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-total-trips">{totalTrips}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.completedtransactions')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t("dashboard.cashout")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.cashoutdesc")}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card data-testid="card-operational">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.operationalexpenses')}</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-operational">{fmtMoney(totalOperational)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.totalspending')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t("dashboard.profitability")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.profitabilitydesc")}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card data-testid="card-profit">
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

                <Card data-testid="card-cash-profit">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.cashbasisprofit')}</CardTitle>
                    {cashBasisProfit >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  </CardHeader>
                  <CardContent>
                    <div className={cn("text-2xl font-bold font-mono", cashBasisProfit >= 0 ? "" : "text-destructive")} data-testid="text-cash-profit">
                      {fmtMoney(cashBasisProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cashcollectedminusexpenses')}</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-collection-rate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.collectionrate')}</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono" data-testid="text-collection-rate">
                      {netRevenue > 0 ? ((cashCollected / netRevenue) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.percentageofrevenuecollected')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm" data-testid="card-expense-category-detail">
              <CardHeader>
                <CardTitle>{t("dashboard.expensecategorydetail")}</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseTotalsByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("dashboard.noexpensecategory")}</p>
                ) : (
                  <div className="space-y-2">
                    {expenseTotalsByCategory.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <span className="font-mono text-sm">{fmtMoney(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm" data-testid="card-receivables-detail">
              <CardHeader>
                <CardTitle>{t("dashboard.receivablesdetail")}</CardTitle>
              </CardHeader>
              <CardContent>
                {receivableTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("dashboard.noreceivables")}</p>
                ) : (
                  <div className="space-y-2">
                    {receivableTrips.map((trip) => (
                      <div key={trip.id} className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{trip.plateNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(trip.transDate), "dd MMM yyyy")} • {trip.paymentStatus}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-muted-foreground">{t("dashboard.outstandingamount")}</p>
                          <p className="font-mono text-sm">{fmtMoney(trip.outstanding)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
