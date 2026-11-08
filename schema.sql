-- =============================================================================
-- StoreForge India — Complete Database Schema
-- PostgreSQL 15+ with Supabase extensions
-- Run this in your Supabase SQL Editor to initialize the schema
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE order_status AS ENUM ('placed', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE settlement_status AS ENUM ('pending', 'transferred', 'failed');
CREATE TYPE tenant_plan AS ENUM ('free', 'growth', 'pro');

-- =============================================================================
-- TABLE: tenants
-- One row per merchant/vendor. This is the root of the multi-tenant system.
-- =============================================================================

CREATE TABLE public.tenants (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Identity & ownership
    owner_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug                        TEXT NOT NULL UNIQUE
                                    CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND length(slug) BETWEEN 3 AND 30),
    display_name                TEXT NOT NULL CHECK (length(display_name) BETWEEN 2 AND 80),
    legal_business_name         TEXT NOT NULL CHECK (length(legal_business_name) BETWEEN 3 AND 200),

    -- Indian compliance
    gstin                       TEXT CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),

    -- Payments (Razorpay Route)
    razorpay_linked_account_id  TEXT CHECK (razorpay_linked_account_id IS NULL OR razorpay_linked_account_id ~ '^acc_[A-Za-z0-9]{14}$'),

    -- Dynamic branding tokens
    logo_url                    TEXT,
    banner_url                  TEXT,
    primary_color               TEXT NOT NULL DEFAULT '#6366f1' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    accent_color                TEXT NOT NULL DEFAULT '#f43f5e' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
    font_pairing                TEXT NOT NULL DEFAULT 'inter' CHECK (font_pairing IN ('inter', 'jakarta', 'poppins', 'raleway', 'nunito')),
    border_radius               TEXT NOT NULL DEFAULT 'modern' CHECK (border_radius IN ('sharp', 'modern', 'playful')),
    announcement_bar_text       TEXT,

    -- Status & Billing
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    plan                        tenant_plan NOT NULL DEFAULT 'free'
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_tenants_slug ON public.tenants (slug);
CREATE INDEX idx_tenants_owner_id ON public.tenants (owner_id);

-- =============================================================================
-- TABLE: categories
-- Product categories scoped to each tenant
-- =============================================================================

CREATE TABLE public.categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
    slug            TEXT NOT NULL,
    description     TEXT,
    image_url       TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_categories_tenant_id ON public.categories (tenant_id);
CREATE INDEX idx_categories_tenant_active ON public.categories (tenant_id, is_active);

-- =============================================================================
-- TABLE: products
-- Product catalog entries scoped to each tenant
-- =============================================================================

CREATE TABLE public.products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,

    -- Core fields
    title           TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
    slug            TEXT NOT NULL,
    description     TEXT,

    -- Pricing (stored in rupees as NUMERIC(12,2))
    mrp             NUMERIC(12, 2) NOT NULL CHECK (mrp > 0),
    selling_price   NUMERIC(12, 2) NOT NULL CHECK (selling_price > 0 AND selling_price <= mrp),

    -- Indian tax compliance
    gst_slab        INTEGER NOT NULL DEFAULT 0 CHECK (gst_slab IN (0, 5, 12, 18, 28)),

    -- Inventory
    sku             TEXT,
    stock_count     INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),

    -- Media & metadata
    images          TEXT[] NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    tags            TEXT[] NOT NULL DEFAULT '{}',

    UNIQUE (tenant_id, slug)
);

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_products_tenant_id ON public.products (tenant_id);
CREATE INDEX idx_products_tenant_active ON public.products (tenant_id, is_active);
CREATE INDEX idx_products_tenant_category ON public.products (tenant_id, category_id);
CREATE INDEX idx_products_stock ON public.products (tenant_id, stock_count) WHERE stock_count < 5;
CREATE INDEX idx_products_title_trgm ON public.products USING GIN (title gin_trgm_ops);

-- =============================================================================
-- TABLE: orders
-- Customer orders placed on tenant storefronts
-- =============================================================================

CREATE TABLE public.orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id               UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Customer info
    customer_name           TEXT NOT NULL,
    customer_email          TEXT,
    customer_phone          TEXT NOT NULL,
    shipping_address        JSONB NOT NULL,

    -- Financials (in rupees)
    subtotal                NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    gst_amount              NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
    total_amount            NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),

    -- Fulfilment status
    status                  order_status NOT NULL DEFAULT 'placed',

    -- Razorpay integration
    razorpay_order_id       TEXT UNIQUE,
    razorpay_payment_id     TEXT UNIQUE,
    razorpay_signature      TEXT,
    payment_status          payment_status NOT NULL DEFAULT 'pending',

    -- Razorpay Route split settlement
    split_settlement_status settlement_status NOT NULL DEFAULT 'pending',

    notes                   TEXT
);

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_orders_tenant_id ON public.orders (tenant_id);
CREATE INDEX idx_orders_tenant_status ON public.orders (tenant_id, status);
CREATE INDEX idx_orders_tenant_payment ON public.orders (tenant_id, payment_status);
CREATE INDEX idx_orders_razorpay_order_id ON public.orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX idx_orders_created_at ON public.orders (tenant_id, created_at DESC);

-- =============================================================================
-- TABLE: order_items
-- Line items for each order
-- =============================================================================

CREATE TABLE public.order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

    -- Snapshot at purchase time
    product_title   TEXT NOT NULL,
    product_sku     TEXT,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0),
    gst_slab        INTEGER NOT NULL DEFAULT 0 CHECK (gst_slab IN (0, 5, 12, 18, 28)),
    line_total      NUMERIC(12, 2) NOT NULL CHECK (line_total > 0)
);

CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_order_items_tenant_id ON public.order_items (tenant_id);
CREATE INDEX idx_order_items_product_id ON public.order_items (product_id);

-- =============================================================================
-- STORED PROCEDURES & RPC FUNCTIONS
-- =============================================================================

-- Safely decrement stock on order placement
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock_count = GREATEST(0, stock_count - p_quantity)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant record by slug
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(p_slug TEXT)
RETURNS SETOF public.tenants AS $$
    SELECT * FROM public.tenants WHERE slug = p_slug AND is_active = TRUE LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get KPI summary for a tenant
CREATE OR REPLACE FUNCTION public.get_tenant_kpis(p_tenant_id UUID)
RETURNS TABLE (
    gross_revenue   NUMERIC,
    paid_revenue    NUMERIC,
    active_orders   BIGINT,
    low_stock_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(o.total_amount), 0) AS gross_revenue,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS paid_revenue,
        COUNT(CASE WHEN o.status IN ('placed', 'packed', 'shipped') THEN 1 END) AS active_orders,
        (SELECT COUNT(*) FROM public.products p WHERE p.tenant_id = p_tenant_id AND p.stock_count < 5 AND p.is_active = TRUE) AS low_stock_count
    FROM public.orders o
    WHERE o.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.tenants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ── tenants ──────────────────────────────────────────────────────────────────
-- Merchants can manage their own tenant
CREATE POLICY "merchant_own_tenant" ON public.tenants
    FOR ALL TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Public can view active tenant stores
CREATE POLICY "public_read_active_tenants" ON public.tenants
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE);

-- ── categories ───────────────────────────────────────────────────────────────
-- Merchant isolation: only access rows matching JWT tenant_id
CREATE POLICY "merchant_manage_own_categories" ON public.categories
    FOR ALL TO authenticated
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Public can view active categories
CREATE POLICY "public_read_active_categories" ON public.categories
    FOR SELECT TO anon
    USING (is_active = TRUE);

-- ── products ──────────────────────────────────────────────────────────────────
-- Merchant isolation: only access rows matching JWT tenant_id
CREATE POLICY "merchant_manage_own_products" ON public.products
    FOR ALL TO authenticated
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Public storefront: shoppers can view active products
CREATE POLICY "public_read_active_products" ON public.products
    FOR SELECT TO anon
    USING (is_active = TRUE);

-- ── orders ────────────────────────────────────────────────────────────────────
-- Merchant isolation: only access orders for their tenant
CREATE POLICY "merchant_manage_own_orders" ON public.orders
    FOR ALL TO authenticated
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Anonymous shoppers can INSERT orders
CREATE POLICY "public_insert_orders" ON public.orders
    FOR INSERT TO anon
    WITH CHECK (TRUE);

-- ── order_items ───────────────────────────────────────────────────────────────
-- Merchant isolation: only read items for their tenant
CREATE POLICY "merchant_read_own_order_items" ON public.order_items
    FOR SELECT TO authenticated
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Anonymous shoppers can INSERT order items
CREATE POLICY "public_insert_order_items" ON public.order_items
    FOR INSERT TO anon
    WITH CHECK (TRUE);
