import { useState, useEffect, useMemo } from "react";
import { useLocations, useTrucks, useResolvePrice, useDefaultLocation, useCreateSaleTrip, useSaleTrips, useCreateTruck, useUpdateSaleTrip, useDeleteSaleTrip } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Plus, Minus, Truck, Calendar, MapPin, ArrowRight, CreditCard, Loader2, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTranslate } from "@/hooks/use-translate";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface SaleTrip {
  id: string;
  locationId: string;
  transDate: string;
  plateNumber: string;
  basePrice: number;
  appliedPrice: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  paidAmount: number;
  paymentMethod?: "CASH" | "TRANSFER" | "QRIS" | "OTHER";
  note?: string;
  createdAt?: string;
}

const STEP = 5000;

export default function Sales() {
  const t = useTranslate();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: defaultLocationData } = useDefaultLocation();
  const { data: trucks } = useTrucks();
  
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [locationId, setLocationId] = useState<string>("");
  const [plate, setPlate] = useState("");
  const [plateOpen, setPlateOpen] = useState(false);
  const [note, setNote] = useState("");
  
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PARTIAL" | "UNPAID">("PAID");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "QRIS" | "OTHER">("CASH");

  useEffect(() => {
    if (defaultLocationData?.defaultLocationId && !locationId) {
      setLocationId(defaultLocationData.defaultLocationId);
    } else if (locations && locations.length > 0 && !locationId) {
      setLocationId(locations[0].id);
    }
  }, [defaultLocationData, locations, locationId]);

  const { data: priceData, isLoading: priceLoading } = useResolvePrice(locationId, date);
  const basePrice = priceData?.price ?? 0;
  const [appliedPrice, setAppliedPrice] = useState(0);

  useEffect(() => {
    if (basePrice > 0 && appliedPrice === 0) {
      setAppliedPrice(basePrice);
      if (paymentStatus === "PAID") {
        setPaidAmount(basePrice);
      }
    }
  }, [basePrice, appliedPrice, paymentStatus]);

  const { data: todayTrips, isLoading: tripsLoading } = useSaleTrips({
    dateFrom: date,
    dateTo: date,
    locationId: locationId || undefined,
  });

  const createTrip = useCreateSaleTrip();
  const createTruck = useCreateTruck();
  const updateTrip = useUpdateSaleTrip();
  const deleteTrip = useDeleteSaleTrip();
  
  const [editingTrip, setEditingTrip] = useState<SaleTrip | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleLocationChange = (val: string) => {
    setLocationId(val);
    setAppliedPrice(0);
  };

  const handleAdjustPrice = (delta: number) => {
    const newPrice = Math.max(0, appliedPrice + delta);
    setAppliedPrice(newPrice);
    if (paymentStatus === "PAID") {
      setPaidAmount(newPrice);
    } else if (paymentStatus === "PARTIAL") {
      setPaidAmount(Math.min(paidAmount, newPrice));
    }
  };

  const handlePaymentStatusChange = (status: "PAID" | "PARTIAL" | "UNPAID") => {
    setPaymentStatus(status);
    if (status === "PAID") {
      setPaidAmount(appliedPrice);
    } else if (status === "UNPAID") {
      setPaidAmount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) {
      toast({ title: "Plate required", variant: "destructive" });
      return;
    }
    if (!locationId) {
      toast({ title: "Location required", variant: "destructive" });
      return;
    }

    try {
      const upperPlate = plate.toUpperCase();
      
      // Check if truck with this plate already exists
      const truckExists = trucks?.some(t => t.plateNumber.toUpperCase() === upperPlate);
      
      // If truck doesn't exist, create it automatically
      if (!truckExists) {
        try {
          await createTruck.mutateAsync({
            plateNumber: upperPlate,
            isActive: true,
          });
          toast({ 
            title: "New truck created", 
            description: `Truck ${upperPlate} has been registered.`
          });
        } catch (truckError) {
          // If truck creation fails due to duplicate (race condition), continue anyway
          if (!String(truckError).includes("already exists")) {
            throw truckError;
          }
        }
      }

      await createTrip.mutateAsync({
        locationId,
        transDate: date,
        plateNumber: upperPlate,
        basePrice,
        appliedPrice,
        paymentStatus,
        paidAmount: paymentStatus === "PAID" ? appliedPrice : paymentStatus === "UNPAID" ? 0 : paidAmount,
        paymentMethod,
        note: note || undefined,
      });

      toast({ 
        title: "Trip Logged", 
        description: `Plate ${upperPlate} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(appliedPrice)}`
      });

      setPlate("");
      setNote("");
      setPaymentStatus("PAID");
      setPaidAmount(appliedPrice);
    } catch (error) {
      toast({ title: "Failed to log trip", description: String(error), variant: "destructive" });
    }
  };

  const discount = Math.max(0, basePrice - appliedPrice);
  const isDiscounted = discount > 0;
  const plateSuggestions = useMemo(() => {
    if (!trucks) return [];
    const term = plate.toUpperCase();
    return trucks.filter(t => t.plateNumber.toUpperCase().includes(term));
  }, [trucks, plate]);

  const handleEditTrip = (trip: SaleTrip) => {
    setEditingTrip(trip);
    setIsEditOpen(true);
  };

  const handleUpdateTrip = async () => {
    if (!editingTrip) return;
    try {
      await updateTrip.mutateAsync({
        id: editingTrip.id,
        locationId: editingTrip.locationId,
        transDate: editingTrip.transDate,
        plateNumber: editingTrip.plateNumber,
        basePrice: editingTrip.basePrice,
        appliedPrice: editingTrip.appliedPrice,
        paymentStatus: editingTrip.paymentStatus,
        paidAmount: editingTrip.paidAmount,
        paymentMethod: editingTrip.paymentMethod,
        note: editingTrip.note,
      });
      setIsEditOpen(false);
      setEditingTrip(null);
      toast({ title: "Trip updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update trip", description: String(error), variant: "destructive" });
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip.mutateAsync(tripId);
      setDeleteConfirmId(null);
      toast({ title: "Trip deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete trip", description: String(error), variant: "destructive" });
    }
  };

  if (locationsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="col-span-1 lg:col-span-5 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="col-span-1 lg:col-span-7 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="col-span-1 lg:col-span-5 space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-page-title">Quick Log</h2>
          <p className="text-muted-foreground mt-1">Record a new trip transaction.</p>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <div className="h-1 bg-primary w-full" />
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="pl-9"
                      data-testid="input-date"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={locationId} onValueChange={handleLocationChange}>
                      <SelectTrigger className="pl-9" data-testid="select-location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Truck Plate</Label>
                <Popover open={plateOpen} onOpenChange={setPlateOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Truck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
                      <Input 
                        value={plate}
                        onChange={e => {
                          setPlate(e.target.value);
                        }}
                        placeholder="B 1234 XYZ"
                        className="pl-10 h-12 text-lg font-mono uppercase"
                        autoFocus
                        data-testid="input-plate"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                    <Command>
                      <CommandList>
                        {plateSuggestions.length > 0 ? (
                          <CommandGroup heading="Suggestions">
                            {plateSuggestions.map(t => (
                              <CommandItem 
                                key={t.id} 
                                onSelect={() => {
                                  setPlate(t.plateNumber);
                                  setPlateOpen(false);
                                }}
                                data-testid={`suggestion-plate-${t.id}`}
                              >
                                {t.plateNumber}
                                {t.contactName && <span className="ml-2 text-muted-foreground text-xs">({t.contactName})</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : (
                           <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
                             New plate will be recorded
                           </CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="pt-4 pb-2 border-t">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Label className="text-sm font-semibold">Applied Price</Label>
                  <div className="text-xs text-muted-foreground font-mono">
                    {priceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `Base: ${basePrice.toLocaleString()}`}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 border space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleAdjustPrice(-STEP)}
                      className="h-12 w-12 shrink-0 rounded-full"
                      data-testid="button-price-decrease"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <div className="text-center px-2 min-w-0">
                      <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight" data-testid="text-applied-price">
                        {new Intl.NumberFormat('id-ID').format(appliedPrice)}
                      </div>
                      <div className="h-6 flex items-center justify-center gap-2 mt-1">
                        {isDiscounted ? (
                          <Badge variant="secondary" className="text-[10px]" data-testid="badge-discount">
                            Disc. {new Intl.NumberFormat('id-ID').format(discount)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                             Standard Price
                          </span>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleAdjustPrice(STEP)}
                      className="h-12 w-12 shrink-0 rounded-full"
                      data-testid="button-price-increase"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                     <div 
                        className={cn("h-full transition-all duration-300", isDiscounted ? "bg-amber-500" : "bg-primary")} 
                        style={{ width: `${basePrice > 0 ? Math.min(100, (appliedPrice / basePrice) * 100) : 0}%` }} 
                     />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Payment</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={paymentStatus} onValueChange={(v) => handlePaymentStatusChange(v as "PAID" | "PARTIAL" | "UNPAID")}>
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Method</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "CASH" | "TRANSFER" | "QRIS" | "OTHER")}>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {paymentStatus === "PARTIAL" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Paid Amount</Label>
                    <Input 
                      type="number" 
                      value={paidAmount} 
                      onChange={e => setPaidAmount(Math.min(appliedPrice, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="font-mono"
                      data-testid="input-paid-amount"
                    />
                    <p className="text-xs text-muted-foreground">
                      Outstanding: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(appliedPrice - paidAmount)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note (Optional)</Label>
                <Textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..."
                  className="resize-none"
                  rows={2}
                  data-testid="input-note"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 font-medium text-base"
                disabled={createTrip.isPending}
                data-testid="button-submit"
              >
                {createTrip.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Log Trip
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-1 lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Today's Logs</h2>
            <p className="text-muted-foreground mt-1 text-sm">Most recent transactions recorded.</p>
          </div>
          <Badge variant="outline" data-testid="badge-trip-count">
            {todayTrips?.length ?? 0} trips
          </Badge>
        </div>

        <div className="space-y-4">
          {tripsLoading ? (
            <Card className="p-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </Card>
          ) : todayTrips?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground italic">
              No trips logged yet today.
            </Card>
          ) : (
            (() => {
              const groupedByLocation = todayTrips?.reduce((acc, trip) => {
                const locName = locations?.find(l => l.id === trip.locationId)?.name || 'Unknown';
                if (!acc[locName]) acc[locName] = [];
                acc[locName].push(trip);
                return acc;
              }, {} as Record<string, typeof todayTrips>);

              return Object.entries(groupedByLocation || {}).map(([locationName, trips]) => (
                <div key={locationName} className="space-y-3">
                  <div className="flex items-center gap-2 px-1 pt-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{locationName}</h3>
                    <div className="h-px flex-1 bg-border ml-2" />
                  </div>
                  
                  <div className="grid gap-3">
                    {trips.map((trip) => {
                      const tripDiscount = Math.max(0, trip.basePrice - trip.appliedPrice);
                      const truck = trucks?.find(t => t.plateNumber.toUpperCase() === trip.plateNumber.toUpperCase());
                      const driverName = truck?.contactName || "-";

                      return (
                        <Card key={trip.id} className="group hover-elevate overflow-hidden border-l-4 border-l-primary/10 hover:border-l-primary transition-all" data-testid={`card-trip-${trip.id}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="text-center min-w-[45px] py-1 bg-muted/50 rounded-md">
                                  <div className="text-xs font-medium text-muted-foreground uppercase">
                                    {trip.createdAt ? format(new Date(trip.createdAt), "HH:mm") : "-"}
                                  </div>
                                </div>
                                
                                <div className="space-y-0.5">
                                  <div className="font-mono font-bold text-base leading-none tracking-tight">
                                    {trip.plateNumber}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    {driverName}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 ml-auto">
                                <div className="text-right space-y-0.5">
                                  <div className={cn(
                                    "font-mono font-bold text-base",
                                    trip.paymentStatus === 'UNPAID' ? "text-destructive" : "text-foreground"
                                  )}>
                                    {new Intl.NumberFormat('id-ID').format(trip.appliedPrice)}
                                  </div>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {trip.paymentStatus === 'UNPAID' && (
                                      <Badge variant="destructive" className="text-[10px] h-4 px-1 uppercase leading-none">
                                        Unpaid
                                      </Badge>
                                    )}
                                    {tripDiscount > 0 ? (
                                      <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none text-amber-600 border-amber-200 bg-amber-50">
                                        -{new Intl.NumberFormat('id-ID', { notation: "compact" }).format(tripDiscount)}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none opacity-70">
                                        Full
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 border-l pl-3">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleEditTrip(trip as any)}
                                    data-testid={`button-edit-trip-${trip.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteConfirmId(trip.id)}
                                    data-testid={`button-delete-trip-${trip.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {trip.note && (
                              <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground italic flex items-start gap-1">
                                <div className="mt-0.5">Note:</div>
                                <div className="flex-1">{trip.note}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>Update the trip details</DialogDescription>
          </DialogHeader>
          {editingTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Date</Label>
                  <Input 
                    type="date"
                    value={editingTrip.transDate}
                    onChange={e => setEditingTrip({...editingTrip, transDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Plate</Label>
                  <Input 
                    value={editingTrip.plateNumber}
                    onChange={e => setEditingTrip({...editingTrip, plateNumber: e.target.value.toUpperCase()})}
                    placeholder="B 1234 XYZ"
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Location</Label>
                <Select value={editingTrip.locationId} onValueChange={locId => setEditingTrip({...editingTrip, locationId: locId})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Base Price</Label>
                  <Input 
                    type="number"
                    value={editingTrip.basePrice}
                    onChange={e => setEditingTrip({...editingTrip, basePrice: parseInt(e.target.value) || 0})}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Applied Price</Label>
                  <Input 
                    type="number"
                    value={editingTrip.appliedPrice}
                    onChange={e => setEditingTrip({...editingTrip, appliedPrice: parseInt(e.target.value) || 0})}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Paid Amount</Label>
                  <Input 
                    type="number"
                    value={editingTrip.paidAmount}
                    onChange={e => setEditingTrip({...editingTrip, paidAmount: parseInt(e.target.value) || 0})}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Payment Status</Label>
                <Select value={editingTrip.paymentStatus} onValueChange={s => setEditingTrip({...editingTrip, paymentStatus: s as "PAID" | "PARTIAL" | "UNPAID"})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Note</Label>
                <Textarea 
                  value={editingTrip.note || ""}
                  onChange={e => setEditingTrip({...editingTrip, note: e.target.value})}
                  placeholder="Optional notes"
                  className="resize-none"
                />
              </div>
              <Button onClick={handleUpdateTrip} disabled={updateTrip.isPending} className="w-full">
                {updateTrip.isPending ? "Updating..." : "Update Trip"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDeleteTrip(deleteConfirmId)}
              disabled={deleteTrip.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteTrip.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
