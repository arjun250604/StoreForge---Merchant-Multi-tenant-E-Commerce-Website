import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductsTable } from "@/components/dashboard/products-table";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog",
};

export default async function ProductsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!tenant) redirect("/register");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("display_order"),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products?.length ?? 0} products registered
          </p>
        </div>
      </div>

      <ProductsTable
        initialProducts={products ?? []}
        categories={categories ?? []}
        tenantId={tenant.id}
      />
    </div>
  );
}

