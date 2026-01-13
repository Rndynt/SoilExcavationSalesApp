import { useLocations, useSaleTrips } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Search, Loader2, ChevronDown, ChevronUp, MapPin, Calendar, Filter } from "lucide-react";
import React, { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type TimePeriod = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM";

const getDateRange = (period: TimePeriod): [string | undefined, string | undefined] => {
  if (period === "ALL") return [undefined, undefined];
  
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case "TODAY":
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case "YESTERDAY":
      const yesterday = subDays(now, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case "THIS_WEEK":
      start = startOfWeek(now, { weekStartsOn: 0 });
      end = endOfWeek(now, { weekStartsOn: 0 });
      break;
    case "THIS_MONTH":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "LAST_MONTH":
      const lastMonth = subDays(now, 30);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    default:
      return [undefined, undefined];
  }

  return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')];
};

export default function SalesHistory() {
  const [filterPlate, setFilterPlate] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [period, setPeriod] = useState<TimePeriod>("THIS_MONTH");
  const [dateRange, setDateRange] = useState<{ from: string | undefined; to: string | undefined }>(() => {
    const [start, end] = getDateRange("THIS_MONTH");
    return { from: start, to: end };
  });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: trips = [], isLoading: tripsLoading } = useSaleTrips({
    locationId: filterLocation !== "all" ? filterLocation : undefined,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    plateNumber: filterPlate || undefined,
    paymentStatus: filterPaymentStatus !== "all" ? filterPaymentStatus : undefined,
  });

  const isLoading = locationsLoading || tripsLoading;

  const handlePeriodChange = (val: TimePeriod) => {
    setPeriod(val);
    if (val !== "CUSTOM") {
      const [start, end] = getDateRange(val);
      setDateRange({ from: start, to: end });
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
          <p className="text-muted-foreground mt-1">Review past transactions.</p>
        </div>
      </div>

      <Card className="border-border shadow-sm bg-accent/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
            <div className="w-full md:w-48 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Search className="h-3 w-3" />
                Search Plate
              </span>
              <Input 
                data-testid="input-search-plate"
                placeholder="Search..." 
                value={filterPlate}
                onChange={e => setFilterPlate(e.target.value)}
                className="h-9"
              />
            </div>
            
            <div className="w-full md:w-48 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Location
              </span>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger data-testid="select-location-trigger" className="h-9">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-location-all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id} data-testid={`select-location-${loc.id}`}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Payment Status
              </span>
              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger data-testid="select-payment-status-trigger" className="h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-payment-all">All Status</SelectItem>
                  <SelectItem value="PAID" data-testid="select-payment-paid">Paid</SelectItem>
                  <SelectItem value="PARTIAL" data-testid="select-payment-partial">Partial</SelectItem>
                  <SelectItem value="UNPAID" data-testid="select-payment-unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed flex flex-col md:flex-row gap-4 items-end flex-wrap">
            <div className="w-full md:w-48 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Time Period
              </span>
              <Select value={period} onValueChange={(val) => handlePeriodChange(val as TimePeriod)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                  <SelectItem value="THIS_WEEK">This Week</SelectItem>
                  <SelectItem value="THIS_MONTH">This Month</SelectItem>
                  <SelectItem value="LAST_MONTH">Last Month</SelectItem>
                  <SelectItem value="CUSTOM">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "CUSTOM" && (
              <>
                <div className="w-full md:w-40 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</span>
                  <Input 
                    type="date"
                    value={dateRange.from || ""}
                    onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="w-full md:w-40 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</span>
                  <Input 
                    type="date"
                    value={dateRange.to || ""}
                    onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </>
            )}

            <div className="w-full md:w-auto text-right text-sm text-muted-foreground pb-2 md:ml-auto">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                <span data-testid="text-record-count">Showing {trips.length} records</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-0 table-fixed">
            <thead className="bg-muted text-muted-foreground border-b sticky top-0 z-40">
              <tr>
                <th className="w-32 px-4 py-3 sticky left-0 bg-muted font-medium z-50 border-r border-b">Plate</th>
                <th className="w-32 px-4 py-3 font-medium text-right border-b">Base Price</th>
                <th className="w-32 px-4 py-3 font-medium text-right border-b">Applied Price</th>
                <th className="w-24 px-4 py-3 font-medium text-center border-b">Status</th>
                <th className="w-32 px-4 py-3 font-medium text-right border-b">Outstanding</th>
                <th className="w-24 px-4 py-3 font-medium text-right border-b">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4 sticky left-0 bg-card z-10"></td>
                    <td className="sticky left-0 bg-card px-4 py-4 border-r z-10"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No trips found matching filters.
                  </td>
                </tr>
              ) : (
                (() => {
                  const grouped: { [key: string]: { [key: string]: typeof trips } } = {};
                  trips.forEach(trip => {
                    const locationName = locations.find(l => l.id === trip.locationId)?.name || 'Unknown';
                    const dateKey = format(new Date(trip.transDate), "EEEE, dd MMM yyyy");
                    if (!grouped[locationName]) grouped[locationName] = {};
                    if (!grouped[locationName][dateKey]) grouped[locationName][dateKey] = [];
                    grouped[locationName][dateKey].push(trip);
                  });

                  return Object.entries(grouped).map(([location, dates]) => (
                    <React.Fragment key={location}>
                      <tr className="bg-primary/5 sticky top-[41px] z-30 pointer-events-none">
                        <td colSpan={6} className="p-0">
                          <div className="flex items-center gap-2 px-6 py-3 bg-primary/5 border-y border-primary/20 backdrop-blur-sm sticky left-0 w-[calc(100vw-2rem)] md:w-full pointer-events-auto">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-sm uppercase tracking-widest text-primary whitespace-nowrap">{location}</h3>
                            <div className="h-px flex-1 bg-primary/20 ml-2" />
                          </div>
                        </td>
                      </tr>
                      {Object.entries(dates).map(([date, items]) => {
                        const groupKey = `${location}-${date}`;
                        const isOpen = expandedDates[groupKey] === true;
                        return (
                          <Collapsible
                            key={groupKey}
                            open={isOpen}
                            onOpenChange={() => toggleDate(groupKey)}
                            asChild
                          >
                            <React.Fragment>
                              <CollapsibleTrigger asChild>
                                <tr className="bg-muted/90 cursor-pointer hover:bg-muted border-b sticky top-[85px] z-20 backdrop-blur-sm">
                                  <td colSpan={6} className="p-0">
                                    <div className="flex items-center bg-inherit sticky left-0 w-[calc(100vw-2rem)] md:w-full">
                                      <div className="px-4 py-2 text-center bg-inherit z-30 border-r w-12 flex-shrink-0">
                                        {isOpen ? <ChevronUp className="h-4 w-4 mx-auto" /> : <ChevronDown className="h-4 w-4 mx-auto" />}
                                      </div>
                                      <div className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground bg-inherit z-20 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          <span>{date}</span>
                                          <span className="text-muted-foreground/30">•</span>
                                          <span className="text-primary/70">{items.length} trips</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <React.Fragment>
                                  {items.map((trip) => {
                                    const tripDiscount = Math.max(0, trip.basePrice - trip.appliedPrice);
                                    const outstanding = trip.appliedPrice - trip.paidAmount;
                                    
                                    return (
                                      <tr key={trip.id} className="group hover:bg-muted/50 transition-colors border-b" data-testid={`row-trip-${trip.id}`}>
                                        <td className="px-4 py-4 sticky left-0 bg-card group-hover:bg-muted/50 z-10 border-r border-b">
                                          <div className="flex flex-col w-24">
                                            <span className="text-sm font-mono font-medium">{trip.plateNumber}</span>
                                            <span className="text-[10px] text-muted-foreground font-sans">
                                              {format(new Date(trip.createdAt), "HH:mm")}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-muted-foreground text-xs border-b" data-testid={`text-base-price-${trip.id}`}>
                                          {new Intl.NumberFormat('id-ID').format(trip.basePrice)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-bold text-sm border-b" data-testid={`text-applied-price-${trip.id}`}>
                                          {new Intl.NumberFormat('id-ID').format(trip.appliedPrice)}
                                        </td>
                                        <td className="px-4 py-4 text-center border-b" data-testid={`status-payment-${trip.id}`}>
                                          {trip.paymentStatus === 'PAID' ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[9px] px-1 py-0 h-4">
                                              Paid
                                            </Badge>
                                          ) : trip.paymentStatus === 'PARTIAL' ? (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-[9px] px-1 py-0 h-4">
                                              Part
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 text-[9px] px-1 py-0 h-4">
                                              Unp
                                            </Badge>
                                          )}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-xs border-b" data-testid={`text-outstanding-${trip.id}`}>
                                          {outstanding > 0 ? (
                                            <span className="text-red-600 dark:text-red-400">
                                              {new Intl.NumberFormat('id-ID').format(outstanding)}
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-4 text-right border-b">
                                          {tripDiscount > 0 ? (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-[9px] px-1 py-0 h-4">
                                              -{new Intl.NumberFormat('id-ID', { notation: "compact" }).format(tripDiscount)}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[9px] px-1 py-0 h-4">
                                              Std
                                            </Badge>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              </CollapsibleContent>
                            </React.Fragment>
                          </Collapsible>
                        );
                      })}
                    </React.Fragment>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
