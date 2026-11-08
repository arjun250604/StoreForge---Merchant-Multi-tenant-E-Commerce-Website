# StoreForge India — Multi-Tenant E-Commerce SaaS Platform

StoreForge India is an enterprise-grade multi-tenant e-commerce SaaS platform built on **Next.js 14 (App Router)**, **Supabase (PostgreSQL with RLS)**, and **Razorpay Route API**. Independent merchants can launch, brand, and operate their own online stores from a single shared deployment.

---

## 🚀 Key Architectural Highlights

### 1. Multi-Tenant Edge Middleware (`src/middleware.ts`)
- **Local Development:** Routes `http://[slug].localhost:3000` $\rightarrow$ `/app/[domain]/...`.
- **Production:** Routes `https://[slug].yourplatform.com` $\rightarrow$ `/app/[domain]/...`.
- **Root Domain:** Serves SaaS marketing landing at `/` and merchant administration at `/dashboard`.
- **Automatic 404:** Unregistered tenant slugs trigger a branded storefront 404 state.

### 2. Dynamic Theming Engine (CSS Variables)
- Merchants configure brand tokens (Primary Color, Accent Color, Font Pairing, and Border Radius: sharp `0rem`, modern `0.5rem`, playful `1rem`).
- Injected at the root of `src/app/[domain]/layout.tsx` via inline custom properties (`--tenant-primary`, `--tenant-radius`).
- **Accessible Contrast:** Uses WCAG 2.1 relative luminance algorithm to dynamically flip button text between crisp white and dark slate.

### 3. Automated Split Settlement Engine (`src/lib/razorpay.ts`)
- Demonstrates Razorpay Route API `transfers` payload:
  - **Customer Payment:** 100% charged at checkout.
  - **Platform Commission:** 2% retained.
  - **Vendor Payout:** 98% settled directly to the merchant's linked account (`acc_...`).
- Includes an out-of-the-box **simulation mode** for instant end-to-end checkout and order placement without requiring live API keys.

### 4. Indian Financial & GST Compliance
- Monetary formatting strictly adheres to `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- Strict GSTIN regex verification (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).
- Itemized GST tax calculations across standard Indian slabs (`0%`, `5%`, `12%`, `18%`, `28%`).
- Standard GSTR-1 preparation ledger at `/dashboard/payouts`.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 14.2 (App Router, Server Actions, Edge Middleware) |
| **Language** | TypeScript (Strict mode, zero `any` in business logic) |
| **Styling** | Tailwind CSS, Shadcn UI (Radix Primitives), Lucide Icons |
| **State & Forms** | Zustand (persistent tenant-scoped cart), React Hook Form, Zod |
| **Database & Auth** | Supabase PostgreSQL, Row-Level Security, Custom JWT Claims |
| **Payments** | Razorpay Standard Checkout & Razorpay Route API |

---

## 📂 Project Structure

```
├── schema.sql                               # Complete PostgreSQL DDL, triggers, and RLS policies
├── scripts/seed.ts                          # Automated demo seed script
├── src/
│   ├── middleware.ts                        # Subdomain edge routing & path rewriting
│   ├── lib/
│   │   ├── razorpay.ts                      # Route split calculation & order API
│   │   ├── utils.ts                         # formatINR, contrast calculations, regexes
│   │   ├── validations.ts                   # Strict Zod schemas
│   │   └── supabase/                        # SSR & Service Role clients
│   ├── store/
│   │   ├── cart.ts                          # Tenant-scoped Zustand store
│   │   └── ui.ts                            # UI state
│   ├── components/
│   │   ├── ui/                              # Radix UI primitives
│   │   ├── storefront/                      # Product cards, grids, cart drawer, headers
│   │   └── dashboard/                       # Kanban, product sheets, KPIs, tables, sidebars
│   └── app/
│       ├── (saas-marketing)/                # Landing page & 3-step onboarding wizard
│       ├── (merchant-dashboard)/            # Overview, catalog, Kanban, theme customizer, payouts
│       └── [domain]/                        # Dynamic customer storefront & checkout
```

---

## ⚡ Quick Start

### 1. Database Setup
Execute `schema.sql` in your Supabase SQL Editor.

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
NEXT_PUBLIC_PLATFORM_COMMISSION_PERCENT=2
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Seed Demo Data (Optional)
```bash
npm run db:seed
```

---

## 🌐 Routes Overview

- **SaaS Marketing Portal:** `http://localhost:3000`
- **Merchant Onboarding:** `http://localhost:3000/register`
- **Merchant Sign In:** `http://localhost:3000/login`
- **Merchant Workspace:** `http://localhost:3000/dashboard`
  - Catalog: `/dashboard/products`
  - Orders Kanban: `/dashboard/orders`
  - Theme Customizer: `/dashboard/theme`
  - Payouts & GST: `/dashboard/payouts`
- **Tenant Customer Storefront:** `http://localhost:3000/[tenant-slug]` or `http://[tenant-slug].localhost:3000`
- **Checkout & Split Simulator:** `http://localhost:3000/[tenant-slug]/checkout`

