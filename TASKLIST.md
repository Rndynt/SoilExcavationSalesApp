# Soil Excavation Sales App - Task List

## Database & Schema
- [ ] Update Drizzle schema with all required models (Location, Truck, PriceRule, SaleTrip, ExpenseCategory, Expense)
- [ ] Add payment fields to SaleTrip (paymentStatus, paidAmount, paymentMethod)
- [ ] Add idempotency fields (clientId, clientCreatedAt) for offline sync
- [ ] Push schema to PostgreSQL database
- [ ] Seed initial data (DISCOUNT category, sample locations, categories)

## Backend API Routes
- [ ] Implement Location CRUD endpoints
- [ ] Implement Truck/Customer CRUD endpoints with autocomplete
- [ ] Implement PriceRule CRUD endpoints with price resolution
- [ ] Implement SaleTrip endpoints (POST, PATCH, GET, DELETE)
- [ ] Implement syncDiscountExpenseForSaleTrip logic
- [ ] Implement Expense CRUD endpoints (block manual DISCOUNT creation)
- [ ] Implement ExpenseCategory CRUD endpoints
- [ ] Implement Reports/Summary endpoint with date presets

## Frontend - Core Pages
- [ ] Update Sales Quick Log page to use API
- [ ] Add payment status, paid amount, payment method to Sales form
- [ ] Add note input to Sales form
- [ ] Add total trips counter to Sales page
- [ ] Update Sales History page with filters and edit functionality
- [ ] Update Expenses page with full CRUD
- [ ] Add inline category creation in Expenses
- [ ] Update Trucks page with totalTrips and trip history
- [ ] Update Locations page
- [ ] Update Pricing Rules page
- [ ] Update Dashboard with time filter presets (Today, Yesterday, This Week, This Month, Last Month)

## Offline Mode & Sync
- [ ] Implement IndexedDB storage for offline queue
- [ ] Add online/offline detection
- [ ] Queue SaleTrip and Expense creation when offline
- [ ] Add Sync button with status indicator
- [ ] Auto-sync when connection restored

## Documentation
- [ ] Update README with business model explanation
- [ ] Document API endpoints
- [ ] Document offline sync behavior
