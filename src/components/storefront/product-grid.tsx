import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ProductCard } from "./product-card";
import type { Product } from "@/types";
import { ShoppingBag } from "lucide-react";

interface ProductGridProps {
  tenantId: string;
  tenantSlug: string;
  selectedCategory?: string;
  searchQuery?: string;
}

export async function ProductGrid({
  tenantId,
  tenantSlug,
  selectedCategory,
  searchQuery,
}: ProductGridProps) {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (selectedCategory) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", selectedCategory)
      .single();

    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data: products } = await query.limit(60);
  const productList = (products ?? []) as Product[];

  if (productList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-primary/60" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search term.`
            : selectedCategory
            ? "No products in this category yet."
            : "This store doesn't have any products yet. Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {productList.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          tenantSlug={tenantSlug}
        />
      ))}
    </div>
  );
}

