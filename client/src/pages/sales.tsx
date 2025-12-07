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

const BASE_PRICE = 280000;
const STEP = 5000;

export default function Sales() {
  const { trips, addTrip } = useStore();
  
  // Form State
  const [plate, setPlate] = useState("");
  const [locationId, setLocationId] = useState("loc_1");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [appliedPrice, setAppliedPrice] = useState(BASE_PRICE);

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
      basePrice: BASE_PRICE,
      appliedPrice,
    });

    toast({ 
      title: "Trip Logged", 
      description: `Plate ${plate.toUpperCase()} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(appliedPrice)}`
    });

    // Reset for next entry
    setPlate("");
    setAppliedPrice(BASE_PRICE);
    // Keep date/location same
  };

  const discount = Math.max(0, BASE_PRICE - appliedPrice);
  const isDiscounted = discount > 0;

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT COLUMN: INPUT FORM */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quick Log</h2>
          <p className="text-slate-500 mt-1">Record a new trip transaction.</p>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Top Row: Date & Location */}
              <div className="grid grid-cols-2 gap-4">
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
                    <Select value={locationId} onValueChange={setLocationId}>
                      <SelectTrigger className="pl-9 bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loc_1">Jakarta HQ</SelectItem>
                        <SelectItem value="loc_2">Surabaya Hub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Middle: Plate Input */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Truck Plate</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    value={plate}
                    onChange={e => setPlate(e.target.value)}
                    placeholder="B 1234 XYZ"
                    className="pl-10 h-12 text-lg font-mono uppercase placeholder:text-slate-300 border-slate-300 focus-visible:ring-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Bottom: Price Adjuster */}
              <div className="pt-4 pb-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-semibold text-slate-700">Applied Price</Label>
                  <div className="text-xs text-slate-400 font-mono">Base: {BASE_PRICE.toLocaleString()}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleAdjustPrice(-STEP)}
                      className="h-12 w-12 rounded-full border-slate-300 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <div className="text-center">
                      <div className="text-3xl font-bold font-mono tracking-tight text-slate-900">
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
                      className="h-12 w-12 rounded-full border-slate-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Range visualizer (optional polish) */}
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                     <div 
                        className={cn("h-full transition-all duration-300", isDiscounted ? "bg-amber-400" : "bg-emerald-500")} 
                        style={{ width: `${Math.min(100, (appliedPrice / BASE_PRICE) * 100)}%` }} 
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
      <div className="lg:col-span-7 space-y-6">
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
                  trips.map((trip) => {
                    const tripDiscount = Math.max(0, trip.basePrice - trip.appliedPrice);
                    return (
                      <tr key={trip.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {format(new Date(trip.createdAt), "HH:mm")}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                          {trip.plateNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {trip.locationId === 'loc_1' ? 'Jakarta' : 'Surabaya'}
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
