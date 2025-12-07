import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export default function Dashboard() {
  const { trips, expenses } = useStore();

  const grossRevenue = trips.reduce((sum, t) => sum + t.basePrice, 0);
  
  const discountExpenses = expenses.filter(e => {
    const category = useStore.getState().categories.find(c => c.id === e.categoryId);
    return category?.type === 'DISCOUNT';
  });
  const totalDiscounts = discountExpenses.reduce((sum, e) => sum + e.amount, 0);

  const operationalExpenses = expenses.filter(e => {
    const category = useStore.getState().categories.find(c => c.id === e.categoryId);
    return category?.type !== 'DISCOUNT';
  });
  const totalOpsExpenses = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Revenue = Gross - Discounts (should equal sum(appliedPrice))
  const netRevenue = grossRevenue - totalDiscounts;
  const profit = netRevenue - totalOpsExpenses;

  // Formatter
  const fmtMoney = (n: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Financial overview for the current period</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">{fmtMoney(grossRevenue)}</div>
            <p className="text-xs text-slate-500 mt-1">Sum of Base Prices</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Discounts Given</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">{fmtMoney(totalDiscounts)}</div>
            <p className="text-xs text-slate-500 mt-1">Price Adjustments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Net Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 font-mono">{fmtMoney(netRevenue)}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Gross - Discounts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">{fmtMoney(profit)}</div>
            <p className="text-xs text-slate-500 mt-1">After Ops Expenses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
