import { useState } from "react";
import { useStore, Truck as TruckType } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Trucks() {
  const { trucks, addTruck, deleteTruck } = useStore();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [newPlate, setNewPlate] = useState("");
  const [newDriver, setNewDriver] = useState("");

  const filteredTrucks = trucks.filter(t => 
    t.plateNumber.toLowerCase().includes(search.toLowerCase()) || 
    (t.driverName && t.driverName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate) return;
    
    addTruck({
      plateNumber: newPlate.toUpperCase(),
      driverName: newDriver,
      isActive: true
    });
    
    setNewPlate("");
    setNewDriver("");
    setIsAddOpen(false);
    toast({ title: "Truck Added" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Trucks</h2>
          <p className="text-slate-500 mt-1">Manage fleet and drivers.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Truck</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input 
                  value={newPlate} 
                  onChange={e => setNewPlate(e.target.value)} 
                  placeholder="B 1234 XYZ"
                  className="uppercase font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Name (Optional)</Label>
                <Input 
                  value={newDriver} 
                  onChange={e => setNewDriver(e.target.value)} 
                  placeholder="Driver Name"
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Save Truck</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by plate or driver..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrucks.map(truck => (
          <Card key={truck.id} className="group hover:border-emerald-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-lg font-mono text-slate-900">{truck.plateNumber}</div>
                    <div className="text-sm text-slate-500">{truck.driverName || "No Driver Assigned"}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => {
                    if(confirm('Delete truck?')) deleteTruck(truck.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
