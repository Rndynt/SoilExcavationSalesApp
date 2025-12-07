import { create } from 'zustand';
import { format } from 'date-fns';

// Types based on the prompt
export type ExpenseType = 'OPERATIONAL' | 'DEBT' | 'LOAN' | 'DISCOUNT';

export interface ExpenseCategory {
  id: string;
  name: string;
  type: ExpenseType;
}

export interface Expense {
  id: string;
  locationId: string;
  expenseDate: string; // ISO date
  amount: number;
  categoryId: string;
  note?: string;
  relatedPlateNumber?: string;
  saleTripId?: string;
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
  trips: SaleTrip[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  
  // Actions
  addTrip: (trip: Omit<SaleTrip, 'id' | 'createdAt'>) => void;
  updateTrip: (id: string, updates: Partial<SaleTrip>) => void;
  deleteTrip: (id: string) => void;
}

const DEFAULT_BASE_PRICE = 280000;

// Mock initial categories
const INITIAL_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat_1', name: 'Fuel', type: 'OPERATIONAL' },
  { id: 'cat_2', name: 'Maintenance', type: 'OPERATIONAL' },
  { id: 'cat_discount', name: 'Discount', type: 'DISCOUNT' },
];

export const useStore = create<AppState>((set, get) => ({
  trips: [],
  expenses: [],
  categories: INITIAL_CATEGORIES,

  addTrip: (tripData) => {
    set((state) => {
      const newTrip: SaleTrip = {
        ...tripData,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
      };

      // Auto-calculate discount
      const discountAmount = Math.max(0, newTrip.basePrice - newTrip.appliedPrice);
      let newExpenses = [...state.expenses];

      if (discountAmount > 0) {
        const discountCategory = state.categories.find(c => c.type === 'DISCOUNT');
        if (discountCategory) {
          newExpenses.push({
            id: Math.random().toString(36).substring(7),
            locationId: newTrip.locationId,
            expenseDate: newTrip.transDate,
            amount: discountAmount,
            categoryId: discountCategory.id,
            note: `Auto discount for SaleTrip ${newTrip.plateNumber}`,
            relatedPlateNumber: newTrip.plateNumber,
            saleTripId: newTrip.id,
          });
        }
      }

      return {
        trips: [newTrip, ...state.trips],
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

      // Recalculate discount expense
      // 1. Remove existing discount expense for this trip
      let newExpenses = state.expenses.filter(e => e.saleTripId !== id);

      // 2. Add new if needed
      const discountAmount = Math.max(0, updatedTrip.basePrice - updatedTrip.appliedPrice);
      if (discountAmount > 0) {
        const discountCategory = state.categories.find(c => c.type === 'DISCOUNT');
        if (discountCategory) {
          newExpenses.push({
            id: Math.random().toString(36).substring(7),
            locationId: updatedTrip.locationId,
            expenseDate: updatedTrip.transDate,
            amount: discountAmount,
            categoryId: discountCategory.id,
            note: `Auto discount for SaleTrip ${updatedTrip.plateNumber}`,
            relatedPlateNumber: updatedTrip.plateNumber,
            saleTripId: updatedTrip.id,
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
