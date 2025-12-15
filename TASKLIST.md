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

## Frontend - Connect to API (Replace Zustand Mock Store)
- [ ] Create API hooks for locations (useLocations, useLocation)
- [ ] Create API hooks for trucks (useTrucks, useTruck, useTruckSummary)
- [ ] Create API hooks for price rules (usePriceRules, useResolvePrice)
- [ ] Create API hooks for expense categories (useCategories)
- [ ] Create API hooks for expenses (useExpenses, useExpenseSummary)
- [ ] Create API hooks for sale trips (useSaleTrips, useSaleSummary)
- [ ] Create API hooks for reports (useReportsSummary)
- [ ] Create API hooks for app settings (useSettings, useDefaultLocation)

## Frontend - Sales Quick Log Page
- [ ] Update Sales page to use API hooks instead of Zustand store
- [ ] Add payment status select (PAID | PARTIAL | UNPAID)
- [ ] Add paid amount input (editable for PARTIAL)
- [ ] Add payment method select (CASH | TRANSFER | QRIS | OTHER)
- [ ] Add note input field
- [ ] Show total trips counter for selected date/location
- [ ] Implement price resolution from API
- [ ] Reset form after successful submission

## Frontend - Sales History Page
- [ ] Update to use API hooks
- [ ] Add date range filter
- [ ] Add location filter
- [ ] Add plate number filter
- [ ] Add payment status filter
- [ ] Add outstanding only toggle
- [ ] Show edit dialog for updating trips
- [ ] Show delete confirmation
- [ ] Display outstanding amount column

## Frontend - Expenses Page
- [ ] Update to use API hooks
- [ ] Add date range filter (default: today)
- [ ] Add location filter
- [ ] Add category filter
- [ ] Add type filter (OPERATIONAL | PAYABLE | LOAN)
- [ ] Show create/edit modal
- [ ] Add inline category creation button
- [ ] Block DISCOUNT type selection in forms

## Frontend - Trucks Page
- [ ] Update to use API hooks
- [ ] Show totalTrips for each truck
- [ ] Add truck detail view with trip history
- [ ] Add date range and location filters for trip history

## Frontend - Locations Page
- [ ] Update to use API hooks
- [ ] Add set as default location button
- [ ] Show default location indicator

## Frontend - Pricing Rules Page
- [ ] Update to use API hooks
- [ ] Display active and future rules clearly
- [ ] Show location name in rules list

## Frontend - Dashboard Page
- [ ] Update to use API hooks with reports/summary endpoint
- [ ] Add location selector
- [ ] Add time filter pills (Today, Yesterday, This Week, This Month, Last Month)
- [ ] Show all KPI cards:
  - Total Trips
  - Gross Revenue
  - Discounts Given
  - Net Revenue
  - Cash Collected
  - Receivables Outstanding
  - Operational Expenses
  - Profit (cash-basis and accrual)
- [ ] Ensure correct mobile ordering with Tailwind order-* utilities

## Offline Mode & Sync
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
