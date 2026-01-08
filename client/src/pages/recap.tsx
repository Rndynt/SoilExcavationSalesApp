import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Calendar as CalendarIcon, Loader2, AlertCircle, Download } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
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

  const handlePrint = () => {
    const printContent = document.getElementById("recap-content");
    if (!printContent) return;
    const printWindow = window.open("", "PRINT", "width=800,height=600");
    if (!printWindow) {
      window.print();
      return;
    }
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Rekapitulasi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.3; padding: 15px; }
    h1 { font-size: 14px; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    td, th { padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: left; }
    th { font-weight: bold; background: #f5f5f5; }
    .amount { text-align: right; font-family: monospace; }
    .total-row { font-weight: bold; background: #f5f5f5; }
  </style>
</head>
<body>
  ${printContent.innerHTML}
</body>
</html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    const handlePrintReady = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
    printWindow.addEventListener("load", handlePrintReady, { once: true });
    setTimeout(handlePrintReady, 500);
  };

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

  const handleExportPdf = async () => {
    if (isExporting || !report) return;
    setIsExporting(true);
    try {
      const recapContent = document.getElementById("recap-content");
      if (!recapContent) throw new Error("Konten rekap tidak ditemukan.");

      const canvas = await html2canvas(recapContent, {
        backgroundColor: "#ffffff",
        scale: 1, // Minimum scale for maximum reliability
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 30000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("recap-content");
          if (!el) return;

          // Strip ALL styles that might break the renderer
          const all = el.getElementsByTagName("*");
          el.style.cssText = "background: #fff !important; color: #000 !important; padding: 20px !important; width: 800px !important;";
          
          for (let i = 0; i < all.length; i++) {
            const item = all[i] as HTMLElement;
            item.style.setProperty('color', '#000', 'important');
            item.style.setProperty('background', 'transparent', 'important');
            item.style.setProperty('box-shadow', 'none', 'important');
            item.style.setProperty('filter', 'none', 'important');
            item.style.setProperty('backdrop-filter', 'none', 'important');
            item.style.setProperty('transform', 'none', 'important');
            
            if (['TABLE', 'TH', 'TD', 'TR'].includes(item.tagName)) {
              item.style.setProperty('border', '1px solid #000', 'important');
            }
          }
        }
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png"); // PNG for better transparency handling
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`rekap-${fromDate}-${toDate}.pdf`);
    } catch (err) {
      console.error(err);
      window.alert("Gagal ekspor. Gunakan tombol 'Cetak' lalu pilih 'Simpan sebagai PDF' sebagai alternatif.");
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
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Rekapan
          </Button>
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
                    const date = format(new Date(trip.transDate), "dd/MM/yyyy");
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
                      const date = format(new Date(exp.expenseDate), "dd/MM/yyyy");
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
                    <span>Kas Diterima (Paid)</span>
                    <span className="font-mono">{fmtMoney(sales.cashCollected)}</span>
                  </div>
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
                  <span>POSISI KAS (Net Cash)</span>
                  <span className={cn("font-mono", (sales.cashCollected - totalExpenseAmount) >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {fmtMoney(sales.cashCollected - totalExpenseAmount)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 italic">
                  * Dihitung dari: Total Kas Diterima - Total Semua Pengeluaran
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
