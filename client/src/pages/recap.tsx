import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2">Memuat data rekapan...</span>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-500">
      <p>Gagal memuat data rekapan.</p>
      <pre className="mt-2 text-xs">{(error as Error).message}</pre>
      <Button className="mt-4" onClick={() => window.location.reload()}>Coba Lagi</Button>
    </div>
  );

  if (!report) return (
    <div className="p-8 text-center text-muted-foreground">
      Tidak ada data untuk periode ini.
    </div>
  );

  const { sales, expenses, trips, detailExpenses = [] } = report;
  const locationName = locationId === "all" ? "" : locations.find(l => l.id.toString() === locationId)?.name;

  return (
    <div className="p-4 md:p-6 space-y-6">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[130px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(d) => d && setDateRange(prev => ({ ...prev, from: startOfDay(d) }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[130px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(d) => d && setDateRange(prev => ({ ...prev, to: endOfDay(d) }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Cetak Rekapan
        </Button>
      </div>

      <Card id="recap-content" className="bg-white text-black p-8 max-w-4xl mx-auto shadow-lg print:shadow-none">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>LOGITRACK REKAPITULASI</h1>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Periode: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
            {locationName && ` | Lokasi: ${locationName}`}
          </div>
        </div>

        <div className="space-y-8">
          {/* Sales Section */}
          <div>
            <div className="font-bold text-sm mb-2 pb-1 border-b border-black uppercase">
              PENJUALAN ({trips.length} trip)
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b text-left">Tanggal</th>
                  <th className="p-2 border-b text-left">Nopol</th>
                  <th className="p-2 border-b text-right">Harga</th>
                  <th className="p-2 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{format(new Date(trip.transDate), "dd/MM/yyyy HH:mm")}</td>
                    <td className="p-2 font-mono">{trip.plateNumber}</td>
                    <td className="p-2 text-right font-mono">{fmtMoney(trip.appliedPrice)}</td>
                    <td className="p-2">{trip.paymentStatus === "PAID" ? "Lunas" : "Piutang"}</td>
                  </tr>
                ))}
                {sales.totalDiscounts > 0 && (
                  <tr className="text-gray-600 italic border-b">
                    <td colSpan={2} className="p-2">Total Potongan/Diskon (Auto-populate)</td>
                    <td className="p-2 text-right font-mono">- {fmtMoney(sales.totalDiscounts)}</td>
                    <td></td>
                  </tr>
                )}
                <tr className="font-bold bg-gray-50">
                  <td colSpan={2} className="p-2 border-t-2 border-black">TOTAL PENJUALAN (NET)</td>
                  <td className="p-2 text-right font-mono border-t-2 border-black">{fmtMoney(sales.netRevenue)}</td>
                  <td className="p-2 border-t-2 border-black"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expenses Section */}
          {detailExpenses.length > 0 && (
            <div>
              <div className="font-bold text-sm mb-2 pb-1 border-b border-black uppercase">
                PENGELUARAN OPERASIONAL
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border-b text-left">Tanggal</th>
                    <th className="p-2 border-b text-left">Kategori</th>
                    <th className="p-2 border-b text-right">Jumlah</th>
                    <th className="p-2 border-b text-left">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {detailExpenses
                    .filter((exp: any) => {
                      const cat = (exp.categoryName || exp.category || "").toUpperCase();
                      const note = (exp.note || "").toLowerCase();
                      return cat !== 'DISCOUNT' && !note.includes('auto discount');
                    })
                    .map((exp: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{format(new Date(exp.expenseDate), "dd/MM/yyyy")}</td>
                        <td className="p-2">{exp.categoryName || exp.category}</td>
                        <td className="p-2 text-right font-mono">{fmtMoney(exp.amount)}</td>
                        <td className="p-2 truncate max-w-[200px]">{exp.note || "-"}</td>
                      </tr>
                    ))}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={2} className="p-2 border-t-2 border-black">TOTAL PENGELUARAN OPERASIONAL</td>
                    <td className="p-2 text-right font-mono border-t-2 border-black">{fmtMoney(expenses.totalOperational)}</td>
                    <td className="p-2 border-t-2 border-black"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Calculation */}
          <div className="mt-8 border-2 border-black p-6 bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>TOTAL PENDAPATAN (NET)</span>
                <span className="font-mono">{fmtMoney(sales.netRevenue)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>TOTAL PENGELUARAN OPERASIONAL</span>
                <span className="font-mono">- {fmtMoney(expenses.totalOperational)}</span>
              </div>
              <div className="pt-4 border-t-2 border-black flex justify-between text-lg font-bold">
                <span>LABA BERSIH (PROFIT)</span>
                <span className="font-mono">{fmtMoney(sales.netRevenue - expenses.totalOperational)}</span>
              </div>
              <div className="pt-4 space-y-1 text-sm text-gray-600 border-t border-gray-300">
                <div className="flex justify-between">
                  <span>Total Piutang (Belum Tertagih)</span>
                  <span className="font-mono">{fmtMoney(sales.receivables)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kas Diterima (Setelah Pengeluaran)</span>
                  <span className="font-mono">{fmtMoney(sales.cashCollected - expenses.totalOperational)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
