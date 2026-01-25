import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { id, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Loader2, AlertCircle, Download } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import { useLanguage } from "@/contexts/language-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Define preset functions directly instead of importing from non-existent utils member
const PAGE_TIME_PRESETS = {
  TODAY: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }),
  YESTERDAY: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return { start: startOfDay(d), end: endOfDay(d) };
  },
  THIS_WEEK: () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return { start: startOfDay(start), end: endOfDay(new Date()) };
  },
  THIS_MONTH: () => {
    const start = new Date();
    start.setDate(1);
    return { start: startOfDay(start), end: endOfDay(new Date()) };
  },
  LAST_MONTH: () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    const end = new Date();
    end.setDate(0);
    return { start: startOfDay(start), end: endOfDay(end) };
  }
};

export default function RecapPage() {
  const t = useTranslate();
  const { language } = useLanguage();
  const locale = language === "id" ? id : enUS;
  const [period, setPeriod] = useState<string>("TODAY");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const preset = PAGE_TIME_PRESETS.TODAY();
    return { from: preset.start, to: preset.end };
  });
  const [locationId, setLocationId] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const { data: locations = [] } = useQuery<any[]>({ queryKey: ["/api/locations"] });

  const fromDate = format(dateRange.from, "yyyy-MM-dd");
  const toDate = format(dateRange.to, "yyyy-MM-dd");

  const { data: report, isLoading, error } = useQuery<any>({
    queryKey: ["/api/reports/dashboard", { 
      from: fromDate, 
      to: toDate,
      locationId: locationId === "all" ? undefined : locationId
    }],
    queryFn: async ({ queryKey }) => {
      const [_path, params] = queryKey as [string, any];
      const searchParams = new URLSearchParams();
      if (params.from) searchParams.append("from", params.from);
      if (params.to) searchParams.append("to", params.to);
      if (params.locationId) searchParams.append("locationId", params.locationId);
      
      const url = `${_path}?${searchParams.toString()}`;
      console.log("Fetching report from:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch report: ${res.status} ${errText}`);
      }
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
    retry: 1
  });

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    const presetFunc = (PAGE_TIME_PRESETS as any)[val];
    if (presetFunc) {
      const { start, end } = presetFunc();
      setDateRange({ from: start, to: end });
    }
  };

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);


  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Memuat data rekapan...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-600">Gagal memuat data</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Terjadi kesalahan saat mengambil data dari server. Silakan coba lagi.
          </p>
          <pre className="mt-4 p-2 bg-slate-100 rounded text-[10px] text-left overflow-auto max-h-32">
            {(error as Error).message}
          </pre>
        </div>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    </div>
  );

  const defaultSales = {
    netRevenue: 0,
    cashCollected: 0,
    receivables: 0,
    totalDiscounts: 0
  };
  const defaultExpenses = {
    totalOperational: 0,
    totalExpenses: 0,
    byCategory: []
  };
  const { sales: rawSales, expenses: rawExpenses, trips: rawTrips, detailExpenses: rawDetailExpenses = [] } = report || {};
  const sales = rawSales ?? defaultSales;
  const expenses = rawExpenses ?? defaultExpenses;
  const trips = Array.isArray(rawTrips) ? rawTrips : [];
  const detailExpenses = Array.isArray(rawDetailExpenses) ? rawDetailExpenses : [];

  if (!report || !trips) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-muted-foreground">Tidak ada data untuk periode ini.</p>
        <Button variant="outline" className="mt-4" onClick={() => handlePeriodChange("TODAY")}>
          Kembali ke Hari Ini
        </Button>
      </div>
    </div>
  );
  const locationName = locationId === "all" ? "Semua Lokasi" : locations.find(l => l.id.toString() === locationId)?.name;
  const paymentTotals = trips.reduce(
    (acc, trip) => {
      const paidAmount = trip.paidAmount || 0;
      const method = (trip.paymentMethod || "OTHER").toUpperCase();
      if (!paidAmount) return acc;
      acc.total += paidAmount;
      if (method === "CASH") acc.cash += paidAmount;
      else if (method === "TRANSFER") acc.transfer += paidAmount;
      else if (method === "QRIS") acc.qris += paidAmount;
      else acc.other += paidAmount;
      return acc;
    },
    { total: 0, cash: 0, transfer: 0, qris: 0, other: 0 }
  );
  const paymentBreakdown = [
    { key: "cash", label: "Tunai", total: paymentTotals.cash },
    { key: "transfer", label: "Transfer", total: paymentTotals.transfer },
    { key: "qris", label: "QRIS", total: paymentTotals.qris },
    { key: "other", label: "Lainnya", total: paymentTotals.other }
  ].filter((entry) => entry.total > 0);
  const filteredExpenses = detailExpenses.filter((exp: any) => {
    const cat = (exp.categoryName || exp.category || "").toUpperCase();
    const note = (exp.note || "").toLowerCase();
    return cat !== "DISCOUNT" && !note.includes("auto discount");
  });
  const hasExpenseDetails = filteredExpenses.length > 0;
  const expenseTotalsByCategory = new Map<
    string,
    { name: string; total: number; type: string | null }
  >();
  filteredExpenses.forEach((exp: any) => {
    const key = exp.categoryId || exp.categoryName || exp.category;
    if (!key) return;
    const existing = expenseTotalsByCategory.get(key) ?? {
      name: exp.categoryName || exp.category,
      total: 0,
      type: exp.categoryType ?? null
    };
    expenseTotalsByCategory.set(key, {
      ...existing,
      total: existing.total + (exp.amount || 0),
      type: exp.categoryType ?? existing.type ?? null
    });
  });
  const expenseTotals = Array.from(expenseTotalsByCategory.values());
  const expenseBreakdown = hasExpenseDetails
    ? expenseTotals.filter((entry) => !(entry.name || "").toLowerCase().includes("discount"))
    : (expenses.byCategory ?? [])
        .filter((entry: any) => (entry.categoryType ?? "").toUpperCase() !== "DISCOUNT")
        .map((entry: any) => ({
          name: entry.categoryName,
          total: entry.total,
          type: entry.categoryType ?? null
        }));
  const operationalBreakdown = expenseBreakdown.filter((entry: any) => entry.type === "OPERATIONAL");
  const nonOperationalBreakdown = expenseBreakdown.filter((entry: any) => entry.type !== "OPERATIONAL");
  const totalOperationalAmount = hasExpenseDetails
    ? filteredExpenses.reduce((sum: number, exp: any) => {
        return exp.categoryType === "OPERATIONAL" ? sum + (exp.amount || 0) : sum;
      }, 0)
    : expenses.totalOperational;
  const totalExpenseAmount = hasExpenseDetails
    ? filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
    : expenses.totalExpenses;
  const nonOperationalTotals = nonOperationalBreakdown;
  const nonCashTotal = paymentTotals.transfer + paymentTotals.qris + paymentTotals.other;
  const netCashOnly = paymentTotals.cash - totalExpenseAmount;
  const netCashAll = paymentTotals.total - totalExpenseAmount;

  const handleExportPdf = async () => {
    if (isExporting || !report) return;
    setIsExporting(true);
    try {
      const recapContent = document.getElementById("recap-content");
      if (!recapContent) throw new Error("Konten rekap tidak ditemukan.");

      // Ensure images are loaded and fonts ready
      const images = Array.from(recapContent.getElementsByTagName("img"));
      await Promise.all([
        ...images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
        document.fonts?.ready
      ]);

      // Optimization: Temporary style for capturing
      const originalStyle = recapContent.style.cssText;
      recapContent.style.width = "800px";
      recapContent.style.background = "#ffffff";
      recapContent.style.color = "#000000";

      const canvas = await html2canvas(recapContent, {
        scale: 1.5, // Reduced scale for performance
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging for debugging
        backgroundColor: "#ffffff",
        width: 800,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("recap-content");
          if (!el) return;
          el.style.width = "800px";
          el.style.padding = "40px";
          el.style.margin = "0";
          el.style.background = "#ffffff";
          
          const all = el.getElementsByTagName("*");
          for (let i = 0; i < all.length; i++) {
            const item = all[i] as HTMLElement;
            item.style.color = "#000000";
            item.style.borderColor = "#000000";
          }
        }
      });

      // Restore original style
      recapContent.style.cssText = originalStyle;

      const imgData = canvas.toDataURL("image/jpeg", 0.7); // Use JPEG with compression for smaller size
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - (margin * 2));

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - (margin * 2));
      }

      pdf.save(`rekap-${fromDate}-${toDate}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      window.alert(`Gagal ekspor PDF: ${msg}. Silakan coba reload halaman atau gunakan browser lain.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY">{t("dashboard.today")}</SelectItem>
              <SelectItem value="YESTERDAY">{t("dashboard.yesterday")}</SelectItem>
              <SelectItem value="THIS_WEEK">{t("dashboard.thisweek")}</SelectItem>
              <SelectItem value="THIS_MONTH">{t("dashboard.thismonth")}</SelectItem>
              <SelectItem value="LAST_MONTH">{t("dashboard.lastmonth")}</SelectItem>
              <SelectItem value="CUSTOM">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {period === "CUSTOM" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    const next = new Date(e.target.value);
                    if (!Number.isNaN(next.getTime())) {
                      setDateRange((prev) => ({ ...prev, from: startOfDay(next) }));
                    }
                  }}
                  className="w-[140px] pl-9"
                />
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    const next = new Date(e.target.value);
                    if (!Number.isNaN(next.getTime())) {
                      setDateRange((prev) => ({ ...prev, to: endOfDay(next) }));
                    }
                  }}
                  className="w-[140px] pl-9"
                />
              </div>
            </div>
          )}

          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semua Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportPdf} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      <Card id="recap-content" className="bg-white text-black p-6 md:p-8 w-full shadow-lg print:shadow-none">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>REKAPITULASI</h1>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
            Lokasi: {locationName || "-"}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Periode: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
          </div>
        </div>

        <div className="space-y-8">
          {/* Sales Section */}
          <div>
            <div className="font-bold text-sm mb-2 pb-1 border-b border-black uppercase">
              PENJUALAN ({trips.length} trip)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[320px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b text-left">Nopol</th>
                  <th className="p-2 border-b text-right">Harga</th>
                  <th className="p-2 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groupedTrips: { [key: string]: any[] } = {};
                  trips.forEach((trip: any) => {
                    const date = format(new Date(trip.transDate), "EEE, dd MMM yyyy", { locale });
                    if (!groupedTrips[date]) groupedTrips[date] = [];
                    groupedTrips[date].push(trip);
                  });

                  return Object.entries(groupedTrips).map(([date, items]) => {
                    const dailyTotal = items.reduce((sum, item) => sum + (item.appliedPrice || 0), 0);
                    return (
                      <React.Fragment key={date}>
                        <tr className="bg-gray-50/50">
                          <td colSpan={3} className="p-2 font-bold border-b">
                            <div className="flex flex-wrap justify-between items-center gap-2 text-emerald-700">
                              <span>{date}</span>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">
                                  Trip: {items.length}
                                </span>
                                <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">
                                  Total: {fmtMoney(dailyTotal)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {items.map((trip, idx) => (
                          <tr key={`${date}-${idx}`} className="border-b">
                            <td className="p-2 pl-4 font-mono">{trip.plateNumber}</td>
                            <td className="p-2 text-right font-mono">{fmtMoney(trip.appliedPrice)}</td>
                            <td className="p-2">{trip.paymentStatus === "PAID" ? "Lunas" : "Piutang"}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  });
                })()}
                {sales.totalDiscounts > 0 && (
                  <tr className="text-gray-600 italic border-b">
                    <td className="p-2 pl-4">Total Potongan/Diskon (Auto-populate)</td>
                    <td className="p-2 text-right font-mono">- {fmtMoney(sales.totalDiscounts)}</td>
                    <td></td>
                  </tr>
                )}
                <tr className="font-bold bg-gray-50">
                  <td className="p-2 border-t-2 border-black">TOTAL PENJUALAN (NET)</td>
                  <td className="p-2 text-right font-mono border-t-2 border-black">{fmtMoney(sales.netRevenue)}</td>
                  <td className="p-2 border-t-2 border-black"></td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>

          {/* Expenses Section */}
          {filteredExpenses.length > 0 && (
            <div>
              <div className="font-bold text-sm mb-2 pb-1 border-b border-black uppercase">
                PENGELUARAN
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[320px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border-b text-left">Kategori</th>
                    <th className="p-2 border-b text-right">Jumlah</th>
                    <th className="p-2 border-b text-left">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groupedExpenses: { [key: string]: any[] } = {};
                    filteredExpenses.forEach((exp: any) => {
                      const date = format(new Date(exp.expenseDate), "EEE, dd MMM yyyy", { locale });
                      if (!groupedExpenses[date]) groupedExpenses[date] = [];
                      groupedExpenses[date].push(exp);
                    });

                    return Object.entries(groupedExpenses).map(([date, items]) => {
                      const dailyTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
                      return (
                        <React.Fragment key={date}>
                          <tr className="bg-gray-50/50">
                            <td colSpan={3} className="p-2 font-bold border-b">
                              <div className="flex justify-between items-center text-blue-700">
                                <span>{date}</span>
                                <span className="font-mono text-[10px] bg-blue-100 px-2 py-0.5 rounded">
                                  Total: {fmtMoney(dailyTotal)}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {items.map((exp, idx) => (
                            <tr key={`${date}-${idx}`} className="border-b">
                              <td className="p-2 pl-4">{exp.categoryName || exp.category}</td>
                              <td className="p-2 text-right font-mono">{fmtMoney(exp.amount)}</td>
                              <td className="p-2 truncate max-w-[200px]">{exp.note || "-"}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    });
                  })()}
                  <tr className="font-bold bg-gray-50">
                    <td className="p-2 border-t-2 border-black">TOTAL PENGELUARAN</td>
                    <td className="p-2 text-right font-mono border-t-2 border-black">{fmtMoney(totalExpenseAmount)}</td>
                    <td className="p-2 border-t-2 border-black"></td>
                  </tr>
                </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Calculation */}
          <div className="mt-8 border-2 border-black p-6 bg-gray-50">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 border-r border-gray-300 pr-4">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Arus Kas Masuk (Sales)</div>
                  <div className="flex justify-between text-xs">
                    <span>Total Omzet (Applied)</span>
                    <span className="font-mono">{fmtMoney(sales.netRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Kas Diterima (Semua Metode)</span>
                    <span className="font-mono">{fmtMoney(paymentTotals.total)}</span>
                  </div>
                  {paymentBreakdown.map((entry) => (
                    <div key={entry.key} className="flex justify-between text-[10px] text-emerald-700 italic pl-2">
                      <span>• {entry.label}</span>
                      <span className="font-mono">{fmtMoney(entry.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-amber-600 font-medium border-t border-gray-200 pt-1">
                    <span>Piutang (Unpaid)</span>
                    <span className="font-mono">{fmtMoney(sales.receivables)}</span>
                  </div>
                </div>

                <div className="space-y-1 pl-4">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Arus Kas Keluar (Expenses)</div>
                  <div className="flex justify-between text-xs text-red-600">
                    <span>Beban Operasional</span>
                    <span className="font-mono">{fmtMoney(totalOperationalAmount)}</span>
                  </div>
                  {operationalBreakdown.map((entry: any) => (
                    <div key={`ops-${entry.name}`} className="flex justify-between text-[10px] text-rose-500 italic pl-2">
                      <span>• {entry.name}</span>
                      <span className="font-mono">{fmtMoney(entry.total)}</span>
                    </div>
                  ))}
                  {nonOperationalTotals.map((c: any) => (
                    <div key={`nonops-${c.name ?? c.categoryName}`} className="flex justify-between text-[10px] text-gray-500 italic pl-2">
                      <span>• {c.categoryName ?? c.name}</span>
                      <span className="font-mono">{fmtMoney(c.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-blue-600 border-t border-gray-200 pt-1 font-bold">
                    <span>Total Pengeluaran</span>
                    <span className="font-mono">{fmtMoney(totalExpenseAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black">
                <div className="flex justify-between text-lg font-bold">
                  <span>POSISI KAS TUNAI</span>
                  <span className={cn("font-mono", netCashOnly >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {fmtMoney(netCashOnly)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 italic">
                  * Dihitung dari: Kas Tunai - Total Semua Pengeluaran
                </div>
                <div className="mt-3 space-y-1 text-[10px] text-gray-600">
                  <div className="uppercase text-[9px] text-gray-400">Rincian Posisi Kas</div>
                  {paymentBreakdown.map((entry) => (
                    <div key={`net-${entry.key}`} className="flex justify-between">
                      <span>Kas masuk - {entry.label}</span>
                      <span className="font-mono">{fmtMoney(entry.total)}</span>
                    </div>
                  ))}
                  {nonCashTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Total kas non-tunai</span>
                      <span className="font-mono">{fmtMoney(nonCashTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total kas masuk</span>
                    <span className="font-mono">{fmtMoney(paymentTotals.total)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1">
                    <span>Total Pengeluaran</span>
                    <span className="font-mono">{fmtMoney(totalExpenseAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Net Kas Tunai</span>
                    <span className="font-mono">{fmtMoney(netCashOnly)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Net Kas Total</span>
                    <span className="font-mono">{fmtMoney(netCashAll)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-300 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-2 border rounded">
                  <div className="text-[10px] text-gray-400 uppercase">Margin Laba (Omzet - Ops)</div>
                  <div className="font-bold">{fmtMoney(sales.netRevenue - totalOperationalAmount)}</div>
                </div>
                <div className="bg-white p-2 border rounded">
                  <div className="text-[10px] text-gray-400 uppercase">Estimasi Laba Akhir</div>
                  <div className="font-bold">{fmtMoney(sales.netRevenue - totalExpenseAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
