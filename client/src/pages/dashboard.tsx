import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { trips, expenses, categories } = useStore();

  const grossRevenue = trips.reduce((sum, t) => sum + t.basePrice, 0);
  
  const discountExpenses = expenses.filter(e => {
    const category = categories.find(c => c.id === e.categoryId);
    return category?.type === 'DISCOUNT';
  });
  const totalDiscounts = discountExpenses.reduce((sum, e) => sum + e.amount, 0);

  const operationalExpenses = expenses.filter(e => {
    const category = categories.find(c => c.id === e.categoryId);
    return category?.type === 'OPERATIONAL';
  });
  const totalOpsExpenses = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Revenue = Gross - Discounts (should equal sum(appliedPrice))
  const netRevenue = grossRevenue - totalDiscounts;
  const profit = netRevenue - totalOpsExpenses;

  // Debt/Loan Tracking
  const debtExpenses = expenses.filter(e => {
    const category = categories.find(c => c.id === e.categoryId);
    return category?.type === 'DEBT' && e.status === 'UNPAID';
  });
  const totalUnpaidDebt = debtExpenses.reduce((sum, e) => sum + e.amount, 0);

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
            <p className="text-xs text-slate-500 mt-1">Total Base Price Value</p>
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
            <p className="text-xs text-emerald-600/80 mt-1">Realized Income</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Net Profit</CardTitle>
            {profit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold font-mono", profit >= 0 ? "text-slate-900" : "text-red-600")}>
               {fmtMoney(profit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Revenue - Operational Exp.</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
         <Card className="shadow-sm">
           <CardHeader>
             <CardTitle>Operational Expenses</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-center justify-between">
               <div>
                  <div className="text-3xl font-bold font-mono text-slate-900">{fmtMoney(totalOpsExpenses)}</div>
                  <p className="text-sm text-slate-500 mt-1">Total spending this period</p>
               </div>
               <div className="p-3 bg-red-50 rounded-full">
                 <ArrowUpRight className="w-6 h-6 text-red-500" />
               </div>
             </div>
           </CardContent>
         </Card>

         <Card className="shadow-sm">
           <CardHeader>
             <CardTitle>Outstanding Driver Debt</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-center justify-between">
               <div>
                  <div className="text-3xl font-bold font-mono text-slate-900">{fmtMoney(totalUnpaidDebt)}</div>
                  <p className="text-sm text-slate-500 mt-1">Unpaid loans to drivers</p>
               </div>
               <div className="p-3 bg-purple-50 rounded-full">
                 <ArrowDownRight className="w-6 h-6 text-purple-500" />
               </div>
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
