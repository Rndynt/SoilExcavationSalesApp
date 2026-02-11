import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfDay, 
  endOfDay,
  addMonths,
  subMonths
} from "date-fns";
import { id, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export default function PnLCalendarPage() {
  const t = useTranslate();
  const { language } = useLanguage();
  const locale = language === "id" ? id : enUS;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: reportData, isLoading, error } = useQuery<any>({
    queryKey: ["/api/reports/dashboard", { 
      from: format(monthStart, "yyyy-MM-dd"), 
      to: format(monthEnd, "yyyy-MM-dd") 
    }],
    queryFn: async ({ queryKey }) => {
      const [_path, params] = queryKey as [string, any];
      const res = await fetch(`${_path}?from=${params.from}&to=${params.to}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    }
  });

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("id-ID", { 
      maximumFractionDigits: 0,
      signDisplay: "always"
    }).format(n || 0);

  const getDayPnL = (day: Date) => {
    if (!reportData?.trips) return 0;
    
    const dayStr = format(day, "yyyy-MM-dd");
    const dayTrips = reportData.trips.filter((t: any) => t.transDate === dayStr);
    const dayExpenses = reportData.detailExpenses?.filter((e: any) => e.expenseDate === dayStr) || [];

    const revenue = dayTrips.reduce((sum: number, t: any) => sum + (t.appliedPrice || 0), 0);
    const expenses = dayExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    
    return revenue - expenses;
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PnL Calendar</h1>
          <p className="text-muted-foreground">Estimasi laba bersih harian.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">
            {format(currentMonth, "MMMM yyyy", { locale })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-12 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p>Gagal memuat data</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-muted border rounded-lg overflow-hidden">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="bg-background p-2 text-center text-xs font-medium text-muted-foreground border-b">
                  {d}
                </div>
              ))}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-background/50 p-2 min-h-[80px]" />
              ))}
              {days.map((day) => {
                const pnl = getDayPnL(day);
                const hasData = reportData?.trips?.some((t: any) => t.transDate === format(day, "yyyy-MM-dd"));
                
                return (
                  <div key={day.toString()} className="bg-background p-2 min-h-[80px] border-r border-b last:border-r-0 flex flex-col justify-between">
                    <span className="text-xs font-medium">{format(day, "d")}</span>
                    {hasData && (
                      <div className={cn(
                        "text-[10px] font-mono font-bold text-center py-1 rounded",
                        pnl > 0 ? "text-green-600 bg-green-50" : pnl < 0 ? "text-red-600 bg-red-50" : "text-muted-foreground bg-muted"
                      )}>
                        {fmtMoney(pnl)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
