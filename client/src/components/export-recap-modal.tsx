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
    const printWindow = window.open("", "PRINT", "width=900,height=800");
    if (!printWindow) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Laporan Rekapitulasi Harian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; }
    body { padding: 40px; background: white; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .print-page-break { page-break-after: always; }
    }
    
    /* Header */
    .header { margin-bottom: 30px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; }
    .header h1 { font-size: 24px; font-weight: 700; color: #2c3e50; margin-bottom: 5px; }
    .header .meta { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-top: 10px; }
    .header .location { font-weight: 600; color: #333; }
    
    /* Section */
    .section { margin-bottom: 35px; }
    .section-title { 
      font-size: 14px; 
      font-weight: 700; 
      color: white; 
      background: #34495e; 
      padding: 10px 15px; 
      margin-bottom: 15px;
      border-radius: 4px;
    }
    
    /* Summary Grid */
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .summary-card { 
      background: #f8f9fa; 
      border: 1px solid #e0e0e0;
      padding: 15px; 
      border-radius: 4px;
    }
    .summary-card .label { font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; }
    .summary-card .value { font-size: 18px; font-weight: 700; color: #2c3e50; font-family: 'Courier New', monospace; }
    
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th { 
      background: #ecf0f1; 
      padding: 12px 10px; 
      text-align: left; 
      font-size: 12px; 
      font-weight: 700;
      color: #2c3e50;
      border-bottom: 2px solid #34495e;
    }
    td { 
      padding: 10px; 
      font-size: 12px; 
      border-bottom: 1px solid #ecf0f1;
    }
    tr:hover { background: #f8f9fa; }
    .text-right { text-align: right; }
    .text-mono { font-family: 'Courier New', monospace; font-weight: 600; }
    .total-row { background: #ecf0f1; font-weight: 700; }
    .total-row td { border-bottom: 2px solid #34495e; }
    
    /* Results Section */
    .results-box {
      background: #f8f9fa;
      border-left: 4px solid #27ae60;
      padding: 20px;
      border-radius: 4px;
      margin-top: 15px;
    }
    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px;
    }
    .result-item:last-child { border-bottom: none; }
    .result-item .label { font-weight: 600; color: #2c3e50; }
    .result-item .value { font-family: 'Courier New', monospace; font-weight: 700; }
    
    .profit-highlight {
      display: flex;
      justify-content: space-between;
      padding: 15px;
      background: #27ae60;
      color: white;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
      margin-top: 15px;
    }
    .profit-highlight .value { font-family: 'Courier New', monospace; }
    
    /* Footer */
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    
    /* Page Break */
    @media print {
      .section { page-break-inside: avoid; }
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      body { padding: 20px; }
      .summary-grid { grid-template-columns: 1fr; }
      .header { margin-bottom: 20px; padding-bottom: 15px; }
    }
  </style>
</head>
<body>
  ${contentRef.current?.innerHTML || ""}
  <div class="footer">
    <p>Laporan ini dihasilkan secara otomatis oleh LogiTrack • ${new Date().toLocaleString('id-ID')}</p>
  </div>
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Laporan Rekapitulasi Harian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; }
    body { padding: 40px; background: white; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .print-page-break { page-break-after: always; }
    }
    
    /* Header */
    .header { margin-bottom: 30px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; }
    .header h1 { font-size: 24px; font-weight: 700; color: #2c3e50; margin-bottom: 5px; }
    .header .meta { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-top: 10px; }
    .header .location { font-weight: 600; color: #333; }
    
    /* Section */
    .section { margin-bottom: 35px; }
    .section-title { 
      font-size: 14px; 
      font-weight: 700; 
      color: white; 
      background: #34495e; 
      padding: 10px 15px; 
      margin-bottom: 15px;
      border-radius: 4px;
    }
    
    /* Summary Grid */
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .summary-card { 
      background: #f8f9fa; 
      border: 1px solid #e0e0e0;
      padding: 15px; 
      border-radius: 4px;
    }
    .summary-card .label { font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; }
    .summary-card .value { font-size: 18px; font-weight: 700; color: #2c3e50; font-family: 'Courier New', monospace; }
    
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th { 
      background: #ecf0f1; 
      padding: 12px 10px; 
      text-align: left; 
      font-size: 12px; 
      font-weight: 700;
      color: #2c3e50;
      border-bottom: 2px solid #34495e;
    }
    td { 
      padding: 10px; 
      font-size: 12px; 
      border-bottom: 1px solid #ecf0f1;
    }
    tr:hover { background: #f8f9fa; }
    .text-right { text-align: right; }
    .text-mono { font-family: 'Courier New', monospace; font-weight: 600; }
    .total-row { background: #ecf0f1; font-weight: 700; }
    .total-row td { border-bottom: 2px solid #34495e; }
    
    /* Results Section */
    .results-box {
      background: #f8f9fa;
      border-left: 4px solid #27ae60;
      padding: 20px;
      border-radius: 4px;
      margin-top: 15px;
    }
    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px;
    }
    .result-item:last-child { border-bottom: none; }
    .result-item .label { font-weight: 600; color: #2c3e50; }
    .result-item .value { font-family: 'Courier New', monospace; font-weight: 700; }
    
    .profit-highlight {
      display: flex;
      justify-content: space-between;
      padding: 15px;
      background: #27ae60;
      color: white;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
      margin-top: 15px;
    }
    .profit-highlight .value { font-family: 'Courier New', monospace; }
    
    /* Footer */
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    
    /* Page Break */
    @media print {
      .section { page-break-inside: avoid; }
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      body { padding: 20px; }
      .summary-grid { grid-template-columns: 1fr; }
      .header { margin-bottom: 20px; padding-bottom: 15px; }
    }
  </style>
</head>
<body>
  ${contentRef.current?.innerHTML || ""}
  <div class="footer">
    <p>Laporan ini dihasilkan secara otomatis oleh LogiTrack • ${new Date().toLocaleString('id-ID')}</p>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Rekapitulasi_${format(new Date(dateFrom), "dd-MMM-yyyy")}_s.d_${format(new Date(dateTo), "dd-MMM-yyyy")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nonOperationalExpenses = expenses.totalExpenses - expenses.totalOperational;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">{t("dashboard.export")} - {t("dashboard.recap")}</DialogTitle>
        </DialogHeader>

        <div ref={contentRef} style={{ padding: "40px", background: "white", color: "#1a1a1a", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          {/* Header */}
          <div style={{ marginBottom: "30px", borderBottom: "3px solid #2c3e50", paddingBottom: "20px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#2c3e50", marginBottom: "5px" }}>
              {t("dashboard.recap")}
            </h1>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#666", marginTop: "10px" }}>
              <div>
                <strong>Periode:</strong> {format(new Date(dateFrom), "dd MMMM yyyy")} {" - "} {format(new Date(dateTo), "dd MMMM yyyy")}
              </div>
              {locationName && <div style={{ fontWeight: "600", color: "#333" }}>{locationName}</div>}
            </div>
          </div>

          {/* Summary Section */}
          <div style={{ marginBottom: "35px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "white", background: "#34495e", padding: "10px 15px", marginBottom: "15px", borderRadius: "4px" }}>
              {t("dashboard.summary")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "4px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" }}>
                  {t("dashboard.totaltrips")}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", fontFamily: "'Courier New', monospace" }}>
                  {sales.totalTrips}
                </div>
              </div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "4px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" }}>
                  {t("dashboard.grossrevenue")}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", fontFamily: "'Courier New', monospace" }}>
                  {fmtMoney(sales.grossRevenue)}
                </div>
              </div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "4px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" }}>
                  {t("dashboard.discountsgiven")}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", fontFamily: "'Courier New', monospace" }}>
                  {fmtMoney(sales.totalDiscounts)}
                </div>
              </div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "4px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" }}>
                  {t("dashboard.netrevenue")}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#27ae60", fontFamily: "'Courier New', monospace" }}>
                  {fmtMoney(sales.netRevenue)}
                </div>
              </div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "4px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" }}>
                  {t("dashboard.cashcollected")}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", fontFamily: "'Courier New', monospace" }}>
                  {fmtMoney(sales.cashCollected)}
                </div>
              </div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "4px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" }}>
                  {t("dashboard.receivables")}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#e67e22", fontFamily: "'Courier New', monospace" }}>
                  {fmtMoney(sales.receivables)}
                </div>
              </div>
            </div>
          </div>

          {/* Sales Details */}
          <div style={{ marginBottom: "35px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "white", background: "#34495e", padding: "10px 15px", marginBottom: "15px", borderRadius: "4px" }}>
              {t("dashboard.detailsales")}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#ecf0f1" }}>
                    <th style={{ padding: "12px 10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>No</th>
                    <th style={{ padding: "12px 10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>Tgl</th>
                    <th style={{ padding: "12px 10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>Plat</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>Tarif</th>
                    <th style={{ padding: "12px 10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #ecf0f1" }}>
                      <td style={{ padding: "10px", fontSize: "12px" }}>{idx + 1}</td>
                      <td style={{ padding: "10px", fontSize: "12px" }}>{format(new Date(trip.transDate), "dd MMM")}</td>
                      <td style={{ padding: "10px", fontSize: "12px", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                        {trip.plateNumber}
                      </td>
                      <td style={{ padding: "10px", fontSize: "12px", textAlign: "right", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                        {fmtMoney(trip.appliedPrice)}
                      </td>
                      <td style={{ padding: "10px", fontSize: "12px", color: "#666" }}>{trip.note || "-"}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#ecf0f1", fontWeight: "700" }}>
                    <td colSpan={4} style={{ padding: "10px", fontSize: "12px", textAlign: "right" }}>
                      Total Penjualan:
                    </td>
                    <td style={{ padding: "10px", fontSize: "12px", fontFamily: "'Courier New', monospace", fontWeight: "700", color: "#27ae60" }}>
                      {fmtMoney(sales.netRevenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses Details */}
          {expenses.byCategory && expenses.byCategory.length > 0 && (
            <div style={{ marginBottom: "35px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "white", background: "#34495e", padding: "10px 15px", marginBottom: "15px", borderRadius: "4px" }}>
                {t("dashboard.expenses")} - {t("dashboard.byCategory")}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#ecf0f1" }}>
                      <th style={{ padding: "12px 10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>
                        {t("expenses.category")}
                      </th>
                      <th style={{ padding: "12px 10px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "2px solid #34495e" }}>
                        {t("expenses.amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.byCategory.map((exp, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #ecf0f1" }}>
                        <td style={{ padding: "10px", fontSize: "12px" }}>{exp.category}</td>
                        <td style={{ padding: "10px", fontSize: "12px", textAlign: "right", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                          {fmtMoney(exp.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "#ecf0f1", fontWeight: "700" }}>
                      <td style={{ padding: "10px", fontSize: "12px" }}>Total Pengeluaran</td>
                      <td style={{ padding: "10px", fontSize: "12px", textAlign: "right", fontFamily: "'Courier New', monospace", fontWeight: "700", borderBottom: "2px solid #34495e" }}>
                        {fmtMoney(expenses.totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Final Results */}
          <div style={{ marginBottom: "35px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "white", background: "#34495e", padding: "10px 15px", marginBottom: "15px", borderRadius: "4px" }}>
              {t("dashboard.finalresults")}
            </div>
            <div style={{ background: "#f8f9fa", borderLeft: "4px solid #27ae60", padding: "20px", borderRadius: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e0e0e0", fontSize: "13px" }}>
                <div style={{ fontWeight: "600", color: "#2c3e50" }}>{t("dashboard.netrevenue")}</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontWeight: "700", color: "#27ae60" }}>
                  {fmtMoney(sales.netRevenue)}
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e0e0e0", fontSize: "13px" }}>
                <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                  {t("dashboard.operationalexpenses")} (Beban Rutin)
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontWeight: "700", color: "#e74c3c" }}>
                  ({fmtMoney(expenses.totalOperational)})
                </div>
              </div>

              {nonOperationalExpenses > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e0e0e0", fontSize: "13px" }}>
                  <div style={{ fontWeight: "600", color: "#2c3e50" }}>Pengeluaran Lainnya</div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontWeight: "700", color: "#e74c3c" }}>
                    ({fmtMoney(nonOperationalExpenses)})
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e0e0e0", fontSize: "13px" }}>
                <div style={{ fontWeight: "600", color: "#2c3e50" }}>Total Pengeluaran</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontWeight: "700", color: "#e74c3c" }}>
                  ({fmtMoney(expenses.totalExpenses)})
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "15px", background: "#27ae60", color: "white", borderRadius: "4px", fontSize: "16px", fontWeight: "700", marginTop: "15px" }}>
                <span>Laba Bersih (Akrual)</span>
                <span style={{ fontFamily: "'Courier New', monospace" }}>{fmtMoney(profit)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "15px", background: "#3498db", color: "white", borderRadius: "4px", fontSize: "16px", fontWeight: "700", marginTop: "10px" }}>
                <span>Laba Bersih (Kas)</span>
                <span style={{ fontFamily: "'Courier New', monospace" }}>{fmtMoney(cashBasisProfit)}</span>
              </div>

              <div style={{ fontSize: "11px", color: "#999", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #e0e0e0" }}>
                <p style={{ marginBottom: "5px" }}>
                  <strong>Catatan:</strong> Laporan ini menampilkan data penjualan vs pengeluaran
                </p>
                <p>
                  • Laba Akrual: Selisih antara Penjualan Netto dan Total Pengeluaran<br />
                  • Laba Kas: Selisih antara Kas Terkumpul dan Total Pengeluaran
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px", borderTop: "1px solid #e0e0e0", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("sales.cancel")}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            {t("dashboard.downloadhtml")}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t("dashboard.print")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
