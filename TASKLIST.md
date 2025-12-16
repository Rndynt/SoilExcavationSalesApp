# Soil Excavation Sales App - Task List

## Database & Schema
- [x] Create Drizzle schema with all required models (Location, Truck, PriceRule, SaleTrip, ExpenseCategory, Expense)
- [x] Add payment fields to SaleTrip (paymentStatus, paidAmount, paymentMethod)
- [x] Add idempotency fields (clientId, clientCreatedAt) for offline sync
- [x] Push schema to PostgreSQL database
- [x] Seed initial data (DISCOUNT category, sample locations, categories)

## Backend API Routes
- [x] Implement Location CRUD endpoints
- [x] Implement Truck/Customer CRUD endpoints with autocomplete
- [x] Implement PriceRule CRUD endpoints with price resolution
- [x] Implement SaleTrip endpoints (POST, PATCH, GET, DELETE)
- [x] Implement syncDiscountExpenseForSaleTrip logic
- [x] Implement Expense CRUD endpoints (block manual DISCOUNT creation)
- [x] Implement ExpenseCategory CRUD endpoints
- [x] Implement Reports/Summary endpoint with date presets
- [x] Implement App Settings endpoints (default location)

## Frontend - API Hooks
- [x] Create API hooks for locations (useLocations, useLocation, useCreateLocation, etc.)
- [x] Create API hooks for trucks (useTrucks, useTruck, useTruckSummary, etc.)
- [x] Create API hooks for price rules (usePriceRules, useResolvePrice, etc.)
- [x] Create API hooks for expense categories (useExpenseCategories, etc.)
- [x] Create API hooks for expenses (useExpenses, useExpenseSummary, etc.)
- [x] Create API hooks for sale trips (useSaleTrips, useSaleSummary, etc.)
- [x] Create API hooks for reports (useReportsSummary)
- [x] Create API hooks for app settings (useDefaultLocation, useSetDefaultLocation)

## Frontend - Pages Using Real API
- [x] Dashboard page - uses real API hooks
- [x] Sales Quick Log page - uses real API hooks  
- [x] Sales History page - uses real API hooks

## Frontend - Pages Still Using Mock Store (Need Conversion)
- [ ] Expenses page - convert from Zustand to API hooks
- [ ] Trucks page - convert from Zustand to API hooks
- [ ] Locations page - convert from Zustand to API hooks
- [ ] Pricing Rules page - convert from Zustand to API hooks

## Offline Mode & Sync (Future Enhancement)
- [ ] Install idb/localForage for IndexedDB
- [ ] Create offline queue storage
- [ ] Add online/offline detection hook
- [ ] Queue SaleTrip creation when offline
- [ ] Queue Expense creation when offline
- [ ] Add Sync status indicator in header
- [ ] Add manual Sync button
- [ ] Auto-sync when connection restored
- [ ] Show "Pending" badge for queued items
- [ ] Replace local pending items with server data after sync

## Documentation
- [ ] Update README with business model explanation
- [ ] Document API endpoints
- [ ] Document offline sync behavior
