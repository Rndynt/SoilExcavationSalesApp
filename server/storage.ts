import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, gte, lte, ilike, sql, desc, isNull } from "drizzle-orm";
import {
  type User, type InsertUser,
  type Location, type InsertLocation,
  type Truck, type InsertTruck,
  type PriceRule, type InsertPriceRule,
  type ExpenseCategory, type InsertExpenseCategory,
  type Expense, type InsertExpense,
  type SaleTrip, type InsertSaleTrip,
  type AppSettings,
  users, locations, trucks, priceRules, expenseCategories, expenses, saleTrips, appSettings
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sqlClient = neon(process.env.DATABASE_URL);
export const db = drizzle(sqlClient);

export interface ExpenseFilters {
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
}

export interface SaleTripFilters {
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  plateNumber?: string;
  paymentStatus?: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<boolean>;

  getTrucks(): Promise<Truck[]>;
  getTruck(id: string): Promise<Truck | undefined>;
  getTruckByPlate(plateNumber: string): Promise<Truck | undefined>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  updateTruck(id: string, truck: Partial<InsertTruck>): Promise<Truck | undefined>;
  deleteTruck(id: string): Promise<boolean>;
  searchTrucks(query: string): Promise<Truck[]>;

  getPriceRules(locationId?: string): Promise<PriceRule[]>;
  getPriceRule(id: string): Promise<PriceRule | undefined>;
  createPriceRule(priceRule: InsertPriceRule): Promise<PriceRule>;
  updatePriceRule(id: string, priceRule: Partial<InsertPriceRule>): Promise<PriceRule | undefined>;
  deletePriceRule(id: string): Promise<boolean>;
  resolveBasePrice(locationId: string, date: string): Promise<number | null>;

  getCategories(): Promise<ExpenseCategory[]>;
  getCategory(id: string): Promise<ExpenseCategory | undefined>;
  createCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateCategory(id: string, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  getDiscountCategory(): Promise<ExpenseCategory | undefined>;

  getExpenses(filters?: ExpenseFilters): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  getSaleTrips(filters?: SaleTripFilters): Promise<SaleTrip[]>;
  getSaleTrip(id: string): Promise<SaleTrip | undefined>;
  getSaleTripByClientId(clientId: string, clientCreatedAt: string): Promise<SaleTrip | undefined>;
  createSaleTrip(saleTrip: InsertSaleTrip): Promise<SaleTrip>;
  updateSaleTrip(id: string, saleTrip: Partial<InsertSaleTrip>): Promise<SaleTrip | undefined>;
  deleteSaleTrip(id: string): Promise<boolean>;
  syncDiscountExpenseForSaleTrip(tripId: string): Promise<void>;
  
  getExpenseByClientId(clientId: string, clientCreatedAt: string): Promise<Expense | undefined>;

  getDefaultLocation(): Promise<string | null>;
  setDefaultLocation(locationId: string | null): Promise<void>;
  getSettings(): Promise<AppSettings | null>;

  getSaleSummary(locationId: string | null, dateFrom: string, dateTo: string): Promise<{
    totalTrips: number;
    totalRevenue: number;
    basePrice: number;
    totalPaid: number;
    totalUnpaid: number;
  }>;
  getExpenseSummary(locationId: string | null, dateFrom: string, dateTo: string): Promise<{
    totalExpenses: number;
    totalOperational: number;
    byCategory: { categoryId: string; categoryName: string; total: number }[];
  }>;
  getTruckSummary(truckId: string, dateFrom?: string, dateTo?: string): Promise<{
    totalTrips: number;
    totalRevenue: number;
    totalPaid: number;
  }>;

  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getLocations(): Promise<Location[]> {
    return db.select().from(locations).orderBy(locations.name);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result[0];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values(location).returning();
    return result[0];
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined> {
    const result = await db.update(locations).set(location).where(eq(locations.id, id)).returning();
    return result[0];
  }

  async deleteLocation(id: string): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id)).returning();
    return result.length > 0;
  }

  async getTrucks(): Promise<Truck[]> {
    return db.select().from(trucks).orderBy(trucks.plateNumber);
  }

  async getTruck(id: string): Promise<Truck | undefined> {
    const result = await db.select().from(trucks).where(eq(trucks.id, id));
    return result[0];
  }

  async getTruckByPlate(plateNumber: string): Promise<Truck | undefined> {
    const result = await db.select().from(trucks).where(eq(trucks.plateNumber, plateNumber));
    return result[0];
  }

  async createTruck(truck: InsertTruck): Promise<Truck> {
    const result = await db.insert(trucks).values(truck).returning();
    return result[0];
  }

  async updateTruck(id: string, truck: Partial<InsertTruck>): Promise<Truck | undefined> {
    const result = await db.update(trucks).set(truck).where(eq(trucks.id, id)).returning();
    return result[0];
  }

  async deleteTruck(id: string): Promise<boolean> {
    const result = await db.delete(trucks).where(eq(trucks.id, id)).returning();
    return result.length > 0;
  }

  async searchTrucks(query: string): Promise<Truck[]> {
    return db.select().from(trucks).where(
      or(
        ilike(trucks.plateNumber, `%${query}%`),
        ilike(trucks.contactName, `%${query}%`)
      )
    ).orderBy(trucks.plateNumber);
  }

  async getPriceRules(locationId?: string): Promise<PriceRule[]> {
    if (locationId) {
      return db.select().from(priceRules)
        .where(eq(priceRules.locationId, locationId))
        .orderBy(desc(priceRules.startDate));
    }
    return db.select().from(priceRules).orderBy(desc(priceRules.startDate));
  }

  async getPriceRule(id: string): Promise<PriceRule | undefined> {
    const result = await db.select().from(priceRules).where(eq(priceRules.id, id));
    return result[0];
  }

  async createPriceRule(priceRule: InsertPriceRule): Promise<PriceRule> {
    const result = await db.insert(priceRules).values(priceRule).returning();
    return result[0];
  }

  async updatePriceRule(id: string, priceRule: Partial<InsertPriceRule>): Promise<PriceRule | undefined> {
    const result = await db.update(priceRules).set(priceRule).where(eq(priceRules.id, id)).returning();
    return result[0];
  }

  async deletePriceRule(id: string): Promise<boolean> {
    const result = await db.delete(priceRules).where(eq(priceRules.id, id)).returning();
    return result.length > 0;
  }

  async resolveBasePrice(locationId: string, date: string): Promise<number | null> {
    const result = await db.select().from(priceRules)
      .where(
        and(
          eq(priceRules.locationId, locationId),
          eq(priceRules.isActive, true),
          lte(priceRules.startDate, date),
          or(
            isNull(priceRules.endDate),
            gte(priceRules.endDate, date)
          )
        )
      )
      .orderBy(desc(priceRules.startDate))
      .limit(1);
    return result[0]?.pricePerTrip ?? null;
  }

  async getCategories(): Promise<ExpenseCategory[]> {
    return db.select().from(expenseCategories).orderBy(expenseCategories.name);
  }

  async getCategory(id: string): Promise<ExpenseCategory | undefined> {
    const result = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    return result[0];
  }

  async createCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const result = await db.insert(expenseCategories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: string, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined> {
    const result = await db.update(expenseCategories).set(category).where(eq(expenseCategories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(expenseCategories).where(eq(expenseCategories.id, id)).returning();
    return result.length > 0;
  }

  async getDiscountCategory(): Promise<ExpenseCategory | undefined> {
    const result = await db.select().from(expenseCategories)
      .where(eq(expenseCategories.type, 'DISCOUNT'));
    return result[0];
  }

  async getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    let conditions = [];
    
    if (filters?.locationId) {
      conditions.push(eq(expenses.locationId, filters.locationId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(expenses.expenseDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(expenses.expenseDate, filters.dateTo));
    }
    if (filters?.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }

    if (conditions.length > 0) {
      return db.select().from(expenses)
        .where(and(...conditions))
        .orderBy(desc(expenses.expenseDate));
    }
    return db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  async getSaleTrips(filters?: SaleTripFilters): Promise<SaleTrip[]> {
    let conditions = [];
    
    if (filters?.locationId) {
      conditions.push(eq(saleTrips.locationId, filters.locationId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(saleTrips.transDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(saleTrips.transDate, filters.dateTo));
    }
    if (filters?.plateNumber) {
      conditions.push(ilike(saleTrips.plateNumber, `%${filters.plateNumber}%`));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(saleTrips.paymentStatus, filters.paymentStatus as 'PAID' | 'PARTIAL' | 'UNPAID'));
    }

    if (conditions.length > 0) {
      return db.select().from(saleTrips)
        .where(and(...conditions))
        .orderBy(desc(saleTrips.transDate), desc(saleTrips.createdAt));
    }
    return db.select().from(saleTrips).orderBy(desc(saleTrips.transDate), desc(saleTrips.createdAt));
  }

  async getSaleTrip(id: string): Promise<SaleTrip | undefined> {
    const result = await db.select().from(saleTrips).where(eq(saleTrips.id, id));
    return result[0];
  }

  async getSaleTripByClientId(clientId: string, clientCreatedAt: string): Promise<SaleTrip | undefined> {
    const result = await db.select().from(saleTrips).where(
      and(
        eq(saleTrips.clientId, clientId),
        eq(saleTrips.clientCreatedAt, new Date(clientCreatedAt))
      )
    );
    return result[0];
  }

  async getExpenseByClientId(clientId: string, clientCreatedAt: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(
      and(
        eq(expenses.clientId, clientId),
        eq(expenses.clientCreatedAt, new Date(clientCreatedAt))
      )
    );
    return result[0];
  }

  async createSaleTrip(saleTrip: InsertSaleTrip): Promise<SaleTrip> {
    const result = await db.insert(saleTrips).values(saleTrip).returning();
    return result[0];
  }

  async updateSaleTrip(id: string, saleTrip: Partial<InsertSaleTrip>): Promise<SaleTrip | undefined> {
    const result = await db.update(saleTrips).set(saleTrip).where(eq(saleTrips.id, id)).returning();
    return result[0];
  }

  async deleteSaleTrip(id: string): Promise<boolean> {
    const result = await db.delete(saleTrips).where(eq(saleTrips.id, id)).returning();
    return result.length > 0;
  }

  async syncDiscountExpenseForSaleTrip(tripId: string): Promise<void> {
    const trip = await this.getSaleTrip(tripId);
    if (!trip) return;

    const discountCategory = await this.getDiscountCategory();
    if (!discountCategory) return;

    const discountAmount = trip.basePrice - trip.appliedPrice;

    const existingDiscount = await db.select().from(expenses)
      .where(and(
        eq(expenses.saleTripId, tripId),
        eq(expenses.categoryId, discountCategory.id)
      ));

    if (discountAmount > 0) {
      if (existingDiscount.length > 0) {
        await db.update(expenses)
          .set({ 
            amount: discountAmount,
            expenseDate: trip.transDate,
            locationId: trip.locationId,
            relatedPlateNumber: trip.plateNumber
          })
          .where(eq(expenses.id, existingDiscount[0].id));
      } else {
        await db.insert(expenses).values({
          locationId: trip.locationId,
          expenseDate: trip.transDate,
          amount: discountAmount,
          categoryId: discountCategory.id,
          saleTripId: tripId,
          relatedPlateNumber: trip.plateNumber,
          note: `Auto discount for trip ${trip.plateNumber}`
        });
      }
    } else {
      if (existingDiscount.length > 0) {
        await db.delete(expenses).where(eq(expenses.id, existingDiscount[0].id));
      }
    }
  }

  async getDefaultLocation(): Promise<string | null> {
    const result = await db.select().from(appSettings).limit(1);
    return result[0]?.defaultLocationId ?? null;
  }

  async setDefaultLocation(locationId: string | null): Promise<void> {
    const existing = await db.select().from(appSettings).limit(1);
    if (existing.length > 0) {
      await db.update(appSettings)
        .set({ defaultLocationId: locationId })
        .where(eq(appSettings.id, existing[0].id));
    } else {
      await db.insert(appSettings).values({ defaultLocationId: locationId });
    }
  }

  async getSettings(): Promise<AppSettings | null> {
    const result = await db.select().from(appSettings).limit(1);
    return result[0] ?? null;
  }

  async getSaleSummary(locationId: string | null, dateFrom: string, dateTo: string): Promise<{
    totalTrips: number;
    totalRevenue: number;
    basePrice: number;
    totalPaid: number;
    totalUnpaid: number;
  }> {
    const result = await db.execute<{
      rows: {
        totalTrips: number;
        basePrice: number;
        totalRevenue: number;
        totalPaid: number;
      }[];
    }>(sql`
      select
        count(*)::int as "totalTrips",
        coalesce(sum(${saleTrips.basePrice}), 0)::int as "basePrice",
        coalesce(sum(${saleTrips.appliedPrice}), 0)::int as "totalRevenue",
        coalesce(sum(${saleTrips.paidAmount}), 0)::int as "totalPaid"
      from ${saleTrips}
      where ${saleTrips.transDate} >= ${dateFrom}
        and ${saleTrips.transDate} <= ${dateTo}
        ${locationId ? sql`and ${saleTrips.locationId} = ${locationId}` : sql``}
    `);

    const data = result.rows[0];
    return {
      totalTrips: data?.totalTrips ?? 0,
      basePrice: data?.basePrice ?? 0,
      totalRevenue: data?.totalRevenue ?? 0,
      totalPaid: data?.totalPaid ?? 0,
      totalUnpaid: (data?.totalRevenue ?? 0) - (data?.totalPaid ?? 0)
    };
  }

  async getExpenseSummary(locationId: string | null, dateFrom: string, dateTo: string): Promise<{
    totalExpenses: number;
    totalOperational: number;
    byCategory: { categoryId: string; categoryName: string; total: number }[];
  }> {
    const totalResult = await db.execute<{
      rows: { total: number }[];
    }>(sql`
      select coalesce(sum(${expenses.amount}), 0)::int as "total"
      from ${expenses}
      where ${expenses.expenseDate} >= ${dateFrom}
        and ${expenses.expenseDate} <= ${dateTo}
        ${locationId ? sql`and ${expenses.locationId} = ${locationId}` : sql``}
    `);

    const operationalResult = await db.execute<{
      rows: { total: number }[];
    }>(sql`
      select coalesce(sum(${expenses.amount}), 0)::int as "total"
      from ${expenses}
      inner join ${expenseCategories}
        on ${expenses.categoryId} = ${expenseCategories.id}
      where ${expenses.expenseDate} >= ${dateFrom}
        and ${expenses.expenseDate} <= ${dateTo}
        ${locationId ? sql`and ${expenses.locationId} = ${locationId}` : sql``}
        and ${expenseCategories.type} = 'OPERATIONAL'
    `);

    const byCategoryResult = await db.execute<{
      rows: { categoryId: string; categoryName: string; total: number }[];
    }>(sql`
      select
        ${expenses.categoryId} as "categoryId",
        ${expenseCategories.name} as "categoryName",
        coalesce(sum(${expenses.amount}), 0)::int as "total"
      from ${expenses}
      inner join ${expenseCategories}
        on ${expenses.categoryId} = ${expenseCategories.id}
      where ${expenses.expenseDate} >= ${dateFrom}
        and ${expenses.expenseDate} <= ${dateTo}
        ${locationId ? sql`and ${expenses.locationId} = ${locationId}` : sql``}
      group by ${expenses.categoryId}, ${expenseCategories.name}
    `);

    const byCategory = byCategoryResult.rows ?? [];

    return {
      totalExpenses: totalResult.rows[0]?.total ?? 0,
      totalOperational: operationalResult.rows[0]?.total ?? 0,
      byCategory: byCategory.map(c => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        total: c.total
      }))
    };
  }

  async getTruckSummary(truckId: string, dateFrom?: string, dateTo?: string): Promise<{
    totalTrips: number;
    totalRevenue: number;
    totalPaid: number;
  }> {
    const truck = await this.getTruck(truckId);
    if (!truck) {
      return { totalTrips: 0, totalRevenue: 0, totalPaid: 0 };
    }

    let conditions = [eq(saleTrips.plateNumber, truck.plateNumber)];
    
    if (dateFrom) {
      conditions.push(gte(saleTrips.transDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(saleTrips.transDate, dateTo));
    }

    const result = await db.select({
      totalTrips: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`coalesce(sum(${saleTrips.appliedPrice}), 0)::int`,
      totalPaid: sql<number>`coalesce(sum(${saleTrips.paidAmount}), 0)::int`,
    }).from(saleTrips).where(and(...conditions));

    const data = result[0];
    return {
      totalTrips: data?.totalTrips ?? 0,
      totalRevenue: data?.totalRevenue ?? 0,
      totalPaid: data?.totalPaid ?? 0
    };
  }

  async seedInitialData(): Promise<void> {
    const existingCategories = await db.select().from(expenseCategories).limit(1);
    if (existingCategories.length === 0) {
      await db.insert(expenseCategories).values({
        name: 'Discount',
        type: 'DISCOUNT',
        isActive: true,
        isSystem: true
      });

      await db.insert(expenseCategories).values([
        { name: 'Fuel', type: 'OPERATIONAL', isActive: true, isSystem: false },
        { name: 'Maintenance', type: 'OPERATIONAL', isActive: true, isSystem: false },
        { name: 'Driver Payment', type: 'PAYABLE', isActive: true, isSystem: false },
      ]);
    }

    const existingLocations = await db.select().from(locations).limit(1);
    if (existingLocations.length === 0) {
      const newLocations = await db.insert(locations).values([
        { name: 'Site A', note: 'Main excavation site', isActive: true },
        { name: 'Site B', note: 'Secondary site', isActive: true },
      ]).returning();

      if (newLocations.length > 0) {
        await this.setDefaultLocation(newLocations[0].id);

        await db.insert(priceRules).values([
          { locationId: newLocations[0].id, pricePerTrip: 150000, startDate: '2024-01-01', isActive: true },
          { locationId: newLocations[1].id, pricePerTrip: 175000, startDate: '2024-01-01', isActive: true },
        ]);
      }
    }
  }
}

export const storage = new DatabaseStorage();

storage.seedInitialData().catch(console.error);
