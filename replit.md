# Smart Kirana Store

A bilingual (Hindi + English) Point-of-Sale and inventory management system for small Indian grocery (kirana) shops.

## Architecture

```
Browser (port 5000)
  └── kirana-next/   ← Next.js 15 frontend
        └── /api/*  rewrites → nest-api/ (port 3000)
                                  └── PostgreSQL (Replit DB)
```

- **Frontend:** `kirana-next/` — Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend:** `nest-api/` — NestJS 10, TypeScript, raw `pg` (no ORM), class-validator DTOs, Swagger

## Running the Project

Both workflows run in parallel when you hit **Run**:

| Workflow | Command | Port |
|---|---|---|
| Start application | `cd kirana-next && npm install && npm run dev` | 5000 |
| Start NestJS API | `cd nest-api && npm run start:dev` | 3000 |

## Key URLs

- **App:** `http://localhost:5000`
- **Swagger API Docs:** `http://localhost:3000/api/docs`

## Project Structure

```
kirana-next/                  ← Next.js frontend
├── app/
│   ├── dashboard/page.tsx    ← Today's overview (sales, khata, low stock)
│   ├── billing/page.tsx      ← POS billing interface
│   ├── products/page.tsx     ← Inventory / stock management
│   ├── customers/page.tsx    ← Customer Khata (credit) ledger
│   ├── reports/page.tsx      ← Sales & profit charts
│   ├── settings/page.tsx     ← Shop profile (saved to DB via NestJS)
│   ├── error.tsx             ← Global error boundary
│   └── */loading.tsx         ← Per-route skeleton loaders
├── components/
│   ├── layout.tsx            ← Sidebar (desktop) + bottom nav (mobile)
│   └── ui/                   ← Shadcn UI components
├── hooks/                    ← use-mobile, use-toast
└── lib/
    ├── api/                  ← Domain-split TanStack Query hooks
    │   ├── types.ts           ← All shared TypeScript types
    │   ├── fetch.ts           ← Base apiFetch() helper
    │   ├── products.ts        ← Product hooks + query keys
    │   ├── customers.ts       ← Customer/Khata hooks
    │   ├── bills.ts           ← Bill hooks
    │   ├── dashboard.ts       ← Dashboard hook
    │   ├── reports.ts         ← Report hooks
    │   ├── settings.ts        ← Settings hooks (reads/writes to DB)
    │   └── index.ts           ← Re-export barrel
    └── utils.ts               ← Tailwind cn() helper

nest-api/                     ← NestJS backend
├── src/
│   ├── main.ts               ← Bootstrap: Swagger, ValidationPipe, CORS
│   ├── app.module.ts         ← Root module (ConfigModule, all feature modules)
│   ├── config/               ← Configuration factory
│   ├── common/
│   │   ├── filters/          ← AllExceptionsFilter (structured JSON errors)
│   │   └── interceptors/     ← LoggingInterceptor (request/response logging)
│   ├── db/                   ← Global DbService (pg.Pool, initDB + seed)
│   ├── products/             ← CRUD + DTOs
│   ├── customers/            ← Customer + Khata transaction + DTOs
│   ├── bills/                ← Bill creation (stock deduction + khata entry)
│   ├── reports/              ← Sales, profit, khata, low-stock reports
│   ├── dashboard/            ← Today's summary aggregation
│   └── settings/             ← Shop settings (upsert to app_settings table)
└── .env.example              ← Required environment variables
```

## Database

PostgreSQL hosted by Replit (auto-configured via `DATABASE_URL`). Schema is created on startup by `DbService.initDB()`. Tables: `products`, `customers`, `khata_transactions`, `bills`, `bill_items`, `app_settings`.

## User Preferences

- Bilingual UI: Hindi labels first, English in parentheses
- Mobile-responsive: bottom tab nav on mobile, sidebar on desktop
- No ORM — raw SQL queries via `pg` Pool
- NestJS on port 3000, Next.js on port 5000
