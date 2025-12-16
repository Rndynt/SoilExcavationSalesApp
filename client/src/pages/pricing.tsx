import { useState } from "react";
import { usePriceRules, useLocations, useCreatePriceRule, useDeletePriceRule } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tags, Plus, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
  const { data: priceRules = [], isLoading: rulesLoading, isError: rulesError, error: rulesErrorObj, refetch: refetchRules } = usePriceRules();
  const { data: locations = [], isLoading: locationsLoading, isError: locationsError, error: locationsErrorObj, refetch: refetchLocations } = useLocations();
  const createPriceRule = useCreatePriceRule();
  const deletePriceRule = useDeletePriceRule();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [locId, setLocId] = useState("");
  const [price, setPrice] = useState("280000");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const isLoading = rulesLoading || locationsLoading;
  const isError = rulesError || locationsError;

  const handleRefresh = () => {
    refetchRules();
    refetchLocations();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locId) return;
    
    try {
      await createPriceRule.mutateAsync({
        locationId: locId,
        pricePerTrip: parseInt(price),
        startDate: date,
        endDate: endDate || undefined,
        note: note || undefined,
        isActive: true
      });
      
      setIsAddOpen(false);
      setLocId("");
      setPrice("280000");
      setNote("");
      setEndDate("");
      toast({ title: "Pricing Rule Added" });
    } catch (error: any) {
      toast({ 
        title: "Failed to add pricing rule", 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete pricing rule?')) return;
    
    try {
      await deletePriceRule.mutateAsync(id);
      toast({ title: "Pricing rule deleted" });
    } catch (error) {
      toast({ title: "Failed to delete pricing rule", variant: "destructive" });
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
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-3 w-24" />
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

  if (isError) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Pricing Rules</h2>
            <p className="text-muted-foreground mt-1">Configure base prices per location.</p>
          </div>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <p className="text-foreground font-medium" data-testid="text-error">Failed to load pricing rules</p>
                <p className="text-sm text-muted-foreground mt-1">{(rulesErrorObj as Error)?.message || (locationsErrorObj as Error)?.message || "Please try again"}</p>
              </div>
              <Button variant="outline" onClick={handleRefresh} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Pricing Rules</h2>
          <p className="text-muted-foreground mt-1">Configure base prices per location.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rule">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Pricing Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locId} onValueChange={setLocId}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Base Price (IDR)</Label>
                <Input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)}
                  step={5000}
                  data-testid="input-price"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input 
                  value={note} 
                  onChange={e => setNote(e.target.value)}
                  placeholder="Additional notes..."
                  data-testid="input-note"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createPriceRule.isPending || !locId}
                data-testid="button-submit-rule"
              >
                {createPriceRule.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Rule
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {priceRules.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <Tags className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground" data-testid="text-no-rules">No pricing rules found. Add your first rule.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          priceRules.map(rule => {
            const locName = locations.find(l => l.id === rule.locationId)?.name || 'Unknown';
            const isActive = rule.isActive;
            const today = new Date().toISOString().split('T')[0];
            const isCurrentlyActive = isActive && 
              rule.startDate <= today && 
              (!rule.endDate || rule.endDate >= today);
            
            return (
              <Card key={rule.id} data-testid={`card-rule-${rule.id}`} className="group hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Tags className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground uppercase font-semibold">{locName}</span>
                          {isCurrentlyActive && (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <div className="font-bold text-xl font-mono text-foreground">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rule.pricePerTrip)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          From: {rule.startDate}
                          {rule.endDate && ` to ${rule.endDate}`}
                        </div>
                        {rule.note && (
                          <div className="text-xs text-muted-foreground mt-1">{rule.note}</div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletePriceRule.isPending}
                      data-testid={`button-delete-${rule.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
