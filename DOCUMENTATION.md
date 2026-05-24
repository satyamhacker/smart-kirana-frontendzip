# Smart Kirana Store — Project Documentation

**Version:** 1.0  
**Stack:** React 18 + Vite + TypeScript · Express.js · PostgreSQL · TailwindCSS  
**Language:** Hindi / English (bilingual UI)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Feature Documentation](#6-feature-documentation)
   - [Dashboard](#61-dashboard)
   - [Billing](#62-billing)
   - [Stock Management](#63-stock-management)
   - [Khata (Customer Ledger)](#64-khata-customer-ledger)
   - [Reports](#65-reports)
   - [Settings](#66-settings)
7. [Project Structure](#7-project-structure)
8. [Running the Project](#8-running-the-project)
9. [Environment Variables](#9-environment-variables)
10. [Seed Data](#10-seed-data)

---

## 1. Project Overview

**Smart Kirana Store** is a full-stack bilingual (Hindi + English) Point-of-Sale and store management web application designed for small Indian grocery (kirana) shop owners. It covers the complete day-to-day workflow of a kirana store:

- Creating customer bills at the counter
- Managing product inventory and stock levels
- Tracking udhaar (credit) and payments in a digital khata (ledger)
- Viewing sales and profit reports with date-range filtering
- Receiving low-stock and out-of-stock alerts

All data is stored in a real PostgreSQL database, making it persistent across sessions and accessible from any device.

---

## 2. Architecture

```
Browser (React SPA)
        │
        │  HTTP /api/*  (Vite dev proxy)
        ▼
Express API Server  ─────────────────────────────────────
  port 5001                                              │
        │                                      PostgreSQL DB
        │  pg Pool (DATABASE_URL)              (Replit hosted)
        └──────────────────────────────────────────────────
```

- The **React front end** (Vite, port 5000) proxies all `/api/*` requests to the Express server on port 5001.
- The **Express server** handles all CRUD operations and business logic.
- The **PostgreSQL database** stores all persistent data.
- Both servers start together via `concurrently` in a single workflow command.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Styling | TailwindCSS v4 + shadcn/ui components |
| State / data fetching | TanStack React Query v5 |
| Forms & validation | React Hook Form + Zod |
| Charts | Recharts |
| Date picker | react-day-picker |
| Routing | Wouter |
| Backend | Express.js (TypeScript via tsx) |
| Database | PostgreSQL (via `pg` Pool) |
| Monorepo | pnpm workspaces |

**Packages in workspace:**
- `@workspace/store-app` — main React + Express application
- `@workspace/api-client-react` — shared React Query hooks and TypeScript types

---

## 4. Database Schema

### `products`
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | Auto-incrementing ID |
| name | VARCHAR(255) | Product name |
| barcode | VARCHAR(255) | Barcode (optional) |
| category | VARCHAR(100) | Category (Grocery, Dairy, Snacks, etc.) |
| purchase_price | DECIMAL(10,2) | Cost price (kharida price) |
| selling_price | DECIMAL(10,2) | Sale price (beecha price) |
| current_stock | INTEGER | Current quantity in stock |
| low_stock_threshold | INTEGER | Alert threshold (default 5) |
| unit | VARCHAR(50) | Unit of measurement (pcs, kg, etc.) |
| created_at | TIMESTAMPTZ | Record creation time |

### `customers`
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | Auto-incrementing ID |
| name | VARCHAR(255) | Customer name |
| phone | VARCHAR(20) | Mobile number |
| address | TEXT | Address (optional) |
| total_due | DECIMAL(10,2) | Running balance of pending udhaar |
| created_at | TIMESTAMPTZ | Record creation time |

### `khata_transactions`
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | Auto-incrementing ID |
| customer_id | INTEGER FK → customers | Owning customer |
| type | VARCHAR(10) | `'credit'` (udhaar given) or `'payment'` (payment received) |
| amount | DECIMAL(10,2) | Transaction amount |
| description | TEXT | Note / item description |
| created_at | TIMESTAMPTZ | Transaction timestamp |

### `bills`
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | Bill number |
| customer_id | INTEGER FK → customers | Linked customer (nullable for walk-in) |
| customer_name | VARCHAR(255) | Cached customer name |
| total_amount | DECIMAL(10,2) | Sum of all items |
| discount_amount | DECIMAL(10,2) | Discount applied |
| final_amount | DECIMAL(10,2) | Amount after discount |
| payment_mode | VARCHAR(20) | `'cash'`, `'upi'`, or `'khata'` |
| created_at | TIMESTAMPTZ | Bill creation time |

### `bill_items`
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | Auto-incrementing ID |
| bill_id | INTEGER FK → bills | Parent bill |
| product_id | INTEGER FK → products | Product sold |
| quantity | INTEGER | Quantity sold |
| unit_price | DECIMAL(10,2) | Price per unit at time of sale |
| total_price | DECIMAL(10,2) | quantity × unit_price |

### `app_settings`
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | Auto-incrementing ID |
| key | VARCHAR(100) UNIQUE | Setting name |
| value | TEXT | Setting value |

---

## 5. API Reference

Base URL (development): `http://localhost:5001`  
All endpoints return JSON. Error responses: `{ "error": "<message>" }`

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List all products. Optional `?search=` query param filters by name, barcode, or category. |
| POST | `/api/products` | Create a product. Body: `{ name, barcode?, category, purchasePrice, sellingPrice, currentStock, lowStockThreshold, unit }` |
| PUT | `/api/products/:id` | Update a product. Same body as POST. |
| DELETE | `/api/products/:id` | Delete a product. |

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | List all customers. Optional `?search=` filters by name or phone. |
| POST | `/api/customers` | Create a customer. Body: `{ name, phone, address? }` |
| GET | `/api/customers/:id` | Get a single customer with full transaction history. |
| DELETE | `/api/customers/:id` | Delete a customer and all their transactions. |
| POST | `/api/customers/:id/transactions` | Add a khata transaction. Body: `{ type: 'credit'|'payment', amount, description }` |

### Bills

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/bills` | List all bills with line items, newest first. |
| POST | `/api/bills` | Create a bill. Body: `{ customerId?, items[], totalAmount, discountAmount, finalAmount, paymentMode }`. Automatically deducts stock and (if `paymentMode='khata'`) adds a khata transaction. |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Returns today's sale total, today's profit, order count, pending khata summary, low-stock list, and 10 most recent bills. |

### Reports

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/api/reports/sales` | `from`, `to` (ISO dates) | Daily sales totals and order counts for the date range. |
| GET | `/api/reports/profit` | `from`, `to` (ISO dates) | Daily revenue and profit for the date range, including margin %. |
| GET | `/api/reports/khata` | — | All customers with a pending balance, sorted by amount. |
| GET | `/api/reports/lowstock` | — | All products at or below their low-stock threshold. |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/settings` | Returns all settings as a key-value object. |
| PUT | `/api/settings` | Upsert settings. Body: `{ [key]: value }` |

---

## 6. Feature Documentation

### 6.1 Dashboard

**Route:** `/dashboard`  
**Hindi label:** डैशबोर्ड

The home screen shows the current state of the store at a glance.

**Summary Cards (top row):**
- **आज की बिक्री (Today's Sale)** — Total revenue from bills created today.
- **आज का मुनाफ़ा (Today's Profit)** — (selling price − purchase price) × quantity, minus any discounts, for all today's bills.
- **उधार बाकी (Pending Khata)** — Sum of `total_due` across all customers with a positive balance.
- **कम स्टॉक (Low Stock Alert)** — Count of products at or below their low-stock threshold; out-of-stock count shown separately.

**Recent Bills panel:** Latest 10 bills with customer name, amount, payment mode badge, and time.

**Low Stock panel:** Products sorted by stock level (lowest first) with a red "Out of Stock" or amber stock count.

---

### 6.2 Billing

**Route:** `/billing`  
**Hindi label:** बिलिंग

The point-of-sale screen for creating customer bills.

**Features:**
- **Product search** — Type to search by name, barcode, or category; select to add to cart.
- **Quantity control** — Use +/− buttons or type directly to adjust quantities.
- **Remove items** — Remove individual items from the cart.
- **Customer Picker** — Search existing customers by name or phone; or inline-add a new customer (name, phone, address) without leaving the billing screen.
- **Discount** — Enter a flat rupee discount on the whole bill.
- **Payment mode** — Select Cash, UPI, or Khata (credit). Choosing Khata links the bill to the selected customer and automatically adds a credit entry to their ledger.
- **Create Bill** — Saves the bill, deducts quantities from stock, and (if Khata) updates the customer's `total_due`.
- **Print bill** — Opens a formatted print dialog for the bill.

**Automatic side effects on bill creation:**
1. Each product's `current_stock` is decremented by the sold quantity.
2. If `paymentMode = 'khata'`, `customers.total_due` is incremented and a `khata_transactions` record is inserted.

---

### 6.3 Stock Management

**Route:** `/products`  
**Hindi label:** स्टॉक

Full CRUD management of the product catalog.

**Table columns:** Product name, barcode, category, current stock + unit, purchase price (Kharida), selling price (Beecha), profit margin %, status badge.

**Status badges:**
- **In Stock** (green) — stock > low-stock threshold
- **Low Stock** (amber) — stock ≤ threshold but > 0
- **Out of Stock** (red) — stock = 0

**Search:** Real-time server-side search by product name, barcode, or category.

**Add Product dialog fields:**
- Name, Barcode (optional), Category, Purchase Price, Selling Price, Current Stock, Low Stock Threshold, Unit (pcs / kg / litre / packet / dozen / box)

**Edit Product:** Pre-fills the same dialog with existing values; updates in place.

**Delete Product:** Confirmation prompt before deletion.

---

### 6.4 Khata (Customer Ledger)

**Route:** `/customers`  
**Hindi label:** खाता

Digital ledger system (udhaar book) for tracking credit and payments per customer.

**Customer list:**
- Shows all customers sorted alphabetically with their pending balance.
- **Due badge** shown for customers with `total_due > 0`.
- **Search box** — server-side search by name or phone (ILIKE query), reactive on every keystroke.
- Summary row: total pending amount and count.

**Add Customer dialog:** Name, Phone, Address (optional).

**Delete Customer:** Removes customer and all their transactions (CASCADE).

**Khata Ledger (dialog — opened by clicking "Khata" button):**
- Customer header with name, phone, address, and current total due.
- **Payment Mila button** — Opens inline form to record a payment received. Decrements `total_due`.
- **Udhaar Diya button** — Opens inline form to record new credit given. Increments `total_due`.
- **Running balance ledger table** — Chronological list of all transactions with a computed running balance column.
- **WhatsApp Reminder** — One-click WhatsApp message with customer's name and pending amount, pre-filled with the store's name.
- **Print Statement** — Opens a formatted print window with the full ledger.

**Transaction entry form fields:**
- Amount (₹), Description (free text), Transaction type (set automatically by which button was clicked).

---

### 6.5 Reports

**Route:** `/reports`  
**Hindi label:** रिपोर्ट

Performance analytics with flexible date-range filtering.

**Date range picker:**
- Calendar UI for selecting a custom from/to date range (powered by react-day-picker).
- **Time filter** — When the same date is selected for both from and to (single day), two time sliders appear to narrow by hour range within that day.
- Defaults to the last 30 days.

**Summary Cards:**
- **कुल बिक्री (Total Revenue)** — Sum of `final_amount` for all bills in the period.
- **कुल मुनाफ़ा (Total Profit)** — Revenue minus cost of goods sold minus discounts; shows profit margin %.
- **Pending Khata** — Total udhaar amount pending (not date-filtered; always current).
- **Low Stock Items** — Count of low/out-of-stock products (always current).

**Charts:**
- **बिक्री Trend (Daily Sales)** — Bar chart: date on X-axis, revenue on Y-axis.
- **मुनाफ़ा Trend (Profit over Time)** — Line chart: date on X-axis, profit on Y-axis.

**Pending Udhaar section:** Customers with pending balance, sorted by amount descending.

**Low Stock Alert section:** Products at or below threshold.

---

### 6.6 Settings

**Route:** `/settings`  
**Hindi label:** सेटिंग

Store configuration page. Settings are stored in the `app_settings` table and persist across sessions.

**Available settings:**
- Shop Name (used in print headers and WhatsApp messages)
- Owner Name
- Phone Number
- Address
- GST Number (optional)
- Currency symbol

---

## 7. Project Structure

```
workspace/
├── store-app/                        # Main application package
│   ├── server/
│   │   └── index.ts                  # Express API server (all routes + seeding)
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── dashboard.tsx         # Dashboard page
│   │   │   ├── billing.tsx           # Billing / POS page
│   │   │   ├── products.tsx          # Stock management page
│   │   │   ├── customers.tsx         # Khata / customer ledger page
│   │   │   ├── reports.tsx           # Reports page
│   │   │   └── settings.tsx          # Settings page
│   │   ├── App.tsx                   # Root component + routing
│   │   └── main.tsx                  # React entry point
│   ├── vite.config.ts                # Vite config + /api proxy
│   └── package.json                  # Scripts: dev, dev:api, dev:client
│
└── api-client-react/
    └── src/
        └── index.ts                  # All React Query hooks + TypeScript types
```

---

## 8. Running the Project

### Development (single command)

```bash
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/store-app run dev
```

This starts:
1. **Express API server** on port 5001 (`tsx server/index.ts`)
2. **Vite dev server** on port 5000 with HMR

Both run via `concurrently`. The Vite proxy forwards `/api/*` to `http://localhost:5001`.

### Individual scripts

```bash
# API server only
pnpm --filter @workspace/store-app run dev:api

# Vite client only
pnpm --filter @workspace/store-app run dev:client

# Production build
pnpm --filter @workspace/store-app run build
```

### First run — database seeding

On first startup, if the `products` table is empty, the server automatically seeds:
- 18 products across 7 categories
- 6 customers with transaction history
- 70+ bills spread over the past 30 days

Subsequent restarts detect existing data and skip seeding.

---

## 9. Environment Variables

| Variable | Description | Set by |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Replit (auto) |
| `PGHOST` | DB host | Replit (auto) |
| `PGPORT` | DB port | Replit (auto) |
| `PGUSER` | DB username | Replit (auto) |
| `PGPASSWORD` | DB password | Replit (auto) |
| `PGDATABASE` | DB name | Replit (auto) |
| `PORT` | Vite server port (default 5000) | Workflow command |
| `BASE_PATH` | Vite base path (default `/`) | Workflow command |
| `API_PORT` | Express API port (default 5001) | Optional override |

All database variables are provisioned automatically by Replit's PostgreSQL integration.

---

## 10. Seed Data

### Products (18 items)

| Name | Category | Buy ₹ | Sell ₹ | Stock |
|---|---|---|---|---|
| Tata Salt 1kg | Grocery | 18 | 22 | 45 |
| Aashirvaad Atta 5kg | Grocery | 195 | 225 | 12 |
| Amul Butter 100g | Dairy | 52 | 62 | 9 |
| Parle-G Biscuit 800g | Snacks | 58 | 72 | 0 (Out of Stock) |
| Surf Excel Matic 500g | Household | 85 | 105 | 20 |
| Maggi Noodles 70g | Instant Food | 12 | 15 | 35 |
| MDH Garam Masala 100g | Spices | 55 | 72 | 18 |
| Dettol Soap 125g | Personal Care | 38 | 50 | 3 (Low Stock) |
| Colgate StrongTeeth 200g | Personal Care | 65 | 85 | 25 |
| Bisleri Water 1L | Beverages | 15 | 20 | 60 |
| Haldiram Bhujia 200g | Snacks | 45 | 60 | 14 |
| Toor Dal 1kg | Pulses | 145 | 168 | 2 (Low Stock) |
| Saffola Gold Oil 1L | Oil | 155 | 182 | 8 |
| Nestle KitKat 2F | Chocolate | 22 | 30 | 40 |
| Good Day Butter Cookies 150g | Snacks | 28 | 38 | 22 |
| Lifebuoy Handwash 200ml | Personal Care | 72 | 90 | 16 |
| Kurkure Masala Munch 90g | Snacks | 18 | 25 | 50 |
| Pooja Basmati Rice 5kg | Grocery | 285 | 330 | 7 |

### Customers (6 accounts)

| Name | Phone | Address | Total Due |
|---|---|---|---|
| Ravi Kumar | 9876543210 | Gandhi Nagar | ₹450 |
| Sunita Devi | 9845123456 | Shastri Chowk | ₹0 (Clear) |
| Mohit Sharma | 9912345678 | Ram Nagar | ₹1200 |
| Priya Singh | 9867890123 | Nehru Colony | ₹0 (Clear) |
| Deepak Yadav | 9834567890 | Civil Lines | ₹850 |
| Anjali Gupta | 9878901234 | Model Town | ₹320 |

### Bills

70+ bills spread evenly over the past 30 days with varied items, payment modes (cash/UPI/khata), and occasional discounts — providing realistic chart data in the Reports page.

---

*Documentation generated for Smart Kirana Store v1.0*
