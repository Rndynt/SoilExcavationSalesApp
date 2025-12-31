import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import { format } from "date-fns";
import { useRef } from "react";

interface ExportRecapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateFrom: string;
  dateTo: string;
  sales: { totalTrips: number; grossRevenue: number; totalDiscounts: number; netRevenue: number; cashCollected: number; receivables: number };
  expenses: { totalExpenses: number; totalOperational: number; byCategory: Array<{ category: string; amount: number }> };
  detailExpenses: Array<{ expenseDate: string; categoryId?: string; category?: string; categoryName?: string; amount: number; note?: string }>;
  profit: number;
  cashBasisProfit: number;
  trips: Array<{ transDate: string; plateNumber: string; appliedPrice: number; note?: string; paymentStatus: string }>;
  locationName?: string;
}

export function ExportRecapModal({
  open,
  onOpenChange,
  dateFrom,
  dateTo,
  sales,
  expenses,
  detailExpenses,
  profit,
  cashBasisProfit,
  trips,
  locationName,
}: ExportRecapModalProps) {
  const t = useTranslate();
  const contentRef = useRef<HTMLDivElement>(null);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  const handlePrint = () => {
    if (!contentRef.current) return;
    const printWindow = window.open("", "PRINT", "width=800,height=600");
    if (!printWindow) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Rekapitulasi Harian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.3; padding: 15px; }
    h1 { font-size: 14px; margin-bottom: 5px; }
    .meta { font-size: 10px; color: #666; margin-bottom: 10px; }
    .sec-title { font-weight: bold; font-size: 11px; margin-top: 8px; margin-bottom: 4px; border-bottom: 1px solid #000; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    td, th { padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: left; }
    th { font-weight: bold; background: #f5f5f5; }
    .amount { text-align: right; font-family: monospace; }
    .total-row { font-weight: bold; background: #f5f5f5; }
    .summary { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
    .profit-box { margin-top: 8px; border: 1px solid #000; padding: 6px; }
    .profit-item { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 2px; }
  </style>
</head>
<body>
  ${contentRef.current?.innerHTML || ""}
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    if (!contentRef.current) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Rekapitulasi Harian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.3; padding: 15px; }
    h1 { font-size: 14px; margin-bottom: 5px; }
    .meta { font-size: 10px; color: #666; margin-bottom: 10px; }
    .sec-title { font-weight: bold; font-size: 11px; margin-top: 8px; margin-bottom: 4px; border-bottom: 1px solid #000; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    td, th { padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: left; }
    th { font-weight: bold; background: #f5f5f5; }
    .amount { text-align: right; font-family: monospace; }
    .total-row { font-weight: bold; background: #f5f5f5; }
    .summary { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
    .profit-box { margin-top: 8px; border: 1px solid #000; padding: 6px; }
    .profit-item { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 2px; }
  </style>
</head>
<body>
  ${contentRef.current?.innerHTML || ""}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_${format(new Date(dateFrom), "ddMMMyyy")}_sd_${format(new Date(dateTo), "ddMMMyyy")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-white p-4 border-b z-10">
          <DialogTitle className="text-lg">Laporan Rekapitulasi Harian</DialogTitle>
        </DialogHeader>

        <div ref={contentRef} style={{ fontSize: "11px", lineHeight: "1.3", fontFamily: "Arial, sans-serif", padding: "15px", color: "#000" }}>
          {/* Header */}
          <h1 style={{ fontSize: "14px", marginBottom: "5px", fontWeight: "bold" }}>Laporan Rekapitulasi Harian</h1>
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "10px" }}>
            <div>{format(new Date(dateFrom), "dd MMMM yyyy")} s.d. {format(new Date(dateTo), "dd MMMM yyyy")}</div>
            {locationName && <div>{locationName}</div>}
          </div>

          {/* Summary Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px", fontSize: "10px" }}>
            <div style={{ padding: "6px", border: "1px solid #ddd" }}>
              <div style={{ fontWeight: "bold" }}>Trip: {sales.totalTrips}</div>
              <div>Kotor: {fmtMoney(sales.grossRevenue)}</div>
              <div>Diskon: ({fmtMoney(sales.totalDiscounts)})</div>
              <div style={{ fontWeight: "bold" }}>Bersih: {fmtMoney(sales.netRevenue)}</div>
            </div>
            <div style={{ padding: "6px", border: "1px solid #ddd" }}>
              <div style={{ fontWeight: "bold" }}>Kas: {fmtMoney(sales.cashCollected)}</div>
              <div>Piutang: {fmtMoney(sales.receivables)}</div>
              <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #ddd" }}>
                <div>Pengeluaran: {fmtMoney(expenses.totalExpenses)}</div>
              </div>
            </div>
            <div style={{ padding: "6px", border: "1px solid #000", fontWeight: "bold" }}>
              <div style={{ marginBottom: "4px" }}>Laba (Akrual):</div>
              <div style={{ fontSize: "12px" }}>{fmtMoney(profit)}</div>
              <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #000", fontSize: "10px", fontWeight: "normal" }}>
                Laba (Kas): {fmtMoney(cashBasisProfit)}
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px", borderBottom: "1px solid #000" }}>PENJUALAN ({trips.length} trips)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "6px" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Tgl</th>
                  <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Plat</th>
                  <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold", textAlign: "right" }}>Tarif</th>
                  <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontSize: "9px" }}>
                      {format(new Date(trip.transDate), "dd/MM")}
                    </td>
                    <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontFamily: "monospace", fontSize: "9px" }}>
                      {trip.plateNumber}
                    </td>
                    <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", textAlign: "right", fontFamily: "monospace", fontSize: "9px" }}>
                      {fmtMoney(trip.appliedPrice)}
                    </td>
                    <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontSize: "9px" }}>
                      {trip.note ? trip.note.substring(0, 20) : "-"}
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                  <td colSpan={3} style={{ padding: "3px 4px", borderBottom: "1px solid #000" }}>TOTAL PENJUALAN</td>
                  <td style={{ padding: "3px 4px", borderBottom: "1px solid #000", textAlign: "right", fontFamily: "monospace" }}>
                    {fmtMoney(sales.netRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expenses Detail Table */}
          {detailExpenses && detailExpenses.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px", borderBottom: "1px solid #000" }}>
                PENGELUARAN DETAIL ({detailExpenses.length} entry)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "6px" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Tgl</th>
                    <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Kategori</th>
                    <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold", textAlign: "right" }}>Jumlah</th>
                    <th style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {detailExpenses.map((exp, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontSize: "9px" }}>
                        {format(new Date(exp.expenseDate), "dd/MM")}
                      </td>
                      <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontSize: "9px" }}>
                        {exp.categoryName || exp.category}
                      </td>
                      <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", textAlign: "right", fontFamily: "monospace", fontSize: "9px" }}>
                        {fmtMoney(exp.amount)}
                      </td>
                      <td style={{ padding: "3px 4px", borderBottom: "1px solid #ddd", fontSize: "9px" }}>
                        {exp.note ? exp.note.substring(0, 20) : "-"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                    <td colSpan={3} style={{ padding: "3px 4px", borderBottom: "1px solid #000" }}>TOTAL PENGELUARAN</td>
                    <td style={{ padding: "3px 4px", borderBottom: "1px solid #000", textAlign: "right", fontFamily: "monospace" }}>
                      {fmtMoney(expenses.totalExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Calc */}
          <div style={{ marginTop: "8px", border: "1px solid #000", padding: "8px" }}>
            <table style={{ width: "100%", fontSize: "10px" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 0" }}>Penjualan Netto</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: "bold" }}>
                    {fmtMoney(sales.netRevenue)}
                  </td>
                </tr>
                <tr style={{ borderTop: "1px solid #ddd" }}>
                  <td style={{ padding: "2px 0" }}>Pengeluaran</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#c00" }}>
                    ({fmtMoney(expenses.totalExpenses)})
                  </td>
                </tr>
                <tr style={{ fontWeight: "bold", fontSize: "11px", borderTop: "2px solid #000", paddingTop: "4px" }}>
                  <td style={{ padding: "4px 0" }}>LABA BERSIH (AKRUAL)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", padding: "4px 0" }}>
                    {fmtMoney(profit)}
                  </td>
                </tr>
                <tr style={{ fontSize: "9px", borderTop: "1px solid #ddd" }}>
                  <td style={{ padding: "2px 0", color: "#666" }}>Kas Terkumpul</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#666" }}>
                    {fmtMoney(sales.cashCollected)}
                  </td>
                </tr>
                <tr style={{ fontSize: "9px", fontWeight: "bold" }}>
                  <td style={{ padding: "2px 0" }}>LABA BERSIH (KAS)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                    {fmtMoney(cashBasisProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: "12px", borderTop: "1px solid #e0e0e0", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-3 h-3 mr-1" />
            HTML
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-3 h-3 mr-1" />
            Cetak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
