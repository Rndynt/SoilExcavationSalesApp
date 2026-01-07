import { useState } from "react";
import { useExpenses, useExpenseCategories, useCreateExpense, useUpdateExpense, useDeleteExpense, useCreateExpenseCategory, useLocations, useDefaultLocation } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Receipt, Plus, Filter, Truck, Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTranslate } from "@/hooks/use-translate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type TimePeriod = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH";

const getDateRange = (period: TimePeriod): [string, string] => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case "TODAY":
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case "YESTERDAY":
      const yesterday = subDays(now, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case "THIS_WEEK":
      start = startOfWeek(now, { weekStartsOn: 0 });
      end = endOfWeek(now, { weekStartsOn: 0 });
      break;
    case "THIS_MONTH":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "LAST_MONTH":
      const lastMonth = subDays(now, 30);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
  }

  return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')];
};

const TIME_PRESETS: { value: TimePeriod; label: string }[] = [
  { value: "TODAY", label: "dashboard.today" },
  { value: "YESTERDAY", label: "dashboard.yesterday" },
  { value: "THIS_WEEK", label: "dashboard.thisweek" },
  { value: "THIS_MONTH", label: "dashboard.thismonth" },
  { value: "LAST_MONTH", label: "dashboard.lastmonth" },
];

export default function Expenses() {
  const t = useTranslate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>("THIS_MONTH");

  // Edit State
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // API Hooks
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses({ categoryId: filterCat !== 'all' ? filterCat : undefined });
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const { data: locations = [] } = useLocations();
  const { data: defaultLocationData } = useDefaultLocation();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();

  const isLoading = expensesLoading || categoriesLoading;

  // Filter Logic
  const [dateFrom, dateTo] = getDateRange(period);
  const filteredExpenses = expenses.filter(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    if (!cat) return false;
    
    if (filterType !== 'all' && cat.type !== filterType) return false;
    
    // Filter by date range
    if (e.expenseDate < dateFrom || e.expenseDate > dateTo) return false;
    
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !newAmount || !newCatId) return;

    try {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        expenseDate: newDate,
        amount: parseInt(newAmount),
        categoryId: newCatId,
        note: newNote || undefined,
        relatedPlateNumber: newPlate || undefined,
      });

      setIsEditOpen(false);
      setEditingExpense(null);
      setNewAmount("");
      setNewNote("");
      setNewPlate("");
      toast({ title: "Expense Updated" });
    } catch (error) {
      toast({ title: "Failed to update expense", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense.mutateAsync(id);
      toast({ title: "Expense Deleted" });
    } catch (error) {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    }
  };

  const openEditDialog = (expense: any) => {
    setEditingExpense(expense);
    setNewDate(expense.expenseDate.split('T')[0]);
    setNewAmount(expense.amount.toString());
    setNewCatId(expense.categoryId);
    setNewNote(expense.note || "");
    setNewPlate(expense.relatedPlateNumber || "");
    setIsEditOpen(true);
  };

  // Submit Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: newCatName,
          type: newCatType as "OPERATIONAL" | "PAYABLE" | "LOAN",
        });
        toast({ title: "Category Updated" });
      } else {
        await createCategory.mutateAsync({
          name: newCatName,
          type: newCatType as "OPERATIONAL" | "PAYABLE" | "LOAN",
          isActive: true,
        });
        toast({ title: "Category Added" });
      }
      setIsAddCatOpen(false);
      setEditingCategory(null);
      setNewCatName("");
    } catch (error) {
      toast({ title: "Failed to save category", variant: "destructive" });
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setNewCatName(category.name);
    setNewCatType(category.type);
    setIsAddCatOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Category Deleted" });
    } catch (error) {
      toast({ title: "Failed to delete category", variant: "destructive" });
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">{t('expenses.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('expenses.subtitle')}</p>
      </div>

      <Card className="border-border shadow-sm bg-accent/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('expenses.addexpense')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="md:col-span-1 space-y-2">
                <Label className="text-xs font-semibold">{t('expenses.date')}</Label>
                <Input 
                  type="date" 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)} 
                  data-testid="input-expense-date"
                  className="h-9"
                />
              </div>

              <div className="md:col-span-1 space-y-2">
                <Label className="text-xs font-semibold">{t('expenses.amount')}</Label>
                <Input 
                  type="number" 
                  value={newAmount} 
                  onChange={e => setNewAmount(e.target.value)} 
                  required 
                  data-testid="input-amount"
                  placeholder="0"
                  className="h-9"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold flex justify-between">
                  {t('expenses.category')}
                  <span 
                    className="text-xs text-primary cursor-pointer hover:underline font-normal"
                    onClick={() => setIsAddCatOpen(true)}
                    data-testid="link-new-category"
                  >
                    + {t('expenses.addnewcategory')}
                  </span>
                </Label>
                <Select value={newCatId} onValueChange={setNewCatId}>
                  <SelectTrigger data-testid="select-category" className="h-9">
                    <SelectValue placeholder={t('expenses.selectcategory')} />
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
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-xs font-semibold">Plat</Label>
                  <Input 
                    value={newPlate} 
                    onChange={e => setNewPlate(e.target.value)} 
                    className="h-9 text-xs uppercase" 
                    placeholder="Opt" 
                    data-testid="input-related-plate"
                  />
                </div>
              )}

              <div className={`space-y-2 ${selectedCatType === 'PAYABLE' || selectedCatType === 'LOAN' ? 'md:col-span-1' : 'md:col-span-2'}`}>
                <Label className="text-xs font-semibold">Catatan</Label>
                <Input 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  placeholder="..." 
                  data-testid="input-note"
                  className="h-9 text-xs"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button 
                  type="submit" 
                  className="w-full h-9" 
                  disabled={createExpense.isPending}
                  data-testid="button-submit-expense"
                >
                  {createExpense.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Catat
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isAddCatOpen} onOpenChange={(open) => {
        setIsAddCatOpen(open);
        if (!open) setEditingCategory(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Kategori" : t('expenses.addnewcategory')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('expenses.categoryname')}</Label>
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
                  <SelectItem value="OPERATIONAL">{t('expenses.operational')}</SelectItem>
                  <SelectItem value="PAYABLE">{t('expenses.payable')}</SelectItem>
                  <SelectItem value="LOAN">{t('expenses.loan')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createCategory.isPending || updateCategory.isPending}
                data-testid="button-submit-category"
              >
                {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('expenses.save')}
              </Button>
              {editingCategory && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" data-testid="button-delete-category">
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Kategori ini akan dihapus permanen. Pastikan tidak ada pengeluaran yang menggunakan kategori ini.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteCategory(editingCategory.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Pengeluaran</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Jumlah (IDR)</Label>
                <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={newCatId} onValueChange={setNewCatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => !c.isSystem).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plat Nomor (Opsional)</Label>
              <Input value={newPlate} onChange={e => setNewPlate(e.target.value)} placeholder="BK 1234 XX" />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={updateExpense.isPending}>
                {updateExpense.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 flex-wrap">
        {TIME_PRESETS.map(p => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.value)}
            data-testid={`button-preset-${p.value.toLowerCase()}`}
          >
            {t(p.label)}
          </Button>
        ))}
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
              <SelectItem value="OPERATIONAL">{t('expenses.operational')}</SelectItem>
              <SelectItem value="DISCOUNT">{t('expenses.discount')}</SelectItem>
              <SelectItem value="PAYABLE">{t('expenses.payable')}</SelectItem>
              <SelectItem value="LOAN">{t('expenses.loan')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[200px] h-9" data-testid="select-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                 <div key={c.id} className="flex items-center justify-between px-2 py-1 hover:bg-muted cursor-default group w-full">
                   <SelectItem value={c.id} className="flex-1">{c.name}</SelectItem>
                   {!c.isSystem && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         openEditCategory(c);
                       }}
                     >
                       <Edit2 className="h-3 w-3" />
                     </Button>
                   )}
                 </div>
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
                <th className="px-6 py-3 font-medium text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
                  const isSystem = cat?.isSystem || false;

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
                      <td className="px-6 py-4 text-right">
                        {!isSystem && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" data-testid={`button-actions-${expense.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(expense)} data-testid={`button-edit-${expense.id}`}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" data-testid={`button-delete-trigger-${expense.id}`}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Hapus
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tindakan ini tidak dapat dibatalkan. Pengeluaran ini akan dihapus permanen dari sistem.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
