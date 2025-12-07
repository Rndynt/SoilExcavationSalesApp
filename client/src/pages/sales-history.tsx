import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Truck, Search, Filter } from "lucide-react";
import { useState } from "react";

export default function SalesHistory() {
  const { trips, locations } = useStore();
  
  // Filters
  const [filterPlate, setFilterPlate] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");

  const filteredTrips = trips.filter(trip => {
    const matchesPlate = trip.plateNumber.toLowerCase().includes(filterPlate.toLowerCase());
    const matchesLocation = filterLocation === 'all' || trip.locationId === filterLocation;
    return matchesPlate && matchesLocation;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sales History</h2>
        <p className="text-slate-500 mt-1">Review past transactions.</p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Search Plate</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search..." 
                value={filterPlate}
                onChange={e => setFilterPlate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="w-full md:w-1/3 space-y-2">
             <span className="text-xs font-semibold text-slate-500 uppercase">Location</span>
             <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3 text-right text-sm text-slate-500 pb-2">
            Showing {filteredTrips.length} records
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Plate</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-right">Base Price</th>
                <th className="px-6 py-3 font-medium text-right">Applied Price</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No trips found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const tripDiscount = Math.max(0, trip.basePrice - trip.appliedPrice);
                  const locationName = locations.find(l => l.id === trip.locationId)?.name || 'Unknown';
                  
                  return (
                    <tr key={trip.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{format(new Date(trip.transDate), "dd MMM yyyy")}</div>
                        <div className="text-xs">{format(new Date(trip.createdAt), "HH:mm")}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {trip.plateNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {locationName}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">
                        {new Intl.NumberFormat('id-ID').format(trip.basePrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                        {new Intl.NumberFormat('id-ID').format(trip.appliedPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tripDiscount > 0 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            - {new Intl.NumberFormat('id-ID', { notation: "compact" }).format(tripDiscount)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            Standard
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
  );
}
