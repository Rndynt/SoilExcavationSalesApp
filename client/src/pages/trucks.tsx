import { useState } from "react";
import { useTrucks, useCreateTruck, useDeleteTruck } from "@/hooks/use-api";
import type { Truck } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck as TruckIcon, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Trucks() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: trucks = [], isLoading } = useTrucks(search || undefined);
  const createTruck = useCreateTruck();
  const deleteTruck = useDeleteTruck();

  const [newPlate, setNewPlate] = useState("");
  const [newDriver, setNewDriver] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate) return;
    
    try {
      await createTruck.mutateAsync({
        plateNumber: newPlate.toUpperCase(),
        contactName: newDriver || undefined,
        isActive: true
      });
      
      setNewPlate("");
      setNewDriver("");
      setIsAddOpen(false);
      toast({ title: "Truck Added" });
    } catch (error: any) {
      toast({ 
        title: "Failed to add truck", 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Trucks</h2>
          <p className="text-muted-foreground mt-1">Manage fleet and drivers.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-truck" className="bg-emerald-600 hover:bg-emerald-700">
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
                  data-testid="input-plate"
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
                  data-testid="input-driver"
                  value={newDriver} 
                  onChange={e => setNewDriver(e.target.value)} 
                  placeholder="Driver Name"
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={createTruck.isPending}>
                {createTruck.isPending ? "Saving..." : "Save Truck"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by plate or driver..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="w-9 h-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck: Truck) => (
            <Card key={truck.id} data-testid={`card-truck-${truck.id}`} className="group hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 transition-colors">
                      <TruckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg font-mono text-foreground">{truck.plateNumber}</div>
                      <div className="text-sm text-muted-foreground">{truck.contactName || "No Driver Assigned"}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={async () => {
                      if(confirm('Delete truck?')) {
                        try {
                          await deleteTruck.mutateAsync(truck.id);
                          toast({ title: "Truck deleted" });
                        } catch (error) {
                          toast({ title: "Failed to delete truck", variant: "destructive" });
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
