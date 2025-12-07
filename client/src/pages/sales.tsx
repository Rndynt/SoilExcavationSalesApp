import { useState } from "react";
import { useStore, SaleTrip } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Minus, Truck, Calendar, MapPin, Tag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STEP = 5000;

export default function Sales() {
  const { trips, addTrip, locations, trucks, defaultLocationId, resolveBasePrice } = useStore();
  
  // Form State
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [plate, setPlate] = useState("");
  const [plateOpen, setPlateOpen] = useState(false);
  
  // Derive Base Price from Rules
  const basePrice = resolveBasePrice(locationId, date);
  const [appliedPrice, setAppliedPrice] = useState(basePrice);

  // Reset applied price if base price changes (e.g. location switch)
  // In a real app we might want to be careful not to overwrite user input, 
  // but for quick logging, syncing to base is usually desired.
  // We'll use a simple effect-like logic in render or separate useEffect.
  // For simplicity here, we assume user sets location first. 
  // If they change location, we reset price.
  const handleLocationChange = (val: string) => {
    setLocationId(val);
    const newBase = resolveBasePrice(val, date);
    setAppliedPrice(newBase);
  };

  const handleAdjustPrice = (delta: number) => {
    setAppliedPrice(prev => Math.max(0, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) {
      toast({ title: "Plate required", variant: "destructive" });
      return;
    }

    addTrip({
      locationId,
      transDate: date,
      plateNumber: plate.toUpperCase(),
      basePrice: basePrice,
      appliedPrice,
    });

    toast({ 
      title: "Trip Logged", 
      description: `Plate ${plate.toUpperCase()} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(appliedPrice)}`
    });

    // Reset for next entry
    setPlate("");
    // setAppliedPrice(basePrice); // Reset to standard
  };

  const discount = Math.max(0, basePrice - appliedPrice);
  const isDiscounted = discount > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT COLUMN: INPUT FORM */}
      <div className="col-span-1 lg:col-span-5 space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Quick Log</h2>
          <p className="text-slate-500 mt-1">Record a new trip transaction.</p>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Top Row: Date & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="pl-9 bg-slate-50/50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Select value={locationId} onValueChange={handleLocationChange}>
                      <SelectTrigger className="pl-9 bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Middle: Plate Input with Autocomplete */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Truck Plate</Label>
                <Popover open={plateOpen} onOpenChange={setPlateOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Truck className="absolute left-3 top-3 h-5 w-5 text-slate-400 z-10" />
                      <Input 
                        value={plate}
                        onChange={e => setPlate(e.target.value)}
                        placeholder="B 1234 XYZ"
                        className="pl-10 h-12 text-lg font-mono uppercase placeholder:text-slate-300 border-slate-300 focus-visible:ring-emerald-500"
                        autoFocus
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                    <Command>
                      <CommandList>
                        {trucks.filter(t => t.plateNumber.includes(plate.toUpperCase())).length > 0 ? (
                          <CommandGroup heading="Suggestions">
                            {trucks.filter(t => t.plateNumber.includes(plate.toUpperCase())).map(t => (
                              <CommandItem 
                                key={t.id} 
                                onSelect={() => {
                                  setPlate(t.plateNumber);
                                  setPlateOpen(false);
                                }}
                              >
                                {t.plateNumber}
                                {t.driverName && <span className="ml-2 text-slate-400 text-xs">({t.driverName})</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : (
                           <CommandEmpty className="py-2 text-center text-xs text-slate-500">
                             New plate will be recorded
                           </CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bottom: Price Adjuster */}
              <div className="pt-4 pb-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-semibold text-slate-700">Applied Price</Label>
                  <div className="text-xs text-slate-400 font-mono">Base: {basePrice.toLocaleString()}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleAdjustPrice(-STEP)}
                      className="h-12 w-12 shrink-0 rounded-full border-slate-300 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <div className="text-center px-2">
                      <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-slate-900">
                        {new Intl.NumberFormat('id-ID').format(appliedPrice)}
                      </div>
                      <div className="h-6 flex items-center justify-center gap-2 mt-1">
                        {isDiscounted ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 px-2 py-0 h-5 text-[10px]">
                            Disc. {new Intl.NumberFormat('id-ID').format(discount)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
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
                      className="h-12 w-12 shrink-0 rounded-full border-slate-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Range visualizer (optional polish) */}
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                     <div 
                        className={cn("h-full transition-all duration-300", isDiscounted ? "bg-amber-400" : "bg-emerald-500")} 
                        style={{ width: `${Math.min(100, (appliedPrice / basePrice) * 100)}%` }} 
                     />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base shadow-lg shadow-slate-900/10">
                Log Trip
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: RECENT LOGS */}
      <div className="col-span-1 lg:col-span-7 space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Today's Logs</h2>
          <p className="text-slate-500 mt-1 text-sm">Most recent transactions recorded.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Plate</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium text-right">Applied Price</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                      No trips logged yet today.
                    </td>
                  </tr>
                ) : (
                  trips.slice(0, 10).map((trip) => {
                     const tripDiscount = Math.max(0, trip.basePrice - trip.appliedPrice);
                     const locName = locations.find(l => l.id === trip.locationId)?.name || 'Unknown';
                     
                    return (
                      <tr key={trip.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {format(new Date(trip.createdAt), "HH:mm")}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                          {trip.plateNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {locName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {new Intl.NumberFormat('id-ID').format(trip.appliedPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {tripDiscount > 0 ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              - {new Intl.NumberFormat('id-ID', { notation: "compact" }).format(tripDiscount)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Full Price
                            </Badge>
                          )}
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
    </div>
  );
}
