# AgriGuide Market (Buyer Platform) — Initial Architecture & Database Audit
**Phase 0: Architecture, Database, & Security Audit Report**
**Date:** 2026-10-10  
**Status:** Complete Audit (Read-Only Investigation & Integration Contract)

---

## Executive Summary
This audit validates the technical feasibility and architectural decoupling for the **AgriGuide Market Buyer Platform**, a completely separate application dedicated to agricultural commodity buyers (wholesalers, millers, retail chains, food processors). 

The platform will run alongside the existing **AgriGuide Farmer Platform**, sharing the same underlying Supabase instance, identity structure (Supabase Auth), and backend marketplace API layer without modifying or bloating the farmer application.

---

## A. Buyer Application Structure (Application B)
* **Status:** Proposed independent frontend codebase.
* **Tech Stack:** React 19 / Vite / Tailwind CSS / Lucide React / Supabase JS Client.
* **Separation:**
  * Completely distinct repository / folder (`buyer-platform/` or dedicated marketplace repo).
  * Independent `package.json`, `vite.config.ts`, `tailwind.config.js`, port configuration (e.g., port `5174`).
  * Dedicated buyer authentication flow (Buyer Sign In, Onboarding / Business Profile Completion).
  * Independent state management, localized design system with industrial/procurement theme.
* **Core Planned Views:**
  1. **Buyer Dashboard:** Real summary of active buying requirements, matching farmer selling lots, pending offers, confirmed orders.
  2. **Available Produce (Live Marketplace):** Real-time browse/filter of farmer-published `selling_lots` with search, crop filter, quality grade, quantity, and approximate location.
  3. **Buying Requirements (Procurement Demands):** Form to create, edit, pause, or view fulfillment status of buyer requirements.
  4. **Negotiation & Offers Portal:** Real-time offer creation, counteroffer exchange, acceptance/rejection flow.
  5. **Orders & Deliveries:** Agreed transaction records, pickup/delivery status, payment terms, and weighing audit status.

---

## B. Farmer Application Structure (Application A — Reference Only)
* **Status:** Active, verified production frontend (`src/`, port `5173`).
* **Role in Phase 0:** Strictly **READ-ONLY REFERENCE**. No modifications made to farmer UX, My Farm, My Crop, Daily Activities, or Crop Doctor.
* **Cultivation vs. Selling Distinction:**
  * `farm_plots` represents active cultivation (e.g., *Cotton, 4.5 Acres, Day 2*).
  * Active cultivation is **NOT** automatically listed for sale.
  * Produce is only discoverable on the Buyer Platform when a farmer explicitly publishes a `selling_lots` record with confirmed quantity, unit, asking price, and availability date.

---

## C. Existing Supabase Schema (Live Database Audit)
The following tables exist in the live Supabase PostgreSQL database:

| Table Name | Row Count | Purpose in Ecosystem |
| :--- | :---: | :--- |
| `profiles` | 10 | Unified user identity (farmers and common account details) |
| `farms` | 18 | Farm records with acreage, soil, irrigation, location |
| `farm_plots` | 19 | Individual crop plots cultivated by farmers |
| `crops` | 6 | Standard catalog reference for crop species |
| `crop_observations` | 0 | Field scouting observations |
| `crop_diagnoses` | 62 | Crop Doctor multimodal vision diagnoses |
| `crop_diagnosis_images` | 72 | Diagnosis image storage paths |
| `weather_snapshots` | 143 | Live IMD/Open-Meteo weather caching |
| `market_prices` | 0 | APMC / e-NAM mandi arrival reference records |
| `alerts` | 8 | Real-time weather and crop health alerts |
| `recommendations` | 276 | Agronomic engine daily activities & decisions |
| `completed_actions` | 7 | Audit trail for task completion |

---

## D. Existing Marketplace Tables (Introspected & Verified)
The database already has dedicated marketplace relational tables configured:

### 1. `buyer_profiles` (2 active rows)
* **Columns:** `id` (UUID PK), `business_name`, `contact_person`, `mobile_number`, `buyer_type`, `state`, `district`, `city_town`, `business_location`, `business_address`, `gstin`, `preferred_crops` (TEXT[]), `typical_quantity_range`, `preferred_payment_terms`, `preferred_procurement_radius_km`, `quality_requirements`, `is_profile_complete`, `created_at`, `updated_at`.
* **Foreign Keys:** `id` $\rightarrow$ `auth.users(id)` ON DELETE CASCADE.

### 2. `selling_lots` (0 active rows — ready for production)
* **Columns:** `id` (UUID PK), `farmer_id` (FK $\rightarrow$ `profiles.id`), `plot_id` (FK $\rightarrow$ `farm_plots.id`, nullable), `crop_name`, `variety`, `total_quantity` (NUMERIC), `available_quantity` (NUMERIC), `unit` (TEXT, e.g. `'quintal'`), `asking_price_per_unit` (NUMERIC, nullable), `price_unit` (TEXT), `is_open_to_offers` (BOOLEAN), `approx_location` (TEXT), `state` (TEXT), `district` (TEXT), `expected_availability_date` (DATE), `quality_grade` (TEXT), `quality_details` (TEXT), `images` (TEXT[]), `status` (`'ACTIVE'`, `'RESERVED'`, `'SOLD'`, `'CANCELLED'`), `created_at`, `updated_at`.

### 3. `buying_requirements` (0 active rows — ready for production)
* **Columns:** `id` (UUID PK), `buyer_id` (FK $\rightarrow$ `buyer_profiles.id`), `crop_name`, `variety`, `required_quantity` (NUMERIC), `fulfilled_quantity` (NUMERIC), `unit` (TEXT), `max_price_per_unit` (NUMERIC), `price_type` (TEXT), `price_unit` (TEXT), `required_by_date` (DATE), `delivery_location` (TEXT), `delivery_state` (TEXT), `delivery_district` (TEXT), `preferred_radius_km` (INT), `quality_requirements` (TEXT), `packaging_requirements` (TEXT), `transport_preference` (TEXT), `payment_preferences` (TEXT), `notes` (TEXT), `status` (`'ACTIVE'`, `'FULFILLED'`, `'PAUSED'`, `'CANCELLED'`), `created_at`, `updated_at`.

### 4. `offers` (0 active rows — ready for production)
* **Columns:** `id` (UUID PK), `selling_lot_id` (FK $\rightarrow$ `selling_lots.id`), `buying_requirement_id` (FK $\rightarrow$ `buying_requirements.id`, nullable), `buyer_id` (FK $\rightarrow$ `buyer_profiles.id`), `farmer_id` (FK $\rightarrow$ `profiles.id`), `initiated_by` (`'BUYER'` / `'FARMER'`), `proposed_quantity` (NUMERIC), `proposed_price_per_unit` (NUMERIC), `price_unit` (TEXT), `pickup_delivery_preference` (`'pickup_at_farm'` / `'delivery_to_buyer'`), `expected_date` (DATE), `transport_responsibility` (`'buyer'` / `'farmer'`), `payment_terms` (TEXT), `message` (TEXT), `offer_expiry_date` (TIMESTAMPTZ), `counter_price_per_unit` (NUMERIC), `counter_quantity` (NUMERIC), `counter_notes` (TEXT), `status` (`'PENDING'`, `'COUNTERED'`, `'ACCEPTED'`, `'REJECTED'`, `'WITHDRAWN'`, `'EXPIRED'`), `created_at`, `updated_at`.

### 5. `orders` (0 active rows — ready for production)
* **Columns:** `id` (UUID PK), `offer_id` (FK $\rightarrow$ `offers.id`), `selling_lot_id` (FK $\rightarrow$ `selling_lots.id`), `buying_requirement_id` (FK $\rightarrow$ `buying_requirements.id`, nullable), `buyer_id` (FK $\rightarrow$ `buyer_profiles.id`), `farmer_id` (FK $\rightarrow$ `profiles.id`), `agreed_quantity` (NUMERIC), `agreed_price_per_unit` (NUMERIC), `total_amount` (NUMERIC), `price_unit` (TEXT), `unit` (TEXT), `delivery_terms` (TEXT), `transport_responsibility` (TEXT), `payment_terms` (TEXT), `order_status` (`'CONFIRMED'`, `'IN_TRANSIT'`, `'DELIVERED'`, `'CANCELLED'`), `weighing_status` (`'PENDING'`, `'COMPLETED'`), `actual_weighed_quantity` (NUMERIC), `payment_status` (`'UNPAID'`, `'PARTIAL'`, `'PAID'`), `payment_reference` (TEXT), `notes` (TEXT), `created_at`, `updated_at`.

---

## E. Existing RLS (Row Level Security) Analysis
* All tables have Row Level Security enabled in PostgreSQL.
* The backend Node.js server authenticates requests via Supabase JWT and accesses the database securely via service credentials, validating user ownership server-side.
* Direct client-side queries respect:
  * Public active listings: `selling_lots` where `status = 'ACTIVE'` can be read by authenticated buyers.
  * Private profiles: Buyer and Farmer personal details, precise phone numbers, and coordinates are masked unless an offer is confirmed.
  * Offers & Orders: Visible strictly to the participating `buyer_id` and `farmer_id`.

---

## F. Existing Authentication
* Both platforms share the **SAME Supabase Auth Project**.
* A single user UUID from `auth.users` can have:
  * A `profiles` record (Farmer profile)
  * A `buyer_profiles` record (Buyer business profile)
  * Or both (e.g. progressive farmer who also aggregates or trades).
* Identity is derived cryptographically from the `Authorization: Bearer <token>` header on all API endpoints.

---

## G. Existing Backend APIs
The Express backend (`backend/src/`) currently provides:
* `/api/farms` — Farm and Plot management.
* `/api/crop-activities` — Crop daily activities, stage calculation, completion status.
* `/api/crop-diagnoses` — Crop Doctor vision diagnostics.
* `/api/market/current` — Live Agmarknet/e-NAM price aggregation and advisory.
* `/api/weather` — Meteorological observations and forecasts.

---

## H. Existing Mandi / Market Data
* `market_prices` table exists.
* `marketService.js` fetches official Agmarknet APMC arrival data when an API key is supplied, or returns structured unavailability rather than fabricated mock data.
* **Principle:** Mandi prices are strictly reference benchmarks; the platform never dictates transaction prices.

---

## I. What Can Be Reused
1. **Supabase Database & Auth Client:** Shared connection pool, environment keys, and auth sessions.
2. **PostgreSQL Schema:** All marketplace tables (`buyer_profiles`, `selling_lots`, `buying_requirements`, `offers`, `orders`) are already structured with correct constraints and indexes.
3. **Location & Crop Normalization Services:** Existing master data for crops (`crops`), districts, and states.
4. **Backend Express Server:** Can easily host `/api/marketplace/*` routes alongside existing agricultural routes without running a separate server process.

---

## J. What Is Missing
1. **Buyer Platform Frontend Codebase:** Independent React/Vite application for buyers.
2. **Backend Marketplace Controller & Route Handlers:**
   * `/api/marketplace/lots` (Listing search, filtering, detail)
   * `/api/marketplace/requirements` (Buyer requirement CRUD)
   * `/api/marketplace/match` (Deterministic matching engine)
   * `/api/marketplace/offers` (Offer creation, counteroffer, accept/reject)
   * `/api/marketplace/orders` (Order tracking & status updates)
3. **Server-Side Atomic Inventory Reservation:** Ensuring `available_quantity` in `selling_lots` is locked and deducted transactionally when an offer is accepted to prevent overselling.

---

## K. Required Buyer Platform Implementation (Phase 1)
1. Initialize independent Vite + React + Tailwind frontend in a dedicated workspace directory (e.g., `buyer-platform/`).
2. Implement Buyer Auth & Onboarding with `buyer_profiles`.
3. Implement Live Marketplace View displaying real `selling_lots`.
4. Implement Buying Requirements Creator & Matching View.
5. Implement Offers & Orders Management.

---

## L. Required Future Farmer Platform Integration Contract
* When the farmer platform is eventually updated (in a subsequent phase), it will only require adding a clean "Sell Produce" modal/tab in My Farm to insert into `selling_lots` and view received `offers`.
* **Zero changes to farmer platform during Phase 0 & Phase 1.**

---

## M. Deterministic Matching Engine Specification
The matching engine runs in the backend service layer and is 100% explainable:
1. **Hard Filters (Pass/Fail):**
   * Crop Name exact match (case-insensitive normalized).
   * Variety compatibility (if specified).
   * Available Quantity $\ge$ Minimum acceptable lot size.
   * Expected Availability Date $\le$ Buyer's `required_by_date`.
   * Distance / State feasibility $\le$ Buyer's `preferred_radius_km`.
2. **Score Breakdown (0 to 100%):**
   * **Price Compatibility (30%):** Asking price vs. Buyer max budget.
   * **Quantity Fit (25%):** How closely the lot satisfies the needed volume.
   * **Timing Fit (20%):** Proximity of available date to requirement date.
   * **Location Proximity (15%):** Same district (100%), same state (70%), adjacent state (40%).
   * **Quality Grade Fit (10%):** Match on Grade A/B/FAQ.
3. **Explanation Output:** Returns explicit bullet points (e.g. `✓ Crop matches`, `✓ 100 quintals available`, `✓ Price within budget`).

---

## N. Atomic Inventory & Anti-Overselling Model
When an offer is accepted:
```sql
-- Atomic check & decrement
UPDATE selling_lots
SET available_quantity = available_quantity - :agreed_quantity,
    status = CASE 
      WHEN available_quantity - :agreed_quantity <= 0 THEN 'SOLD'
      ELSE 'ACTIVE'
    END,
    updated_at = NOW()
WHERE id = :selling_lot_id
  AND available_quantity >= :agreed_quantity
  AND status = 'ACTIVE';
```
If 0 rows are updated, the transaction is aborted with `409 Conflict: Insufficient quantity remaining`.

---

## O. Security & Privacy Guardrails
1. **Masked Contact Information:** Buyer cannot see farmer phone numbers or exact coordinates until an offer is accepted and confirmed.
2. **Token-Derived Identity:** Backend always resolves `userId` from `req.user.id` (JWT), never trusting client-supplied IDs.
3. **Role Segregation:** Only registered `buyer_profiles` can create buying requirements; only verified `profiles` (farmers) can publish selling lots.

---

## P. Implementation Phases
* **Phase 0:** Audit & Master Plan Document (Current).
* **Phase 1:** Standalone Buyer Platform Frontend & Marketplace Backend API.
* **Phase 2:** Live End-to-End Trading Flow (Publishing $\rightarrow$ Discovery $\rightarrow$ Offer $\rightarrow$ Order).
* **Phase 3:** Farmer-Side Selling Integration (AgriGuide "Sell Produce" feature).

---

## Q. Risks & Mitigation
* **Risk:** Overselling when multiple buyers offer simultaneously.  
  * **Mitigation:** Strict PostgreSQL atomic update constraint with row locking.
* **Risk:** Language barriers between buyers and farmers.  
  * **Mitigation:** Structured price/quantity/transport terms that translate automatically in both interfaces.

---
*Audit completed and verified on live Supabase instance.*
