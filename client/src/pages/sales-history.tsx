import { useLocations, useSaleTrips } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SalesHistory() {
  const [filterPlate, setFilterPlate] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: trips = [], isLoading: tripsLoading } = useSaleTrips({
    locationId: filterLocation !== "all" ? filterLocation : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    plateNumber: filterPlate || undefined,
    paymentStatus: filterPaymentStatus !== "all" ? filterPaymentStatus : undefined,
  });

  const isLoading = locationsLoading || tripsLoading;

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
        <p className="text-muted-foreground mt-1">Review past transactions.</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <div className="w-full md:w-48 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Search Plate</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                data-testid="input-search-plate"
                placeholder="Search..." 
                value={filterPlate}
                onChange={e => setFilterPlate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Location</span>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger data-testid="select-location-trigger">
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

          <div className="w-full md:w-40 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Date From</span>
            <Input 
              data-testid="input-date-from"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          <div className="w-full md:w-40 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Date To</span>
            <Input 
              data-testid="input-date-to"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>

          <div className="w-full md:w-40 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Payment Status</span>
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger data-testid="select-payment-status-trigger">
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
        </CardContent>
      </Card>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b sticky top-0 z-20">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="sticky left-0 bg-muted px-4 py-3 font-medium z-20 border-r">Plate</th>
                <th className="px-4 py-3 font-medium text-right">Base Price</th>
                <th className="px-4 py-3 font-medium text-right">Applied Price</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                <th className="px-4 py-3 font-medium text-right">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"></td>
                    <td className="sticky left-0 bg-muted px-4 py-4 border-r"><Skeleton className="h-4 w-20" /></td>
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
                      <tr className="bg-primary/5 sticky top-[41px] z-20">
                        <td colSpan={7} className="px-6 py-2 font-black text-sm uppercase tracking-widest text-primary border-y border-primary/20 backdrop-blur-sm">
                          {location}
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
                                <tr className="bg-muted/90 cursor-pointer hover:bg-muted border-b sticky top-[77px] z-10 backdrop-blur-sm">
                                  <td className="px-4 py-2 text-center">
                                    {isOpen ? <ChevronUp className="h-4 w-4 mx-auto" /> : <ChevronDown className="h-4 w-4 mx-auto" />}
                                  </td>
                                  <td colSpan={6} className="px-0 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                    <div className="flex items-center gap-2 px-2">
                                      <span>{date}</span>
                                      <span className="text-muted-foreground/30">•</span>
                                      <span className="text-primary/70">{items.length} trips</span>
                                    </div>
                                  </td>
                                </tr>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <>
                                  {items.map((trip) => {
                                    const tripDiscount = Math.max(0, trip.basePrice - trip.appliedPrice);
                                    const outstanding = trip.appliedPrice - trip.paidAmount;
                                    
                                    return (
                                      <tr key={trip.id} className="group hover:bg-muted/50 transition-colors border-b" data-testid={`row-trip-${trip.id}`}>
                                        <td className="px-4 py-4"></td>
                                        <td className="sticky left-0 bg-card group-hover:bg-muted/50 px-4 py-4 font-mono font-medium z-10 border-r whitespace-nowrap" data-testid={`text-plate-${trip.id}`}>
                                          <div className="flex flex-col">
                                            <span className="text-sm">{trip.plateNumber}</span>
                                            <span className="text-[10px] text-muted-foreground font-sans">
                                              {format(new Date(trip.createdAt), "HH:mm")}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-muted-foreground text-xs" data-testid={`text-base-price-${trip.id}`}>
                                          {new Intl.NumberFormat('id-ID').format(trip.basePrice)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-bold text-sm" data-testid={`text-applied-price-${trip.id}`}>
                                          {new Intl.NumberFormat('id-ID').format(trip.appliedPrice)}
                                        </td>
                                        <td className="px-4 py-4 text-center" data-testid={`status-payment-${trip.id}`}>
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
                                        <td className="px-4 py-4 text-right font-mono text-xs" data-testid={`text-outstanding-${trip.id}`}>
                                          {outstanding > 0 ? (
                                            <span className="text-red-600 dark:text-red-400">
                                              {new Intl.NumberFormat('id-ID').format(outstanding)}
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
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
                                </>
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
