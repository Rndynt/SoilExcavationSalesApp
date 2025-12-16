import { useState } from "react";
import { useExpenses, useExpenseCategories, useCreateExpense, useCreateExpenseCategory, useLocations, useDefaultLocation } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Receipt, Plus, Filter, Truck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function Expenses() {
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

  // Category Form
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("OPERATIONAL");

  // API Hooks
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses({ categoryId: filterCat !== 'all' ? filterCat : undefined });
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const { data: locations = [] } = useLocations();
  const { data: defaultLocationData } = useDefaultLocation();
  const createExpense = useCreateExpense();
  const createCategory = useCreateExpenseCategory();

  const isLoading = expensesLoading || categoriesLoading;

  // Filter Logic
  const filteredExpenses = expenses.filter(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    if (!cat) return false;
    
    if (filterType !== 'all' && cat.type !== filterType) return false;
    
    return true;
  }).sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

  // Submit Expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newCatId) return;

    const locationId = defaultLocationData?.defaultLocationId || locations[0]?.id;
    if (!locationId) {
      toast({ title: "No location available", variant: "destructive" });
      return;
    }

    try {
      await createExpense.mutateAsync({
        locationId,
        expenseDate: newDate,
        amount: parseInt(newAmount),
        categoryId: newCatId,
        note: newNote || undefined,
        relatedPlateNumber: newPlate || undefined,
      });

      setIsAddOpen(false);
      setNewAmount("");
      setNewNote("");
      setNewPlate("");
      toast({ title: "Expense Recorded" });
    } catch (error) {
      toast({ title: "Failed to record expense", variant: "destructive" });
    }
  };

  // Submit Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory.mutateAsync({
        name: newCatName,
        type: newCatType as "OPERATIONAL" | "PAYABLE" | "LOAN",
        isActive: true,
      });
      setIsAddCatOpen(false);
      setNewCatName("");
      toast({ title: "Category Added" });
    } catch (error) {
      toast({ title: "Failed to add category", variant: "destructive" });
    }
  };

  const selectedCatType = categories.find(c => c.id === newCatId)?.type;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Expenses</h2>
          <p className="text-muted-foreground mt-1">Operational costs and price adjustments.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
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
                  <Input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)} 
                    data-testid="input-expense-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (IDR)</Label>
                  <Input 
                    type="number" 
                    value={newAmount} 
                    onChange={e => setNewAmount(e.target.value)} 
                    required 
                    data-testid="input-amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Category
                  <span 
                    className="text-xs text-emerald-600 cursor-pointer hover:underline"
                    onClick={() => setIsAddCatOpen(true)}
                    data-testid="link-new-category"
                  >
                    + New Category
                  </span>
                </Label>
                <Select value={newCatId} onValueChange={setNewCatId}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => !c.isSystem).map(c => (
                      <SelectItem key={c.id} value={c.id} data-testid={`select-item-category-${c.id}`}>
                        {c.name} ({c.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(selectedCatType === 'PAYABLE' || selectedCatType === 'LOAN') && (
                <div className="space-y-2 p-3 bg-muted rounded-md border border-border">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Loan/Payable Details</Label>
                  <div>
                    <Label className="text-xs">Related Plate</Label>
                    <Input 
                      value={newPlate} 
                      onChange={e => setNewPlate(e.target.value)} 
                      className="h-8 text-xs uppercase" 
                      placeholder="Optional" 
                      data-testid="input-related-plate"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  placeholder="Description..." 
                  data-testid="input-note"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createExpense.isPending}
                data-testid="button-submit-expense"
              >
                {createExpense.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  required 
                  data-testid="input-category-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newCatType} onValueChange={setNewCatType}>
                  <SelectTrigger data-testid="select-category-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                    <SelectItem value="PAYABLE">Payable (Driver)</SelectItem>
                    <SelectItem value="LOAN">Loan (Bank)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={createCategory.isPending}
                data-testid="button-submit-category"
              >
                {createCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filter:</span>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] h-9" data-testid="select-filter-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="DISCOUNT">Discount</SelectItem>
              <SelectItem value="PAYABLE">Payable</SelectItem>
              <SelectItem value="LOAN">Loan</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[200px] h-9" data-testid="select-filter-category">
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

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Note</th>
                <th className="px-6 py-3 font-medium">Details</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 text-muted-foreground/50" />
                      <p data-testid="text-no-expenses">No expenses found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const cat = categories.find(c => c.id === expense.categoryId);
                  const isDiscount = cat?.type === 'DISCOUNT';
                  const isPayableLoan = cat?.type === 'PAYABLE' || cat?.type === 'LOAN';

                  return (
                    <tr key={expense.id} className="group hover:bg-muted/50 transition-colors" data-testid={`row-expense-${expense.id}`}>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] font-normal",
                              isDiscount ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" :
                              isPayableLoan ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" :
                              "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                            )}
                          >
                            {cat?.type}
                          </Badge>
                          <span className="font-medium text-foreground">{cat?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                        {expense.note || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground text-xs">
                        {expense.relatedPlateNumber && (
                           <div className="flex items-center gap-1">
                             <Truck className="w-3 h-3" /> {expense.relatedPlateNumber}
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-foreground">
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
