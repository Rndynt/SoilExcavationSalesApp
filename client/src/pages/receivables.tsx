import { useState, useMemo } from "react";
import { useLocations, useTrucks, useSaleTrips, useUpdateSaleTrip } from "@/hooks/use-api";
import type { SaleTrip, Truck } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { AlertCircle, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTranslate } from "@/hooks/use-translate";

interface ReceivableGroup {
  plateNumber: string;
  driverName: string | null;
  driverPhone: string | null;
  totalOutstanding: number;
  transactionCount: number;
  transactions: SaleTrip[];
}

export default function Receivables() {
  const t = useTranslate();
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterPlate, setFilterPlate] = useState("");
  const [expandedPlates, setExpandedPlates] = useState<Set<string>>(new Set());
  const [selectedTrip, setSelectedTrip] = useState<SaleTrip | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: trucks = [] } = useTrucks();
  const { data: allTrips = [], isLoading: tripsLoading } = useSaleTrips({
    locationId: filterLocation !== "all" ? filterLocation : undefined,
    paymentStatus: "UNPAID", // Show only unpaid and partial
  });
  const updateSaleTrip = useUpdateSaleTrip();

  // Filter to get outstanding transactions
  const outstandingTrips = useMemo(() => {
    return allTrips.filter(trip => {
      const outstanding = trip.appliedPrice - trip.paidAmount;
      const matchesPlate = !filterPlate || trip.plateNumber.toLowerCase().includes(filterPlate.toLowerCase());
      return outstanding > 0 && matchesPlate;
    });
  }, [allTrips, filterPlate]);

  // Group by plate number
  const groupedReceivables = useMemo(() => {
    const groups: { [key: string]: ReceivableGroup } = {};

    outstandingTrips.forEach(trip => {
      const truck = trucks.find(t => t.plateNumber === trip.plateNumber);
      const key = trip.plateNumber;

      if (!groups[key]) {
        groups[key] = {
          plateNumber: trip.plateNumber,
          driverName: truck?.contactName || null,
          driverPhone: truck?.contactPhone || null,
          totalOutstanding: 0,
          transactionCount: 0,
          transactions: [],
        };
      }

      const outstanding = trip.appliedPrice - trip.paidAmount;
      groups[key].totalOutstanding += outstanding;
      groups[key].transactionCount += 1;
      groups[key].transactions.push(trip);
    });

    return Object.values(groups).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [outstandingTrips, trucks]);

  const togglePlateExpansion = (plateNumber: string) => {
    const newExpanded = new Set(expandedPlates);
    if (newExpanded.has(plateNumber)) {
      newExpanded.delete(plateNumber);
    } else {
      newExpanded.add(plateNumber);
    }
    setExpandedPlates(newExpanded);
  };

  const handlePaymentClick = (trip: SaleTrip) => {
    setSelectedTrip(trip);
    const outstanding = trip.appliedPrice - trip.paidAmount;
    setPaymentAmount(outstanding.toString());
    setIsPaymentDialogOpen(true);
  };

  const handleMarkAsPaid = async (trip: SaleTrip) => {
    try {
      await updateSaleTrip.mutateAsync({
        id: trip.id,
        paymentStatus: "PAID",
        paidAmount: trip.appliedPrice,
      });
      toast({ title: t('receivables.paymentRecorded') });
      setIsPaymentDialogOpen(false);
      setSelectedTrip(null);
      setPaymentAmount("");
    } catch (error: any) {
      toast({
        title: "Failed to update payment status",
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedTrip || !paymentAmount) return;

    const amount = parseInt(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const newPaidAmount = selectedTrip.paidAmount + amount;
    const newStatus = newPaidAmount >= selectedTrip.appliedPrice ? "PAID" : "PARTIAL";

    try {
      await updateSaleTrip.mutateAsync({
        id: selectedTrip.id,
        paymentStatus: newStatus,
        paidAmount: newPaidAmount,
      });
      toast({ title: t('receivables.paymentRecorded') });
      setIsPaymentDialogOpen(false);
      setSelectedTrip(null);
      setPaymentAmount("");
    } catch (error: any) {
      toast({
        title: t('receivables.failedToRecordPayment'),
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const totalOutstanding = groupedReceivables.reduce((sum, group) => sum + group.totalOutstanding, 0);
  const isLoading = locationsLoading || tripsLoading;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('receivables.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('receivables.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('receivables.totaloutstanding')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">{outstandingTrips.length} {t('receivables.transactions')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('receivables.vehiclesWithDebt')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedReceivables.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('receivables.uniquePlates')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('receivables.pendingTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outstandingTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('receivables.transactions')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <div className="w-full md:w-48 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('sales.searchplate')}</span>
            <Input
              data-testid="input-search-plate"
              placeholder={t('receivables.searchplate')}
              value={filterPlate}
              onChange={e => setFilterPlate(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('sales.location')}</span>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger data-testid="select-location-trigger">
                <SelectValue placeholder={t('sales.selectlocation')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.all')} {t('sales.location').toLowerCase()}</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:ml-auto text-right text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('syncqueue.loading')}
              </span>
            ) : (
              <span>{outstandingTrips.length} {t('receivables.outstandingtransactions')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : groupedReceivables.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('receivables.nooutstandingReceivables')}</p>
            </CardContent>
          </Card>
        ) : (
          groupedReceivables.map((group) => {
            const isExpanded = expandedPlates.has(group.plateNumber);
            return (
              <Card key={group.plateNumber} className="overflow-hidden">
                <button
                  data-testid={`button-toggle-group-${group.plateNumber}`}
                  onClick={() => togglePlateExpansion(group.plateNumber)}
                  className="w-full"
                >
                  <CardContent className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-mono font-bold text-lg" data-testid={`text-plate-${group.plateNumber}`}>
                            {group.plateNumber}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-driver-${group.plateNumber}`}>
                            {group.driverName ? `${group.driverName}${group.driverPhone ? ` • ${group.driverPhone}` : ''}` : 'No driver info'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right mr-4">
                      <div className="font-bold text-lg" data-testid={`text-outstanding-${group.plateNumber}`}>
                        Rp {new Intl.NumberFormat('id-ID').format(group.totalOutstanding)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {group.transactionCount} transaction{group.transactionCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </CardContent>
                </button>

                {isExpanded && (
                  <div className="border-t divide-y">
                    {group.transactions.map((trip, idx) => {
                      const locationName = locations.find(l => l.id === trip.locationId)?.name || 'Unknown';
                      const outstanding = trip.appliedPrice - trip.paidAmount;

                      return (
                        <div key={trip.id} className="p-4 hover:bg-muted/30 transition-colors" data-testid={`row-transaction-${trip.id}`}>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium" data-testid={`text-date-${trip.id}`}>
                                {format(new Date(trip.transDate), "dd MMM yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground" data-testid={`text-location-${trip.id}`}>
                                {locationName}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-mono" data-testid={`text-applied-price-${trip.id}`}>
                                Rp {new Intl.NumberFormat('id-ID').format(trip.appliedPrice)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Paid: Rp {new Intl.NumberFormat('id-ID').format(trip.paidAmount)}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-red-600 dark:text-red-500" data-testid={`text-outstanding-amount-${trip.id}`}>
                                Rp {new Intl.NumberFormat('id-ID').format(outstanding)}
                              </div>
                              <Badge className="text-xs mt-1">
                                {trip.paymentStatus === 'PAID' ? 'Paid' : trip.paymentStatus === 'PARTIAL' ? 'Partial' : 'Unpaid'}
                              </Badge>
                            </div>

                            <div className="flex gap-2">
                              <Dialog open={isPaymentDialogOpen && selectedTrip?.id === trip.id} onOpenChange={setIsPaymentDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    data-testid={`button-payment-${trip.id}`}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePaymentClick(trip)}
                                  >
                                    {t('receivables.recordPayment')}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{t('receivables.recordPayment')}</DialogTitle>
                                  </DialogHeader>
                                  {selectedTrip && (
                                    <div className="space-y-4 pt-4">
                                      <div>
                                        <span className="text-sm text-muted-foreground">{t('receivables.transactionDate')}:</span>
                                        <div className="font-medium">{format(new Date(selectedTrip.transDate), "dd MMM yyyy")}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">{t('receivables.price')}:</span>
                                        <div className="font-medium">Rp {new Intl.NumberFormat('id-ID').format(selectedTrip.appliedPrice)}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">{t('receivables.alreadyPaid')}:</span>
                                        <div className="font-medium">Rp {new Intl.NumberFormat('id-ID').format(selectedTrip.paidAmount)}</div>
                                      </div>
                                      <div className="bg-muted p-3 rounded">
                                        <span className="text-sm text-muted-foreground">{t('receivables.outstanding')}:</span>
                                        <div className="font-bold text-red-600 dark:text-red-500">
                                          Rp {new Intl.NumberFormat('id-ID').format(selectedTrip.appliedPrice - selectedTrip.paidAmount)}
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>{t('receivables.paymentAmount')}</Label>
                                        <Input
                                          data-testid="input-payment-amount"
                                          type="number"
                                          value={paymentAmount}
                                          onChange={(e) => setPaymentAmount(e.target.value)}
                                          placeholder={t('expenses.enteramount')}
                                          min="0"
                                        />
                                      </div>

                                      <div className="flex gap-2">
                                        <Button
                                          data-testid="button-record-payment"
                                          onClick={handleRecordPayment}
                                          disabled={updateSaleTrip.isPending}
                                          className="flex-1"
                                        >
                                          {updateSaleTrip.isPending ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              {t('sales.updating')}
                                            </>
                                          ) : (
                                            <>
                                              <Check className="h-4 w-4 mr-2" />
                                              {t('receivables.recordPayment')}
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          data-testid="button-mark-paid"
                                          variant="secondary"
                                          onClick={() => handleMarkAsPaid(selectedTrip)}
                                          disabled={updateSaleTrip.isPending}
                                        >
                                          {t('receivables.markAsPaid')}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
