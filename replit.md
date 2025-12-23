# Soil Excavation Sales App

## Overview

A web application for tracking dump truck trips at soil excavation sites. The system manages sales transactions (each entry = 1 truck trip), expenses, dynamic pricing rules per location, and financial reporting. Built as a TypeScript monorepo with Express backend, React frontend, PostgreSQL database, and Drizzle ORM.

**Core business features:**
- Quick sales logging with truck plate autocomplete
- Dynamic pricing with +/- IDR 5,000 adjustments (auto-creates discount expenses)
- Multi-location support with default location preference
- Expense tracking with categories (OPERATIONAL, PAYABLE, LOAN, DISCOUNT)
- Payment status tracking (PAID, PARTIAL, UNPAID)
- Dashboard with financial summaries by time period
- **NEW**: Multi-language support (Indonesian & English)
- **NEW**: Period-based filtering (Today, Yesterday, This Week, This Month, Last Month)
- **NEW**: Export dashboard recap to HTML/PDF with detailed transaction list and financial summary
- **NEW**: Period-based expense filtering on Expenses page

## User Preferences

- Preferred communication style: Simple, everyday language
- Default language: Indonesian (Bahasa Indonesia) stored in localStorage
- Multiple language support: Indonesian and English translations across all pages

## System Architecture

### Backend (Express + TypeScript)
- **Entry point**: `server/index.ts` - Express server with JSON body parsing
- **Routes**: `server/routes.ts` - RESTful API endpoints for all entities
- **Storage**: `server/storage.ts` - Data access layer using Drizzle ORM with PostgreSQL
- **Pattern**: Repository pattern with typed interfaces for all CRUD operations

### Frontend (React + TypeScript)
- **Framework**: Vite + React with wouter for routing
- **State Management**: TanStack React Query for server state (all pages use real API hooks)
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **API Layer**: Custom hooks in `client/src/hooks/use-api.ts` wrapping React Query
- **Pages**: Dashboard, Quick Log, Sales History, Expenses, Trucks, Locations, Pricing Rules (all fully functional)
- **Localization**: LanguageContext + useTranslate hook for i18n, centralized in `client/src/lib/translations.ts`
- **Export Feature**: ExportRecapModal component for HTML/PDF export of dashboard summaries with print styling

### Database (PostgreSQL + Drizzle)
- **Schema**: `shared/schema.ts` - All table definitions with Zod validation
- **Key entities**: locations, trucks, priceRules, expenseCategories, expenses, saleTrips, appSettings
- **Enums**: expense_type (OPERATIONAL/PAYABLE/LOAN/DISCOUNT), payment_status, payment_method
- **Money storage**: Integer (IDR) to avoid floating point issues

### Key Design Decisions

**Price adjustment with auto-discount expense:**
- SaleTrip stores both `basePrice` (from price rule) and `appliedPrice` (after adjustment)
- When appliedPrice < basePrice, system auto-creates/updates a DISCOUNT expense
- Prevents double-counting in revenue calculations

**Idempotency for offline sync (future):**
- Fields `clientId` and `clientCreatedAt` prepared for offline-first sync
- Planned IndexedDB queue for offline operations

**Shared code:**
- `shared/schema.ts` contains database schema and Zod validators used by both frontend and backend

**Recent Additions (Session):**
1. **Internationalization (i18n)**:
   - LanguageContext and useTranslate hook for dynamic language switching
   - Comprehensive translations in `client/src/lib/translations.ts` (English & Indonesian)
   - Settings page with language selector (default: Indonesian)
   - All pages and components fully translated

2. **Period-Based Filtering**:
   - TIME_PRESETS utility with 5 presets: TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, LAST_MONTH
   - Date range calculation using date-fns (startOfDay, endOfDay, startOfWeek, endOfMonth, etc.)
   - Dashboard: Period selector with automatic report refresh
   - Expenses: Period-based expense filtering with same presets

3. **Export Rekapan Feature**:
   - ExportRecapModal component in `client/src/components/export-recap-modal.tsx`
   - Features: Print to PDF via browser, Download as HTML
   - Shows: Summary, Detail Sales (table), Expenses breakdown, Final Results
   - Clean, organized layout designed for readability and professional appearance
   - Uses React ref and window.print() for browser-native PDF export
   - Supports location-specific exports when location filter is selected

4. **Dummy Data for Testing (2025-12-20)**:
   - 6 sale trip transactions with varying payment statuses
   - 5 registered trucks (BK 099 MDN, BL 1234 ABC, BL 234 L, BL 8133 AD, BL 5555 XX)
   - 2 locations (Site A, Site B) with different pricing rules
   - 3 expense transactions (Bensin 150k, Maintenance 200k, Rental 500k = 850k total)
   - 3 expense categories (Operasional, Hutang, Pinjaman)
   - Trip payments: 4 PAID, 1 PARTIAL (80k outstanding), 1 UNPAID
   - Price adjustments: 2 trips with -5k to -10k discounts

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and migrations
- **drizzle-kit**: Schema push and migration management

### Frontend Libraries
- **TanStack React Query**: Server state management and caching
- **shadcn/ui + Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **date-fns**: Date manipulation and formatting
- **wouter**: Lightweight client-side routing

### Build Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Replit-specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Replit-specific dev tooling