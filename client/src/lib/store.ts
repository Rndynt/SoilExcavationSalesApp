import { create } from 'zustand';
import { format, isSameDay } from 'date-fns';

// --- Types ---

export type ExpenseType = 'OPERATIONAL' | 'DEBT' | 'LOAN' | 'DISCOUNT';
export type ExpenseStatus = 'PAID' | 'UNPAID';

export interface Location {
  id: string;
  name: string;
  note?: string;
  isActive: boolean;
}

export interface Truck {
  id: string;
  plateNumber: string;
  driverName?: string;
  driverPhone?: string;
  note?: string;
  isActive: boolean;
}

export interface PriceRule {
  id: string;
  locationId: string;
  pricePerTrip: number;
  startDate: string; // ISO Date
  endDate?: string;
  note?: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  type: ExpenseType;
  isActive: boolean;
  isSystem?: boolean; // True for DISCOUNT
}

export interface Expense {
  id: string;
  locationId: string;
  expenseDate: string; // ISO date
  amount: number;
  categoryId: string;
  note?: string;
  relatedPlateNumber?: string;
  saleTripId?: string; // Link for discounts
  status?: ExpenseStatus; // For DEBT/LOAN
  dueDate?: string; // For DEBT/LOAN
}

export interface SaleTrip {
  id: string;
  locationId: string;
  transDate: string; // ISO date
  plateNumber: string;
  basePrice: number;
  appliedPrice: number;
  createdAt: string;
}

export interface AppState {
  // Data
  locations: Location[];
  trucks: Truck[];
  priceRules: PriceRule[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  trips: SaleTrip[];
  
  // User Preferences (Mock)
  defaultLocationId: string;
  setDefaultLocation: (id: string) => void;

  // Actions: Locations
  addLocation: (loc: Omit<Location, 'id'>) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // Actions: Trucks
  addTruck: (truck: Omit<Truck, 'id'>) => void;
  updateTruck: (id: string, updates: Partial<Truck>) => void;
  deleteTruck: (id: string) => void;

  // Actions: Price Rules
  addPriceRule: (rule: Omit<PriceRule, 'id'>) => void;
  updatePriceRule: (id: string, updates: Partial<PriceRule>) => void;
  deletePriceRule: (id: string) => void;
  resolveBasePrice: (locationId: string, date: string) => number;

  // Actions: Categories
  addCategory: (cat: Omit<ExpenseCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;

  // Actions: Expenses
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Actions: Sales
  addTrip: (trip: Omit<SaleTrip, 'id' | 'createdAt'>) => void;
  updateTrip: (id: string, updates: Partial<SaleTrip>) => void;
  deleteTrip: (id: string) => void;
}

// --- Mock Initial Data ---

const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc_1', name: 'Jakarta HQ', isActive: true },
  { id: 'loc_2', name: 'Surabaya Hub', isActive: true },
];

const INITIAL_TRUCKS: Truck[] = [
  { id: 't_1', plateNumber: 'B 1234 XYZ', driverName: 'Budi', isActive: true },
  { id: 't_2', plateNumber: 'L 5678 ABC', driverName: 'Santoso', isActive: true },
  { id: 't_3', plateNumber: 'B 9999 DOG', driverName: 'Anjing', isActive: true },
];

const INITIAL_RULES: PriceRule[] = [
  { id: 'pr_1', locationId: 'loc_1', pricePerTrip: 280000, startDate: '2025-01-01', isActive: true },
  { id: 'pr_2', locationId: 'loc_2', pricePerTrip: 250000, startDate: '2025-01-01', isActive: true },
];

const INITIAL_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat_fuel', name: 'Fuel', type: 'OPERATIONAL', isActive: true },
  { id: 'cat_maint', name: 'Maintenance', type: 'OPERATIONAL', isActive: true },
  { id: 'cat_salary', name: 'Driver Salary', type: 'OPERATIONAL', isActive: true },
  { id: 'cat_debt', name: 'Driver Debt', type: 'DEBT', isActive: true },
  { id: 'cat_loan', name: 'Bank Loan', type: 'LOAN', isActive: true },
  { id: 'cat_disc', name: 'Discount', type: 'DISCOUNT', isActive: true, isSystem: true },
];

// --- Store Implementation ---

export const useStore = create<AppState>((set, get) => ({
  locations: INITIAL_LOCATIONS,
  trucks: INITIAL_TRUCKS,
  priceRules: INITIAL_RULES,
  categories: INITIAL_CATEGORIES,
  expenses: [],
  trips: [],
  defaultLocationId: 'loc_1',

  setDefaultLocation: (id) => set({ defaultLocationId: id }),

  // --- Locations ---
  addLocation: (loc) => set(state => ({ 
    locations: [...state.locations, { ...loc, id: Math.random().toString(36).substr(2, 9) }] 
  })),
  updateLocation: (id, updates) => set(state => ({
    locations: state.locations.map(l => l.id === id ? { ...l, ...updates } : l)
  })),
  deleteLocation: (id) => set(state => ({
    locations: state.locations.filter(l => l.id !== id)
  })),

  // --- Trucks ---
  addTruck: (truck) => set(state => ({
    trucks: [...state.trucks, { ...truck, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateTruck: (id, updates) => set(state => ({
    trucks: state.trucks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  deleteTruck: (id) => set(state => ({
    trucks: state.trucks.filter(t => t.id !== id)
  })),

  // --- Price Rules ---
  addPriceRule: (rule) => set(state => ({
    priceRules: [...state.priceRules, { ...rule, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updatePriceRule: (id, updates) => set(state => ({
    priceRules: state.priceRules.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  deletePriceRule: (id) => set(state => ({
    priceRules: state.priceRules.filter(r => r.id !== id)
  })),
  resolveBasePrice: (locationId, date) => {
    // Simple logic: find active rule for location. 
    // In real app, would check date ranges.
    const rules = get().priceRules.filter(r => r.locationId === locationId && r.isActive);
    return rules.length > 0 ? rules[0].pricePerTrip : 280000;
  },

  // --- Categories ---
  addCategory: (cat) => set(state => ({
    categories: [...state.categories, { ...cat, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateCategory: (id, updates) => set(state => ({
    categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteCategory: (id) => set(state => ({
    categories: state.categories.filter(c => c.id !== id)
  })),

  // --- Expenses ---
  addExpense: (exp) => set(state => ({
    expenses: [...state.expenses, { ...exp, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateExpense: (id, updates) => set(state => ({
    expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  deleteExpense: (id) => set(state => ({
    expenses: state.expenses.filter(e => e.id !== id)
  })),

  // --- Sales (Trips) with Auto-Discount Logic ---
  addTrip: (tripData) => {
    set((state) => {
      const newTrip: SaleTrip = {
        ...tripData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };

      // Auto-calculate discount
      const discountAmount = Math.max(0, newTrip.basePrice - newTrip.appliedPrice);
      let newExpenses = [...state.expenses];

      if (discountAmount > 0) {
        const discountCategory = state.categories.find(c => c.type === 'DISCOUNT');
        if (discountCategory) {
          newExpenses.push({
            id: Math.random().toString(36).substr(2, 9),
            locationId: newTrip.locationId,
            expenseDate: newTrip.transDate,
            amount: discountAmount,
            categoryId: discountCategory.id,
            note: `Auto discount for SaleTrip ${newTrip.plateNumber}`,
            relatedPlateNumber: newTrip.plateNumber,
            saleTripId: newTrip.id,
            status: 'PAID', // Discounts are technically "realized" immediately
          });
        }
      }

      return {
        trips: [newTrip, ...state.trips], // prepend for recent log view
        expenses: newExpenses,
      };
    });
  },

  updateTrip: (id, updates) => {
    set((state) => {
      const tripIndex = state.trips.findIndex(t => t.id === id);
      if (tripIndex === -1) return state;

      const oldTrip = state.trips[tripIndex];
      const updatedTrip = { ...oldTrip, ...updates };
      
      const newTrips = [...state.trips];
      newTrips[tripIndex] = updatedTrip;

      // Sync Discount Expense
      // 1. Remove ANY existing discount expense linked to this trip
      let newExpenses = state.expenses.filter(e => e.saleTripId !== id);

      // 2. Add new if needed
      const discountAmount = Math.max(0, updatedTrip.basePrice - updatedTrip.appliedPrice);
      if (discountAmount > 0) {
        const discountCategory = state.categories.find(c => c.type === 'DISCOUNT');
        if (discountCategory) {
          newExpenses.push({
            id: Math.random().toString(36).substr(2, 9),
            locationId: updatedTrip.locationId,
            expenseDate: updatedTrip.transDate,
            amount: discountAmount,
            categoryId: discountCategory.id,
            note: `Auto discount for SaleTrip ${updatedTrip.plateNumber}`,
            relatedPlateNumber: updatedTrip.plateNumber,
            saleTripId: updatedTrip.id,
            status: 'PAID',
          });
        }
      }

      return {
        trips: newTrips,
        expenses: newExpenses,
      };
    });
  },

  deleteTrip: (id) => {
    set((state) => ({
      trips: state.trips.filter(t => t.id !== id),
      expenses: state.expenses.filter(e => e.saleTripId !== id), // Cascade delete discount
    }));
  },
}));
