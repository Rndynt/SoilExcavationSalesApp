import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { id, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, Receipt, List, Calendar } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

type DisplayMode = "pnl" | "expenses" | "category";
type ViewMode = "calendar" | "list";

export default function PnLCalendarPage() {
  const t = useTranslate();
  const { language } = useLanguage();
  const locale = language === "id" ? id : enUS;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<DisplayMode>("pnl");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [locationId, setLocationId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch locations
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch expense categories
  const { data: expenseCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/expense-categories"],
  });

  // Fetch report data for the month
  const { data: reportData, isLoading, error } = useQuery<any>({
    queryKey: ["/api/reports/dashboard", {
      from: format(monthStart, "yyyy-MM-dd"),
      to: format(monthEnd, "yyyy-MM-dd"),
      locationId: locationId === "all" ? undefined : locationId
    }],
    queryFn: async ({ queryKey }) => {
      const [_path, params] = queryKey as [string, any];
      const searchParams = new URLSearchParams();
      searchParams.append("from", params.from);
      searchParams.append("to", params.to);
      if (params.locationId) searchParams.append("locationId", params.locationId);

      const res = await fetch(`${_path}?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    }
  });

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const fmtMoneyShort = (n: number) => {
    if (Math.abs(n) >= 1000000) {
      return `${(n / 1000000).toFixed(1)}jt`;
    }
    if (Math.abs(n) >= 1000) {
      return `${(n / 1000).toFixed(0)}rb`;
    }
    return n.toString();
  };

  // Calculate per-day data
  const dayDataMap = useMemo(() => {
    const map = new Map<string, {
      trips: any[];
      expenses: any[];
      netRevenue: number;
      totalExpenses: number;
      operationalExpenses: number;
      categoryExpenses: Map<string, number>;
      pnl: number;
    }>();

    if (!reportData) return map;

    const trips = reportData.trips || [];
    const detailExpenses = reportData.detailExpenses || [];

    // Process each day
    days.forEach(day => {
      const dayStr = format(day, "yyyy-MM-dd");

      // Get trips for this day
      const dayTrips = trips.filter((t: any) => t.transDate === dayStr);

      // Get expenses for this day (exclude DISCOUNT from expenses)
      const dayExpenses = detailExpenses.filter((e: any) =>
        e.expenseDate === dayStr &&
        e.categoryType !== "DISCOUNT" &&
        !e.categoryName?.toLowerCase().includes("discount")
      );

      // Calculate net revenue (applied price total)
      const netRevenue = dayTrips.reduce((sum: number, t: any) => sum + (t.appliedPrice || 0), 0);

      // Calculate total expenses (all except DISCOUNT)
      const totalExpenses = dayExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // Calculate operational expenses only
      const operationalExpenses = dayExpenses
        .filter((e: any) => e.categoryType === "OPERATIONAL")
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // Calculate expenses per category
      const categoryExpenses = new Map<string, number>();
      dayExpenses.forEach((e: any) => {
        const catId = e.categoryId || "unknown";
        const current = categoryExpenses.get(catId) || 0;
        categoryExpenses.set(catId, current + (e.amount || 0));
      });

      // PnL = netRevenue - totalExpenses (same as "Estimasi Laba Akhir")
      const pnl = netRevenue - totalExpenses;

      map.set(dayStr, {
        trips: dayTrips,
        expenses: dayExpenses,
        netRevenue,
        totalExpenses,
        operationalExpenses,
        categoryExpenses,
        pnl
      });
    });

    return map;
  }, [reportData, days]);

  // Get value for display based on mode
  const getDayValue = (day: Date): { value: number; hasData: boolean } => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayData = dayDataMap.get(dayStr);

    if (!dayData) return { value: 0, hasData: false };

    if (displayMode === "pnl") {
      const hasTripsOrExpenses = dayData.trips.length > 0 || dayData.expenses.length > 0;
      return { value: dayData.pnl, hasData: hasTripsOrExpenses };
    }

    if (displayMode === "expenses") {
      return { value: dayData.totalExpenses, hasData: dayData.expenses.length > 0 };
    }

    if (displayMode === "category" && selectedCategoryId !== "all") {
      const catExpense = dayData.categoryExpenses.get(selectedCategoryId) || 0;
      return { value: catExpense, hasData: catExpense > 0 };
    }

    return { value: 0, hasData: false };
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    let totalPnl = 0;
    let totalExpenses = 0;
    let totalCategoryExpenses = 0;
    let daysWithData = 0;

    dayDataMap.forEach((data) => {
      if (data.trips.length > 0 || data.expenses.length > 0) {
        daysWithData++;
        totalPnl += data.pnl;
        totalExpenses += data.totalExpenses;

        if (selectedCategoryId !== "all") {
          totalCategoryExpenses += data.categoryExpenses.get(selectedCategoryId) || 0;
        }
      }
    });

    return {
      totalPnl,
      totalExpenses,
      totalCategoryExpenses,
      daysWithData,
      avgPnl: daysWithData > 0 ? totalPnl / daysWithData : 0
    };
  }, [dayDataMap, selectedCategoryId]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Filter categories - only show non-system categories
  const availableCategories = useMemo(() => {
    return expenseCategories.filter((cat: any) => !cat.isSystem && cat.type !== "DISCOUNT");
  }, [expenseCategories]);

  // Get display label
  const getDisplayLabel = () => {
    if (displayMode === "pnl") return "Estimasi Laba Akhir";
    if (displayMode === "expenses") return "Total Pengeluaran";
    if (displayMode === "category") {
      const cat = availableCategories.find((c: any) => c.id === selectedCategoryId);
      return cat ? cat.name : "Kategori";
    }
    return "";
  };

  // Get summary value for current mode
  const getSummaryValue = () => {
    if (displayMode === "pnl") return monthlyTotals.totalPnl;
    if (displayMode === "expenses") return monthlyTotals.totalExpenses;
    if (displayMode === "category") return monthlyTotals.totalCategoryExpenses;
    return 0;
  };

  // Get days with data for list view
  const daysWithDataList = useMemo(() => {
    const list: { day: Date; data: any; value: number; hasData: boolean }[] = [];
    days.forEach(day => {
      const { value, hasData } = getDayValue(day);
      const dayStr = format(day, "yyyy-MM-dd");
      const dayData = dayDataMap.get(dayStr);
      if (dayData && (dayData.trips.length > 0 || dayData.expenses.length > 0)) {
        list.push({ day, data: dayData, value, hasData });
      }
    });
    return list.reverse(); // Most recent first
  }, [days, dayDataMap, displayMode, selectedCategoryId]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">PnL Calendar</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Estimasi laba bersih harian berdasarkan omzet bersih dikurangi pengeluaran.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hari Ini
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: Display Mode & View Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Display Mode Selector */}
              <div className="flex-1 sm:flex-none">
                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Tampilan</span>
                <Select value={displayMode} onValueChange={(v) => {
                  setDisplayMode(v as DisplayMode);
                  if (v !== "category") setSelectedCategoryId("all");
                }}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue placeholder="Pilih tampilan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pnl">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Estimasi Laba Akhir
                      </div>
                    </SelectItem>
                    <SelectItem value="expenses">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Total Pengeluaran
                      </div>
                    </SelectItem>
                    <SelectItem value="category">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Per Kategori
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Selector (only when category mode is selected) */}
              {displayMode === "category" && (
                <div className="flex-1 sm:flex-none">
                  <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Kategori</span>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {availableCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Location Selector */}
              <div className="flex-1 sm:flex-none">
                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Lokasi</span>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Semua Lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Lokasi</SelectItem>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle - Mobile Only */}
              <div className="sm:hidden">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Mode</span>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => setViewMode("calendar")}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Kalender
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            </div>

            {/* Row 2: Summary */}
            <div className="flex items-center justify-between border-t pt-3 md:border-t-0 md:pt-0">
              <div className="flex items-center gap-4 md:ml-auto">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] md:text-xs text-muted-foreground">{getDisplayLabel()}</div>
                  <div className={cn(
                    "text-base md:text-lg font-bold font-mono",
                    displayMode === "pnl"
                      ? getSummaryValue() >= 0 ? "text-green-600" : "text-red-600"
                      : "text-foreground"
                  )}>
                    {fmtMoney(getSummaryValue())}
                  </div>
                </div>
                {displayMode === "pnl" && (
                  <div className="text-left sm:text-right border-l pl-3 md:pl-4">
                    <div className="text-[10px] md:text-xs text-muted-foreground">Rata-rata/hari</div>
                    <div className={cn(
                      "text-sm font-mono",
                      monthlyTotals.avgPnl >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {fmtMoney(monthlyTotals.avgPnl)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar - Desktop always shows, Mobile only when viewMode === "calendar" */}
      <Card className={cn("hidden md:block", viewMode === "calendar" && "block md:block")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-4 px-3 md:px-6">
          <CardTitle className="text-sm md:text-base font-medium">
            {format(currentMonth, "MMMM yyyy", { locale })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 md:px-6 pb-3 md:pb-6">
          {isLoading ? (
            <div className="flex justify-center p-8 md:p-12">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-8 md:p-12 text-destructive">
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8" />
              <p className="text-sm">Gagal memuat data</p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-3 md:mb-4 text-[10px] md:text-xs text-muted-foreground px-1">
                {displayMode === "pnl" ? (
                  <>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-green-100 border border-green-300" />
                      <span>Profit</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-red-100 border border-red-300" />
                      <span>Rugi</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-muted border" />
                      <span>Tidak ada data</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-blue-100 border border-blue-300" />
                      <span>Ada Pengeluaran</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-muted border" />
                      <span>Tidak ada data</span>
                    </div>
                  </>
                )}
              </div>

              {/* Calendar Grid - Mobile Optimized */}
              <div className={cn(
                "grid gap-0.5 md:gap-1",
                "md:grid-cols-7",
                viewMode === "calendar" ? "grid-cols-7" : "hidden md:grid-cols-7"
              )}>
                {/* Day Headers */}
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                  <div key={i} className="p-1 md:p-2 text-center text-[9px] md:text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}

                {/* Empty cells for days before the 1st */}
                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1 min-h-[45px] md:min-h-[100px] bg-muted/30 rounded" />
                ))}

                {/* Day cells */}
                {days.map((day) => {
                  const { value, hasData } = getDayValue(day);
                  const dayStr = format(day, "yyyy-MM-dd");
                  const dayData = dayDataMap.get(dayStr);
                  const tripsCount = dayData?.trips.length || 0;

                  // Determine cell styling based on display mode
                  let cellClass = "bg-background hover:bg-muted/50";
                  let valueClass = "";

                  if (displayMode === "pnl") {
                    if (hasData) {
                      if (value > 0) {
                        cellClass = "bg-green-50 hover:bg-green-100 border-green-200";
                        valueClass = "text-green-700 bg-green-100";
                      } else if (value < 0) {
                        cellClass = "bg-red-50 hover:bg-red-100 border-red-200";
                        valueClass = "text-red-700 bg-red-100";
                      } else {
                        cellClass = "bg-muted/50 hover:bg-muted";
                        valueClass = "text-muted-foreground bg-muted";
                      }
                    }
                  } else {
                    if (hasData && value > 0) {
                      cellClass = "bg-blue-50 hover:bg-blue-100 border-blue-200";
                      valueClass = "text-blue-700 bg-blue-100";
                    }
                  }

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "p-1 md:p-2 min-h-[45px] md:min-h-[100px] border rounded transition-all flex flex-col",
                        cellClass,
                        isToday(day) && "ring-1 md:ring-2 ring-primary ring-offset-0 md:ring-offset-1"
                      )}
                    >
                      {/* Day number - Mobile: smaller, Desktop: normal */}
                      <div className="flex items-center justify-between mb-0.5 md:mb-1">
                        <span className={cn(
                          "text-[10px] md:text-sm font-medium",
                          isToday(day) && "text-primary font-bold"
                        )}>
                          {format(day, "d")}
                        </span>
                        {tripsCount > 0 && (
                          <span className="text-[8px] md:text-[10px] bg-primary/10 text-primary px-0.5 md:px-1.5 py-0 md:py-0.5 rounded font-medium">
                            {tripsCount}
                          </span>
                        )}
                      </div>

                      {/* Value - Mobile: simplified, Desktop: full */}
                      {hasData && (
                        <div className="mt-auto">
                          <div className={cn(
                            "text-center py-0.5 md:py-1.5 rounded text-[8px] md:text-[11px] font-mono font-semibold",
                            valueClass
                          )}>
                            {displayMode === "pnl" && value > 0 ? "+" : ""}
                            {fmtMoneyShort(value)}
                          </div>
                          {/* Desktop only: detail breakdown */}
                          <div className="hidden md:block">
                            {displayMode === "pnl" && dayData && (
                              <div className="text-[9px] text-muted-foreground text-center mt-1 space-y-0.5">
                                {dayData.netRevenue > 0 && (
                                  <div>Omzet: {fmtMoneyShort(dayData.netRevenue)}</div>
                                )}
                                {dayData.totalExpenses > 0 && (
                                  <div>Exp: {fmtMoneyShort(dayData.totalExpenses)}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* List View - Mobile Only */}
      {viewMode === "list" && (
        <Card className="md:hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3">
            <CardTitle className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy", { locale })}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 p-8 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">Gagal memuat data</p>
              </div>
            ) : daysWithDataList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Tidak ada data untuk bulan ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                {daysWithDataList.map(({ day, data, value, hasData }) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  
                  let bgClass = "bg-muted/50";
                  if (displayMode === "pnl") {
                    if (value > 0) bgClass = "bg-green-50 border-green-200";
                    else if (value < 0) bgClass = "bg-red-50 border-red-200";
                  } else if (hasData && value > 0) {
                    bgClass = "bg-blue-50 border-blue-200";
                  }

                  return (
                    <div
                      key={dayStr}
                      className={cn(
                        "p-3 rounded-lg border",
                        bgClass,
                        isToday(day) && "ring-1 ring-primary"
                      )}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm">
                            {format(day, "EEEE, d MMM", { locale })}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {data.trips.length} trip • {data.expenses.length} pengeluaran
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-bold font-mono",
                            displayMode === "pnl" && value >= 0 ? "text-green-600" : displayMode === "pnl" ? "text-red-600" : "text-blue-600"
                          )}>
                            {displayMode === "pnl" && value > 0 ? "+" : ""}
                            {fmtMoney(value)}
                          </div>
                        </div>
                      </div>

                      {/* Detail Row - only for PnL mode */}
                      {displayMode === "pnl" && (
                        <div className="flex gap-4 text-[10px] text-muted-foreground border-t pt-2 mt-2">
                          <div>
                            <span className="block text-[9px] uppercase font-medium">Omzet</span>
                            <span className="font-mono text-green-600">{fmtMoney(data.netRevenue)}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-medium">Pengeluaran</span>
                            <span className="font-mono text-red-600">-{fmtMoney(data.totalExpenses)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs md:text-sm text-muted-foreground space-y-1 md:space-y-2">
              <p>
                <strong>Estimasi Laba Akhir</strong> = Omzet Bersih - Total Pengeluaran
              </p>
              <p className="text-[10px] md:text-xs hidden md:block">
                • <strong>Omzet Bersih</strong>: Total harga yang diterapkan (applied price) dari semua trip<br/>
                • <strong>Total Pengeluaran</strong>: Semua pengeluaran operasional dan non-operasional (tidak termasuk diskon otomatis)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
