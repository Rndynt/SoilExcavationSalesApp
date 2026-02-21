import React, { useEffect, useState } from "react";
import {
  useExpenses,
  useExpenseCategories,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
  useLocations,
  useDefaultLocation,
} from "@/hooks/use-api";
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
import { Receipt, Plus, Filter, Truck, Loader2, MoreVertical, Edit2, Trash2, Calendar, MapPin, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTranslate } from "@/hooks/use-translate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

import { id, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/language-context";

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
    default:
      start = startOfMonth(now);
      end = endOfMonth(now);
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
  const { language } = useLanguage();
  const locale = language === "id" ? id : enUS;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [period, setPeriod] = useState<string>("THIS_MONTH");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    const [start, end] = getDateRange("THIS_MONTH" as TimePeriod);
    return { from: start, to: end };
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit State
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Form
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLocationId, setNewLocationId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [editLocationId, setEditLocationId] = useState("");

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

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (categories.length > 0 && selectedCategories.length === 0) {
      const defaultSelected = categories
        .filter(c => c.type !== 'DISCOUNT')
        .map(c => c.id);
      setSelectedCategories(defaultSelected);
    }
  }, [categories]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const isLoading = expensesLoading || categoriesLoading;

  useEffect(() => {
    if (!newLocationId) {
      if (defaultLocationData?.defaultLocationId) {
        setNewLocationId(defaultLocationData.defaultLocationId);
      } else if (locations.length > 0) {
        setNewLocationId(locations[0].id);
      }
    }
  }, [defaultLocationData, locations, newLocationId]);

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== "CUSTOM") {
      const [start, end] = getDateRange(val as TimePeriod);
      setDateRange({ from: start, to: end });
    }
  };

  // Filter Logic
  const filteredExpenses = expenses.filter(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    if (!cat) return false;
    
    // Category checkbox filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(e.categoryId)) return false;
    
    if (filterType !== 'all' && cat.type !== filterType) return false;

    // Filter by date range
    if (e.expenseDate < dateRange.from || e.expenseDate > dateRange.to) return false;

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesNote = e.note?.toLowerCase().includes(lowerQuery);
      const matchesPlate = e.relatedPlateNumber?.toLowerCase().includes(lowerQuery);
      const matchesCat = cat.name.toLowerCase().includes(lowerQuery);
      if (!matchesNote && !matchesPlate && !matchesCat) return false;
    }
    
    return true;
  }).sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

  const groupedByDay = filteredExpenses.reduce((acc, exp) => {
    const day = exp.expenseDate.split('T')[0];
    if (!acc[day]) acc[day] = { expenses: [], total: 0 };
    acc[day].expenses.push(exp);
    acc[day].total += exp.amount;
    return acc;
  }, {} as Record<string, { expenses: any[]; total: number }>);

  const sortedDays = Object.entries(groupedByDay).sort((a, b) => 
    new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  // Submit Expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newCatId) return;

    if (!newLocationId) {
      toast({ title: "No location available", variant: "destructive" });
      return;
    }

    try {
      await createExpense.mutateAsync({
        locationId: newLocationId,
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
        locationId: editLocationId,
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
    setEditLocationId(expense.locationId || "");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">{t('expenses.title')}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('expenses.subtitle')}</p>
        </div>
      </div>

      <Card className="border-border shadow-sm bg-accent/20">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Collapsible open={configOpen} onOpenChange={setConfigOpen} className="space-y-4">
              <div className="flex items-center justify-between gap-4 px-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(newDate), "dd MMM yyyy", { locale })}
                  <span className="text-muted-foreground/30">•</span>
                  <MapPin className="h-3 w-3" />
                  {locations.find(l => l.id === newLocationId)?.name || "Pilih Lokasi"}
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1 uppercase font-bold tracking-wider">
                    {configOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {configOpen ? "Close" : "Change Settings"}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-4 pt-4 border-t border-dashed animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('expenses.date')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        data-testid="input-expense-date"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lokasi</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={newLocationId} onValueChange={setNewLocationId}>
                        <SelectTrigger className="pl-9 h-9" data-testid="select-expense-location">
                          <SelectValue placeholder="Pilih lokasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('expenses.amount')}</Label>
                <Input 
                  type="number" 
                  value={newAmount} 
                  onChange={e => setNewAmount(e.target.value)} 
                  required 
                  data-testid="input-amount"
                  placeholder="0"
                  className="h-9 font-mono font-bold"
                />
              </div>

              <div className="md:col-span-3 space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                  {t('expenses.category')}
                  <span 
                    className="text-[10px] text-primary cursor-pointer hover:underline font-bold"
                    onClick={() => setIsAddCatOpen(true)}
                    data-testid="link-new-category"
                  >
                    + ADD NEW
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

              <div className={`space-y-2 ${(selectedCatType === 'PAYABLE' || selectedCatType === 'LOAN') ? 'md:col-span-2' : 'md:col-span-3'}`}>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Catatan</Label>
                <Input 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  placeholder="..." 
                  data-testid="input-note"
                  className="h-9 text-xs"
                />
              </div>

              {(selectedCatType === 'PAYABLE' || selectedCatType === 'LOAN') && (
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Plat</Label>
                  <Input 
                    value={newPlate} 
                    onChange={e => setNewPlate(e.target.value)} 
                    className="h-9 text-xs uppercase font-mono font-bold" 
                    placeholder="BK 0000 XX" 
                    data-testid="input-related-plate"
                  />
                </div>
              )}

              <div className="md:col-span-2 flex items-end">
                <Button 
                  type="submit" 
                  className="w-full h-9 font-bold tracking-wide" 
                  disabled={createExpense.isPending}
                  data-testid="button-submit-expense"
                >
                  {createExpense.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      SIMPAN
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Periode</span>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PRESETS.map(p => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">{t(p.label)}</SelectItem>
                ))}
                <SelectItem value="CUSTOM" className="text-xs">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cari</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Catatan, Plat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs w-[180px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Kategori</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2 min-w-[140px] justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <span>{selectedCategories.length === categories.length ? "Semua Kategori" : `${selectedCategories.length} Terpilih`}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Filter Kategori</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[10px] font-bold" 
                        onClick={(e) => { e.stopPropagation(); setSelectedCategories(categories.map(c => c.id)); }}
                      >
                        ALL
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[10px] font-bold" 
                        onClick={(e) => { e.stopPropagation(); setSelectedCategories([]); }}
                      >
                        NONE
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 px-1 py-1.5 hover:bg-muted rounded-md cursor-pointer transition-colors" onClick={() => toggleCategory(cat.id)}>
                        <Checkbox 
                          checked={selectedCategories.includes(cat.id)} 
                          onCheckedChange={() => toggleCategory(cat.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-none">{cat.name}</span>
                          <span className="text-[9px] text-muted-foreground leading-tight font-medium uppercase">{cat.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none mb-1">Total Pengeluaran</span>
          <span className="text-xl font-mono font-bold text-primary">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
              filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
            )}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {sortedDays.map(([date, data]) => {
          const isExpanded = expandedDates[date] || false;
          
          return (
            <div key={date} className="border rounded-xl overflow-hidden bg-card shadow-md border-border">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => toggleDate(date)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm leading-tight">{format(new Date(date), "eeee, dd MMMM yyyy", { locale })}</h4>
                    <p className="text-xs font-bold text-muted-foreground leading-none">{data.expenses.length} Transaksi</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-mono font-bold text-base text-primary">
                    {new Intl.NumberFormat('id-ID').format(data.total)}
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="h-px bg-border/50 mb-3" />
                  <div className="space-y-2">
                    {data.expenses.map((expense: any) => {
                      const cat = categories.find(c => c.id === expense.categoryId);
                      const isSystem = cat?.isSystem || false;
                      
                      return (
                        <div key={expense.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-all border-b last:border-0 border-border/40">
                          <div className="grid grid-cols-[100px_1fr] gap-6 items-start min-w-0 flex-1">
                            <div className="flex flex-col shrink-0">
                              <span className="text-[13px] font-semibold text-foreground leading-tight break-words">{cat?.name}</span>
                              <span className="text-[11px] text-muted-foreground mt-1 leading-none font-medium uppercase tracking-wider">{cat?.type}</span>
                            </div>
                            <div className="flex flex-col min-w-0 border-l border-border/60 pl-3 break-words whitespace-pre-wrap">
                              <span className="text-[13px] text-foreground leading-relaxed break-words whitespace-pre-wrap">{expense.note || "-"}</span>
                              {expense.relatedPlateNumber && (
                                <span className="text-[11px] font-mono font-bold text-primary mt-2 leading-none uppercase tracking-tight">
                                  {expense.relatedPlateNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-6">
                            <span className="font-mono font-bold text-sm text-foreground">
                              {new Intl.NumberFormat('id-ID').format(expense.amount)}
                            </span>
                            <div className="w-8 flex justify-center">
                              {!isSystem && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-accent">
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem className="text-xs" onClick={(e) => { e.stopPropagation(); openEditDialog(expense); }}>
                                      <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-xs text-destructive" onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
                                          <AlertDialogDescription>Tindakan ini permanen dan tidak dapat dibatalkan.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
                                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs" onClick={() => handleDelete(expense.id)}>
                                            Hapus
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
              <Label>Lokasi</Label>
              <Select value={editLocationId} onValueChange={setEditLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
