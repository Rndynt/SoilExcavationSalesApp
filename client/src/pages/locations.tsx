import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Locations() {
  const { locations, addLocation, deleteLocation, defaultLocationId, setDefaultLocation } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    addLocation({
      name: newName,
      isActive: true
    });
    
    setNewName("");
    setIsAddOpen(false);
    toast({ title: "Location Added" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Locations</h2>
          <p className="text-slate-500 mt-1">Manage operation sites.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. West Jakarta Site"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Save Location</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map(loc => {
          const isDefault = loc.id === defaultLocationId;
          
          return (
            <Card key={loc.id} className="group hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-900">{loc.name}</div>
                      <div className="mt-1">
                        {isDefault ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Default</Badge>
                        ) : (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs text-slate-500 hover:text-emerald-600"
                            onClick={() => setDefaultLocation(loc.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!isDefault && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if(confirm('Delete location?')) deleteLocation(loc.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
