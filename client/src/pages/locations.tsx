import { useState } from "react";
import { useLocations, useCreateLocation, useDeleteLocation, useDefaultLocation, useSetDefaultLocation } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Locations() {
  const { data: locations = [], isLoading } = useLocations();
  const { data: defaultLocationData } = useDefaultLocation();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();
  const setDefaultLocation = useSetDefaultLocation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    try {
      await createLocation.mutateAsync({
        name: newName,
        note: newNote || undefined,
        isActive: true
      });
      
      setNewName("");
      setNewNote("");
      setIsAddOpen(false);
      toast({ title: "Location Added" });
    } catch (error: any) {
      toast({ 
        title: "Failed to add location", 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete location?')) return;
    
    try {
      await deleteLocation.mutateAsync(id);
      toast({ title: "Location deleted" });
    } catch (error) {
      toast({ title: "Failed to delete location", variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultLocation.mutateAsync(id);
      toast({ title: "Default location updated" });
    } catch (error) {
      toast({ title: "Failed to set default location", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="w-9 h-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Locations</h2>
          <p className="text-muted-foreground mt-1">Manage operation sites.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-location">
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
                  data-testid="input-location-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  placeholder="Additional notes..."
                  data-testid="input-location-note"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createLocation.isPending}
                data-testid="button-submit-location"
              >
                {createLocation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Location
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground" data-testid="text-no-locations">No locations found. Add your first location.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          locations.map(loc => {
            const isDefault = loc.id === defaultLocationData?.defaultLocationId;
            
            return (
              <Card key={loc.id} data-testid={`card-location-${loc.id}`} className="group hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-foreground">{loc.name}</div>
                        {loc.note && (
                          <div className="text-sm text-muted-foreground">{loc.note}</div>
                        )}
                        <div className="mt-1">
                          {isDefault ? (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          ) : (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                              onClick={() => handleSetDefault(loc.id)}
                              disabled={setDefaultLocation.isPending}
                              data-testid={`button-set-default-${loc.id}`}
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
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(loc.id)}
                        disabled={deleteLocation.isPending}
                        data-testid={`button-delete-${loc.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
