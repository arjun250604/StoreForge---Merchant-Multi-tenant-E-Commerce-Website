import { Suspense } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/storefront/product-grid";
import { CategoryPills } from "@/components/storefront/category-pills";
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";
import type { Tenant, Category } from "@/types";

interface StorefrontPageProps {
  params: { domain: string };
  searchParams: { category?: string; q?: string };
}

async function getTenantWithCategories(slug: string) {
  const supabase = createSupabaseAdminClient();

  const [tenantResult, categoriesResult] = await Promise.all([
    supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  return {
    tenant: tenantResult.data as Tenant | null,
    categories: (categoriesResult.data ?? []) as Category[],
  };
}

export default async function StorefrontPage({
  params,
  searchParams,
}: StorefrontPageProps) {
  const { tenant, categories } = await getTenantWithCategories(params.domain);

  if (!tenant) return null;

  const tenantCategories = categories.filter((c) => c.tenant_id === tenant.id);

  return (
    <div>
      {/* Hero Banner */}
      {tenant.banner_url ? (
        <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={tenant.banner_url}
            alt={`${tenant.display_name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
            <div className="page-container pb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                {tenant.display_name}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-40 sm:h-56 flex items-center justify-center"
          style={{ backgroundColor: `${tenant.primary_color}15` }}
        >
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              {tenant.display_name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover our latest collection
            </p>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="page-container mt-8">
        <CategoryPills
          categories={tenantCategories}
          selectedCategory={searchParams.category}
        />
      </div>

      {/* Product Grid */}
      <div className="page-container mt-6 pb-16">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid
            tenantId={tenant.id}
            tenantSlug={params.domain}
            selectedCategory={searchParams.category}
            searchQuery={searchParams.q}
          />
        </Suspense>
      </div>
    </div>
  );
}
