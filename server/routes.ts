import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertLocationSchema, insertTruckSchema, insertPriceRuleSchema, insertExpenseCategorySchema, insertExpenseSchema, insertSaleTripSchema } from "@shared/schema";
import { z } from "zod";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, format, parseISO, isValid } from "date-fns";

function getDateRange(preset: string): { dateFrom: string; dateTo: string } {
  const today = new Date();
  let dateFrom: Date;
  let dateTo: Date;

  switch (preset) {
    case 'TODAY':
      dateFrom = startOfDay(today);
      dateTo = endOfDay(today);
      break;
    case 'YESTERDAY':
      const yesterday = subDays(today, 1);
      dateFrom = startOfDay(yesterday);
      dateTo = endOfDay(yesterday);
      break;
    case 'THIS_WEEK':
      dateFrom = startOfWeek(today, { weekStartsOn: 1 });
      dateTo = endOfWeek(today, { weekStartsOn: 1 });
      break;
    case 'THIS_MONTH':
      dateFrom = startOfMonth(today);
      dateTo = endOfMonth(today);
      break;
    case 'LAST_MONTH':
      const lastMonth = subMonths(today, 1);
      dateFrom = startOfMonth(lastMonth);
      dateTo = endOfMonth(lastMonth);
      break;
    default:
      dateFrom = startOfDay(today);
      dateTo = endOfDay(today);
  }

  return {
    dateFrom: format(dateFrom, 'yyyy-MM-dd'),
    dateTo: format(dateTo, 'yyyy-MM-dd')
  };
}

function logRouteError(route: string, error: unknown) {
  console.error(`[api] ${route} failed`, error);
}

export async function registerRoutes(app: Express): Promise<void> {

  app.get("/api/locations", async (_req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      logRouteError("GET /api/locations", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", async (req: Request, res: Response) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      logRouteError("GET /api/locations/:id", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", async (req: Request, res: Response) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(data);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("POST /api/locations", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.patch("/api/locations/:id", async (req: Request, res: Response) => {
    try {
      const data = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(req.params.id, data);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("PATCH /api/locations/:id", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteLocation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.status(204).send();
    } catch (error) {
      logRouteError("DELETE /api/locations/:id", error);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  app.get("/api/trucks", async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      if (search && typeof search === 'string') {
        const trucks = await storage.searchTrucks(search);
        return res.json(trucks);
      }
      const trucks = await storage.getTrucks();
      res.json(trucks);
    } catch (error) {
      logRouteError("GET /api/trucks", error);
      res.status(500).json({ message: "Failed to fetch trucks" });
    }
  });

  app.get("/api/trucks/:id", async (req: Request, res: Response) => {
    try {
      const truck = await storage.getTruck(req.params.id);
      if (!truck) {
        return res.status(404).json({ message: "Truck not found" });
      }
      res.json(truck);
    } catch (error) {
      logRouteError("GET /api/trucks/:id", error);
      res.status(500).json({ message: "Failed to fetch truck" });
    }
  });

  app.get("/api/trucks/:id/summary", async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const summary = await storage.getTruckSummary(
        req.params.id,
        dateFrom as string | undefined,
        dateTo as string | undefined
      );
      res.json(summary);
    } catch (error) {
      logRouteError("GET /api/trucks/:id/summary", error);
      res.status(500).json({ message: "Failed to fetch truck summary" });
    }
  });

  app.post("/api/trucks", async (req: Request, res: Response) => {
    try {
      const data = insertTruckSchema.parse(req.body);
      const existing = await storage.getTruckByPlate(data.plateNumber);
      if (existing) {
        return res.status(409).json({ message: "Truck with this plate number already exists" });
      }
      const truck = await storage.createTruck(data);
      res.status(201).json(truck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("POST /api/trucks", error);
      res.status(500).json({ message: "Failed to create truck" });
    }
  });

  app.patch("/api/trucks/:id", async (req: Request, res: Response) => {
    try {
      const data = insertTruckSchema.partial().parse(req.body);
      if (data.plateNumber) {
        const existing = await storage.getTruckByPlate(data.plateNumber);
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ message: "Truck with this plate number already exists" });
        }
      }
      const truck = await storage.updateTruck(req.params.id, data);
      if (!truck) {
        return res.status(404).json({ message: "Truck not found" });
      }
      res.json(truck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("PATCH /api/trucks/:id", error);
      res.status(500).json({ message: "Failed to update truck" });
    }
  });

  app.delete("/api/trucks/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTruck(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Truck not found" });
      }
      res.status(204).send();
    } catch (error) {
      logRouteError("DELETE /api/trucks/:id", error);
      res.status(500).json({ message: "Failed to delete truck" });
    }
  });

  app.get("/api/price-rules", async (req: Request, res: Response) => {
    try {
      const { locationId } = req.query;
      const rules = await storage.getPriceRules(locationId as string | undefined);
      res.json(rules);
    } catch (error) {
      logRouteError("GET /api/price-rules", error);
      res.status(500).json({ message: "Failed to fetch price rules" });
    }
  });

  app.get("/api/price-rules/resolve", async (req: Request, res: Response) => {
    try {
      const { locationId, date } = req.query;
      if (!locationId || !date) {
        return res.status(400).json({ message: "locationId and date are required" });
      }
      const price = await storage.resolveBasePrice(locationId as string, date as string);
      res.json({ price });
    } catch (error) {
      logRouteError("GET /api/price-rules/resolve", error);
      res.status(500).json({ message: "Failed to resolve price" });
    }
  });

  app.get("/api/price-rules/:id", async (req: Request, res: Response) => {
    try {
      const rule = await storage.getPriceRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: "Price rule not found" });
      }
      res.json(rule);
    } catch (error) {
      logRouteError("GET /api/price-rules/:id", error);
      res.status(500).json({ message: "Failed to fetch price rule" });
    }
  });

  app.post("/api/price-rules", async (req: Request, res: Response) => {
    try {
      const data = insertPriceRuleSchema.parse(req.body);
      const rule = await storage.createPriceRule(data);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("POST /api/price-rules", error);
      res.status(500).json({ message: "Failed to create price rule" });
    }
  });

  app.patch("/api/price-rules/:id", async (req: Request, res: Response) => {
    try {
      const data = insertPriceRuleSchema.partial().parse(req.body);
      const rule = await storage.updatePriceRule(req.params.id, data);
      if (!rule) {
        return res.status(404).json({ message: "Price rule not found" });
      }
      res.json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("PATCH /api/price-rules/:id", error);
      res.status(500).json({ message: "Failed to update price rule" });
    }
  });

  app.delete("/api/price-rules/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePriceRule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Price rule not found" });
      }
      res.status(204).send();
    } catch (error) {
      logRouteError("DELETE /api/price-rules/:id", error);
      res.status(500).json({ message: "Failed to delete price rule" });
    }
  });

  app.get("/api/expense-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      logRouteError("GET /api/expense-categories", error);
      res.status(500).json({ message: "Failed to fetch expense categories" });
    }
  });

  app.get("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      logRouteError("GET /api/expense-categories/:id", error);
      res.status(500).json({ message: "Failed to fetch expense category" });
    }
  });

  app.post("/api/expense-categories", async (req: Request, res: Response) => {
    try {
      const data = insertExpenseCategorySchema.parse(req.body);
      if (data.type === 'DISCOUNT') {
        return res.status(400).json({ message: "Cannot manually create DISCOUNT category" });
      }
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("POST /api/expense-categories", error);
      res.status(500).json({ message: "Failed to create expense category" });
    }
  });

  app.patch("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getCategory(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      if (existing.isSystem) {
        return res.status(400).json({ message: "Cannot modify system category" });
      }
      const data = insertExpenseCategorySchema.partial().parse(req.body);
      if (data.type === 'DISCOUNT') {
        return res.status(400).json({ message: "Cannot change type to DISCOUNT" });
      }
      const category = await storage.updateCategory(req.params.id, data);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("PATCH /api/expense-categories/:id", error);
      res.status(500).json({ message: "Failed to update expense category" });
    }
  });

  app.delete("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getCategory(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      if (existing.isSystem) {
        return res.status(400).json({ message: "Cannot delete system category" });
      }
      const deleted = await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      logRouteError("DELETE /api/expense-categories/:id", error);
      res.status(500).json({ message: "Failed to delete expense category" });
    }
  });

  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      const { locationId, dateFrom, dateTo, categoryId } = req.query;
      const expenses = await storage.getExpenses({
        locationId: locationId as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        categoryId: categoryId as string | undefined
      });
      res.json(expenses);
    } catch (error) {
      logRouteError("GET /api/expenses", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/summary", async (req: Request, res: Response) => {
    try {
      const { locationId, dateFrom, dateTo } = req.query;
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "dateFrom and dateTo are required" });
      }
      const summary = await storage.getExpenseSummary(
        locationId as string | null,
        dateFrom as string,
        dateTo as string
      );
      res.json(summary);
    } catch (error) {
      logRouteError("GET /api/expenses/summary", error);
      res.status(500).json({ message: "Failed to fetch expense summary" });
    }
  });

  app.get("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      logRouteError("GET /api/expenses/:id", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      
      // Idempotency check for offline sync
      if (data.clientId && data.clientCreatedAt) {
        const existing = await storage.getExpenseByClientId(
          data.clientId,
          data.clientCreatedAt.toISOString ? data.clientCreatedAt.toISOString() : String(data.clientCreatedAt)
        );
        if (existing) {
          return res.status(200).json(existing);
        }
      }
      
      const category = await storage.getCategory(data.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }
      if (category.type === 'DISCOUNT') {
        return res.status(400).json({ message: "Cannot manually create DISCOUNT expense" });
      }
      const expense = await storage.createExpense(data);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("POST /api/expenses", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getExpense(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Expense not found" });
      }
      const existingCategory = await storage.getCategory(existing.categoryId);
      if (existingCategory?.type === 'DISCOUNT') {
        return res.status(400).json({ message: "Cannot manually edit DISCOUNT expense" });
      }
      const data = insertExpenseSchema.partial().parse(req.body);
      if (data.categoryId) {
        const category = await storage.getCategory(data.categoryId);
        if (category?.type === 'DISCOUNT') {
          return res.status(400).json({ message: "Cannot change category to DISCOUNT" });
        }
      }
      const expense = await storage.updateExpense(req.params.id, data);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("PATCH /api/expenses/:id", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getExpense(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Expense not found" });
      }
      const existingCategory = await storage.getCategory(existing.categoryId);
      if (existingCategory?.type === 'DISCOUNT') {
        return res.status(400).json({ message: "Cannot manually delete DISCOUNT expense" });
      }
      const deleted = await storage.deleteExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      logRouteError("DELETE /api/expenses/:id", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  app.get("/api/sale-trips", async (req: Request, res: Response) => {
    try {
      const { locationId, dateFrom, dateTo, plateNumber, paymentStatus } = req.query;
      const trips = await storage.getSaleTrips({
        locationId: locationId as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        plateNumber: plateNumber as string | undefined,
        paymentStatus: paymentStatus as string | undefined
      });
      res.json(trips);
    } catch (error) {
      logRouteError("GET /api/sale-trips", error);
      res.status(500).json({ message: "Failed to fetch sale trips" });
    }
  });

  app.get("/api/sale-trips/summary", async (req: Request, res: Response) => {
    try {
      const { locationId, dateFrom, dateTo } = req.query;
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "dateFrom and dateTo are required" });
      }
      const summary = await storage.getSaleSummary(
        locationId as string | null,
        dateFrom as string,
        dateTo as string
      );
      res.json(summary);
    } catch (error) {
      logRouteError("GET /api/sale-trips/summary", error);
      res.status(500).json({ message: "Failed to fetch sale trips summary" });
    }
  });

  app.get("/api/sale-trips/:id", async (req: Request, res: Response) => {
    try {
      const trip = await storage.getSaleTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Sale trip not found" });
      }
      res.json(trip);
    } catch (error) {
      logRouteError("GET /api/sale-trips/:id", error);
      res.status(500).json({ message: "Failed to fetch sale trip" });
    }
  });

  app.post("/api/sale-trips", async (req: Request, res: Response) => {
    try {
      const data = insertSaleTripSchema.parse(req.body);
      
      // Idempotency check for offline sync
      if (data.clientId && data.clientCreatedAt) {
        const existing = await storage.getSaleTripByClientId(
          data.clientId,
          data.clientCreatedAt.toISOString ? data.clientCreatedAt.toISOString() : String(data.clientCreatedAt)
        );
        if (existing) {
          return res.status(200).json(existing);
        }
      }
      
      let basePrice = data.basePrice;
      if (!basePrice) {
        const resolvedPrice = await storage.resolveBasePrice(data.locationId, data.transDate);
        if (!resolvedPrice) {
          return res.status(400).json({ message: "No price rule found for this location and date" });
        }
        basePrice = resolvedPrice;
      }
      
      let appliedPrice = data.appliedPrice ?? basePrice;
      let paidAmount = data.paidAmount ?? 0;
      let paymentStatus = data.paymentStatus ?? 'PAID';
      
      if (paymentStatus === 'PAID') {
        paidAmount = appliedPrice;
      } else if (paymentStatus === 'UNPAID') {
        paidAmount = 0;
      } else if (paymentStatus === 'PARTIAL') {
        if (paidAmount <= 0) {
          paidAmount = 0;
          paymentStatus = 'UNPAID';
        } else if (paidAmount >= appliedPrice) {
          paidAmount = appliedPrice;
          paymentStatus = 'PAID';
        }
      }
      
      const trip = await storage.createSaleTrip({
        ...data,
        basePrice,
        appliedPrice,
        paidAmount,
        paymentStatus
      });
      
      await storage.syncDiscountExpenseForSaleTrip(trip.id);
      
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("POST /api/sale-trips", error);
      res.status(500).json({ message: "Failed to create sale trip" });
    }
  });

  app.patch("/api/sale-trips/:id", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getSaleTrip(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Sale trip not found" });
      }
      
      const data = insertSaleTripSchema.partial().parse(req.body);
      
      let appliedPrice = data.appliedPrice ?? existing.appliedPrice;
      let paidAmount = data.paidAmount ?? existing.paidAmount;
      let paymentStatus = data.paymentStatus ?? existing.paymentStatus;
      
      if (paymentStatus === 'PAID') {
        paidAmount = appliedPrice;
      } else if (paymentStatus === 'UNPAID') {
        paidAmount = 0;
      } else if (paymentStatus === 'PARTIAL') {
        if (paidAmount <= 0) {
          paidAmount = 0;
          paymentStatus = 'UNPAID';
        } else if (paidAmount >= appliedPrice) {
          paidAmount = appliedPrice;
          paymentStatus = 'PAID';
        }
      }
      
      const trip = await storage.updateSaleTrip(req.params.id, {
        ...data,
        appliedPrice,
        paidAmount,
        paymentStatus
      });
      
      if (trip) {
        await storage.syncDiscountExpenseForSaleTrip(trip.id);
      }
      
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      logRouteError("PATCH /api/sale-trips/:id", error);
      res.status(500).json({ message: "Failed to update sale trip" });
    }
  });

  app.delete("/api/sale-trips/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteSaleTrip(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Sale trip not found" });
      }
      res.status(204).send();
    } catch (error) {
      logRouteError("DELETE /api/sale-trips/:id", error);
      res.status(500).json({ message: "Failed to delete sale trip" });
    }
  });

  app.get("/api/reports/summary", async (req: Request, res: Response) => {
    try {
      const { preset, locationId, dateFrom: qDateFrom, dateTo: qDateTo } = req.query;
      
      let dateFrom: string;
      let dateTo: string;
      
      if (preset && typeof preset === 'string') {
        const range = getDateRange(preset);
        dateFrom = range.dateFrom;
        dateTo = range.dateTo;
      } else if (qDateFrom && qDateTo) {
        dateFrom = qDateFrom as string;
        dateTo = qDateTo as string;
      } else {
        const range = getDateRange('TODAY');
        dateFrom = range.dateFrom;
        dateTo = range.dateTo;
      }
      
      const [saleSummary, expenseSummary] = await Promise.all([
        storage.getSaleSummary(locationId as string | null, dateFrom, dateTo),
        storage.getExpenseSummary(locationId as string | null, dateFrom, dateTo)
      ]);
      
      const totalDiscounts = saleSummary.basePrice - saleSummary.totalRevenue;
      
      res.json({
        dateFrom,
        dateTo,
        sales: {
          totalTrips: saleSummary.totalTrips,
          grossRevenue: saleSummary.basePrice,
          totalDiscounts: Math.max(0, totalDiscounts),
          netRevenue: saleSummary.totalRevenue,
          cashCollected: saleSummary.totalPaid,
          receivables: saleSummary.totalUnpaid
        },
        expenses: {
          totalExpenses: expenseSummary.totalExpenses,
          totalOperational: expenseSummary.totalOperational,
          byCategory: expenseSummary.byCategory
        },
        netIncome: saleSummary.totalRevenue - expenseSummary.totalOperational
      });
    } catch (error) {
      logRouteError("GET /api/reports/summary", error);
      res.status(500).json({ message: "Failed to fetch report summary" });
    }
  });

  app.get("/api/reports/dashboard", async (req: Request, res: Response) => {
    try {
      const { from, to, locationId } = req.query;
      if (!from || !to) {
        return res.status(400).json({ message: "from and to are required" });
      }

      const parsedFrom = parseISO(from as string);
      const parsedTo = parseISO(to as string);
      if (!isValid(parsedFrom) || !isValid(parsedTo)) {
        return res.status(400).json({ message: "from and to must be valid dates" });
      }

      const dateFrom = format(startOfDay(parsedFrom), "yyyy-MM-dd");
      const dateTo = format(endOfDay(parsedTo), "yyyy-MM-dd");

      const [saleSummary, expenseSummary, trips, expenses, categories] = await Promise.all([
        storage.getSaleSummary(locationId as string | null, dateFrom, dateTo),
        storage.getExpenseSummary(locationId as string | null, dateFrom, dateTo),
        storage.getSaleTrips({
          locationId: locationId as string | undefined,
          dateFrom,
          dateTo
        }),
        storage.getExpenses({
          locationId: locationId as string | undefined,
          dateFrom,
          dateTo
        }),
        storage.getCategories()
      ]);

      const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
      const detailExpenses = expenses.map((expense) => ({
        ...expense,
        categoryName: categoryMap.get(expense.categoryId) ?? null
      }));

      const totalDiscounts = saleSummary.basePrice - saleSummary.totalRevenue;

      res.json({
        dateFrom,
        dateTo,
        sales: {
          totalTrips: saleSummary.totalTrips,
          grossRevenue: saleSummary.basePrice,
          totalDiscounts: Math.max(0, totalDiscounts),
          netRevenue: saleSummary.totalRevenue,
          cashCollected: saleSummary.totalPaid,
          receivables: saleSummary.totalUnpaid
        },
        expenses: {
          totalExpenses: expenseSummary.totalExpenses,
          totalOperational: expenseSummary.totalOperational,
          byCategory: expenseSummary.byCategory
        },
        trips,
        detailExpenses
      });
    } catch (error) {
      logRouteError("GET /api/reports/dashboard", error);
      res.status(500).json({ message: "Failed to fetch report dashboard" });
    }
  });

  app.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      const defaultLocationId = await storage.getDefaultLocation();
      res.json({ defaultLocationId, ...settings });
    } catch (error) {
      logRouteError("GET /api/settings", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/default-location", async (_req: Request, res: Response) => {
    try {
      const defaultLocationId = await storage.getDefaultLocation();
      res.json({ defaultLocationId });
    } catch (error) {
      logRouteError("GET /api/settings/default-location", error);
      res.status(500).json({ message: "Failed to fetch default location" });
    }
  });

  app.put("/api/settings/default-location", async (req: Request, res: Response) => {
    try {
      const { locationId } = req.body;
      if (locationId !== null && locationId !== undefined) {
        const location = await storage.getLocation(locationId);
        if (!location) {
          return res.status(400).json({ message: "Invalid location" });
        }
      }
      await storage.setDefaultLocation(locationId ?? null);
      res.json({ defaultLocationId: locationId ?? null });
    } catch (error) {
      logRouteError("PUT /api/settings/default-location", error);
      res.status(500).json({ message: "Failed to update default location" });
    }
  });

  app.patch("/api/settings", async (req: Request, res: Response) => {
    try {
      const { defaultLocationId } = req.body;
      if (defaultLocationId !== null && defaultLocationId !== undefined) {
        const location = await storage.getLocation(defaultLocationId);
        if (!location) {
          return res.status(400).json({ message: "Invalid location" });
        }
      }
      await storage.setDefaultLocation(defaultLocationId ?? null);
      res.json({ defaultLocationId: defaultLocationId ?? null });
    } catch (error) {
      logRouteError("PATCH /api/settings", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

}
