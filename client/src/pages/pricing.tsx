import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tags, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Pricing() {
  const { priceRules, locations, addPriceRule, deletePriceRule } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [locId, setLocId] = useState("");
  const [price, setPrice] = useState("280000");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locId) return;
    
    addPriceRule({
      locationId: locId,
      pricePerTrip: parseInt(price),
      startDate: date,
      isActive: true
    });
    
    setIsAddOpen(false);
    toast({ title: "Rule Added" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pricing Rules</h2>
          <p className="text-slate-500 mt-1">Configure base prices per location.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
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
                  <SelectTrigger>
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
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Save Rule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {priceRules.map(rule => {
          const locName = locations.find(l => l.id === rule.locationId)?.name || 'Unknown';
          
          return (
            <Card key={rule.id} className="group hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Tags className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 uppercase font-semibold">{locName}</div>
                      <div className="font-bold text-xl font-mono text-slate-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rule.pricePerTrip)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Effective: {rule.startDate}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => {
                      if(confirm('Delete rule?')) deletePriceRule(rule.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
