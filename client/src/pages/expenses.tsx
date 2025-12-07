import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Receipt, Search, Plus, Filter, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function Expenses() {
  const { expenses, categories, addExpense, addCategory } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  // Form
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAmount, setNewAmount] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newStatus, setNewStatus] = useState("UNPAID");

  // Category Form
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("OPERATIONAL");

  // Filter Logic
  const filteredExpenses = expenses.filter(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    if (!cat) return false;
    
    if (filterType !== 'all' && cat.type !== filterType) return false;
    if (filterCat !== 'all' && cat.id !== filterCat) return false;
    
    return true;
  }).sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

  // Submit Expense
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newCatId) return;

    addExpense({
      locationId: 'loc_1', // Default for now
      expenseDate: newDate,
      amount: parseInt(newAmount),
      categoryId: newCatId,
      note: newNote,
      relatedPlateNumber: newPlate,
      status: newStatus as any
    });

    setIsAddOpen(false);
    setNewAmount("");
    setNewNote("");
    toast({ title: "Expense Recorded" });
  };

  // Submit Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addCategory({
      name: newCatName,
      type: newCatType as any,
      isActive: true
    });
    setIsAddCatOpen(false);
    setNewCatName("");
    toast({ title: "Category Added" });
  };

  const selectedCatType = categories.find(c => c.id === newCatId)?.type;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-slate-500 mt-1">Operational costs and price adjustments.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Amount (IDR)</Label>
                  <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Category
                  <span 
                    className="text-xs text-emerald-600 cursor-pointer hover:underline"
                    onClick={() => setIsAddCatOpen(true)}
                  >
                    + New Category
                  </span>
                </Label>
                <Select value={newCatId} onValueChange={setNewCatId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => !c.isSystem).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Fields based on Category Type */}
              {(selectedCatType === 'DEBT' || selectedCatType === 'LOAN') && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-md border border-slate-100">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Loan/Debt Details</Label>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <Label className="text-xs">Status</Label>
                       <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPAID">Unpaid</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                     </div>
                     <div>
                       <Label className="text-xs">Related Plate</Label>
                       <Input 
                        value={newPlate} 
                        onChange={e => setNewPlate(e.target.value)} 
                        className="h-8 text-xs uppercase" 
                        placeholder="Optional" 
                       />
                     </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Description..." />
              </div>

              <Button type="submit" className="w-full bg-slate-900 text-white">Save Expense</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Nested Dialog for Add Category */}
        <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newCatType} onValueChange={setNewCatType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                    <SelectItem value="DEBT">Debt (Driver)</SelectItem>
                    <SelectItem value="LOAN">Loan (Bank)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-emerald-600">Create Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filter:</span>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="DISCOUNT">Discount</SelectItem>
              <SelectItem value="DEBT">Debt</SelectItem>
              <SelectItem value="LOAN">Loan</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                 <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Note</th>
                <th className="px-6 py-3 font-medium">Details</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-200" />
                      <p>No expenses found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const cat = categories.find(c => c.id === expense.categoryId);
                  const isDiscount = cat?.type === 'DISCOUNT';
                  const isDebtLoan = cat?.type === 'DEBT' || cat?.type === 'LOAN';

                  return (
                    <tr key={expense.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] font-normal",
                              isDiscount ? "bg-amber-50 text-amber-700 border-amber-200" :
                              isDebtLoan ? "bg-purple-50 text-purple-700 border-purple-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {cat?.type}
                          </Badge>
                          <span className="font-medium text-slate-700">{cat?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {expense.note || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                        {expense.relatedPlateNumber && (
                           <div className="flex items-center gap-1">
                             <Truck className="w-3 h-3" /> {expense.relatedPlateNumber}
                           </div>
                        )}
                        {expense.status && (
                           <div className={cn("mt-1 font-sans font-medium", expense.status === 'UNPAID' ? "text-red-500" : "text-emerald-500")}>
                             {expense.status}
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expense.amount)}
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
