import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { Product } from "@/types";

interface LowStockAlertProps {
  tenantId: string;
}

export async function LowStockAlert({ tenantId }: LowStockAlertProps) {
  const supabase = createSupabaseAdminClient();
  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("id, title, sku, stock_count")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .lt("stock_count", 5)
    .order("stock_count", { ascending: true })
    .limit(10);

  const products = (lowStockProducts ?? []) as Pick<
    Product,
    "id" | "title" | "sku" | "stock_count"
  >[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Low Stock Alerts (stock &lt; 5)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              All inventory levels healthy!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {product.title}
                  </p>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {product.sku}
                    </p>
                  )}
                </div>
                <Badge
                  variant={product.stock_count === 0 ? "destructive" : "warning"}
                  className="flex-shrink-0"
                >
                  {product.stock_count === 0
                    ? "Out of Stock"
                    : `${product.stock_count} left`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

