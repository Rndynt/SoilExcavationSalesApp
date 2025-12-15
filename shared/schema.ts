import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expenseTypeEnum = pgEnum('expense_type', ['OPERATIONAL', 'PAYABLE', 'LOAN', 'DISCOUNT']);
export const paymentStatusEnum = pgEnum('payment_status', ['PAID', 'PARTIAL', 'UNPAID']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'TRANSFER', 'QRIS', 'OTHER']);

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  note: text("note"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  defaultLocationId: varchar("default_location_id").references(() => locations.id),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({ id: true });
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

export const trucks = pgTable("trucks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plateNumber: text("plate_number").notNull().unique(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  note: text("note"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertTruckSchema = createInsertSchema(trucks).omit({ id: true });
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucks.$inferSelect;

export const priceRules = pgTable("price_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  pricePerTrip: integer("price_per_trip").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  note: text("note"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertPriceRuleSchema = createInsertSchema(priceRules).omit({ id: true });
export type InsertPriceRule = z.infer<typeof insertPriceRuleSchema>;
export type PriceRule = typeof priceRules.$inferSelect;

export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  type: expenseTypeEnum("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isSystem: boolean("is_system").notNull().default(false),
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true });
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

export const saleTrips = pgTable("sale_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  transDate: date("trans_date").notNull(),
  plateNumber: text("plate_number").notNull(),
  basePrice: integer("base_price").notNull(),
  appliedPrice: integer("applied_price").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('PAID'),
  paidAmount: integer("paid_amount").notNull().default(0),
  paymentMethod: paymentMethodEnum("payment_method"),
  note: text("note"),
  clientId: varchar("client_id"),
  clientCreatedAt: timestamp("client_created_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSaleTripSchema = createInsertSchema(saleTrips).omit({ id: true, createdAt: true });
export type InsertSaleTrip = z.infer<typeof insertSaleTripSchema>;
export type SaleTrip = typeof saleTrips.$inferSelect;

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  expenseDate: date("expense_date").notNull(),
  amount: integer("amount").notNull(),
  categoryId: varchar("category_id").notNull().references(() => expenseCategories.id),
  note: text("note"),
  saleTripId: varchar("sale_trip_id").references(() => saleTrips.id, { onDelete: 'cascade' }),
  relatedPlateNumber: text("related_plate_number"),
  clientId: varchar("client_id"),
  clientCreatedAt: timestamp("client_created_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
