import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Receipt, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Expenses() {
  const { expenses, categories } = useStore();

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getCategoryType = (id: string) => categories.find(c => c.id === id)?.type || 'OPERATIONAL';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h2>
        <p className="text-slate-500 mt-1">Operational costs and price adjustments.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Description / Note</th>
                <th className="px-6 py-3 font-medium">Related Plate</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-200" />
                      <p>No expenses recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const type = getCategoryType(expense.categoryId);
                  const isDiscount = type === 'DISCOUNT';

                  return (
                    <tr key={expense.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] font-normal",
                              isDiscount 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {type}
                          </Badge>
                          <span className="font-medium text-slate-700">{getCategoryName(expense.categoryId)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {expense.note || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {expense.relatedPlateNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expense.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
