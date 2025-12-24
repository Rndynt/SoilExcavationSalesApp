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
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(contentRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    if (!contentRef.current) return;
    const content = contentRef.current.innerHTML;
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      h2 { border-bottom: 2px solid #333; padding-bottom: 8px; margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #f5f5f5; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      td { padding: 8px; border-bottom: 1px solid #eee; }
      .summary { display: flex; justify-content: space-between; margin: 8px 0; }
      .summary-label { font-weight: bold; }
      .total-row { background: #f9f9f9; font-weight: bold; }
    </style></head><body>${content}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recap_${dateFrom}_to_${dateTo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dashboard.export")}</DialogTitle>
        </DialogHeader>

        <div ref={contentRef} className="space-y-8 text-sm p-6 bg-white text-black">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">{t("dashboard.recap")}</h1>
            <p className="text-muted-foreground">
              {format(new Date(dateFrom), "dd MMM yyyy")} - {format(new Date(dateTo), "dd MMM yyyy")}
            </p>
            {locationName && <p className="text-sm">{locationName}</p>}
          </div>

          {/* Ringkasan (Summary) */}
          <div>
            <h2 className="text-lg font-bold mb-4">{t("dashboard.summary")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="summary">
                <span className="summary-label">{t("dashboard.totaltrips")}:</span>
                <span>{sales.totalTrips}</span>
              </div>
              <div className="summary">
                <span className="summary-label">{t("dashboard.grossrevenue")}:</span>
                <span>{fmtMoney(sales.grossRevenue)}</span>
              </div>
              <div className="summary">
                <span className="summary-label">{t("dashboard.discountsgiven")}:</span>
                <span>{fmtMoney(sales.totalDiscounts)}</span>
              </div>
              <div className="summary">
                <span className="summary-label">{t("dashboard.netrevenue")}:</span>
                <span>{fmtMoney(sales.netRevenue)}</span>
              </div>
              <div className="summary">
                <span className="summary-label">{t("dashboard.cashcollected")}:</span>
                <span>{fmtMoney(sales.cashCollected)}</span>
              </div>
              <div className="summary">
                <span className="summary-label">{t("dashboard.receivables")}:</span>
                <span>{fmtMoney(sales.receivables)}</span>
              </div>
            </div>
          </div>

          {/* Detail Pemasukan (Sales Details) */}
          <div>
            <h2 className="text-lg font-bold mb-4">{t("dashboard.detailsales")}</h2>
            <table>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">{t("sales.date")}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">{t("sales.plate")}</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">{t("sales.applied")}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">{t("sales.note")}</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-3 py-2">{idx + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{format(new Date(trip.transDate), "dd MMM")}</td>
                    <td className="border border-gray-300 px-3 py-2 font-mono">{trip.plateNumber}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{fmtMoney(trip.appliedPrice)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">{trip.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right font-bold">
              {t("dashboard.total")}: {fmtMoney(sales.netRevenue)}
            </div>
          </div>

          {/* Pengeluaran (Expenses) */}
          {expenses.byCategory && expenses.byCategory.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">{t("dashboard.expenses")}</h2>
              <table>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">{t("expenses.category")}</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">{t("expenses.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.byCategory.map((exp, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 px-3 py-2">{exp.category}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-mono">{fmtMoney(exp.amount)}</td>
                    </tr>
                  ))}
                  <tr className="total-row bg-gray-100">
                    <td className="border border-gray-300 px-3 py-2">{t("dashboard.totalexpenses")}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{fmtMoney(expenses.totalExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Hasil Akhir (Final Results) */}
          <div>
            <h2 className="text-lg font-bold mb-4">{t("dashboard.finalresults")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">{t("dashboard.netrevenue")}:</span>
                <span className="font-mono font-bold">{fmtMoney(sales.netRevenue)}</span>
              </div>
              <div className="flex justify-between text-red-600 pb-2">
                <span className="font-semibold">{t("dashboard.operationalexpenses")}:</span>
                <span className="font-mono">({fmtMoney(expenses.totalOperational)})</span>
              </div>
              <div className="flex justify-between border-b-2 border-black pb-2 font-bold text-lg bg-green-50 p-2">
                <span>{t("dashboard.netprofit")}:</span>
                <span className="font-mono text-green-700">{fmtMoney(profit)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                <p className="mb-1">Catatan: Beban Operasional mencakup semua kategori operasional (Beban Operasional + Minyak)</p>
                <p>Total Pengeluaran = Beban Operasional + Kategori lainnya</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
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
