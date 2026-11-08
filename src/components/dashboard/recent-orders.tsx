import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR, shortOrderId, formatDateTime } from "@/lib/utils";
import type { Order } from "@/types";

interface RecentOrdersProps {
  tenantId: string;
}

const STATUS_VARIANTS: Record<string, string> = {
  placed: "placed",
  packed: "packed",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

export async function RecentOrders({ tenantId }: RecentOrdersProps) {
  const supabase = createSupabaseAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, customer_name, shipping_address, total_amount, status, payment_status")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  const orderList = (orders ?? []) as Order[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {orderList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <p className="text-muted-foreground text-sm">No orders yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders will appear here once shoppers place checkouts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {orderList.map((order) => {
              const address = order.shipping_address as any;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                        {shortOrderId(order.id)}
                      </span>
                      <Badge
                        variant={STATUS_VARIANTS[order.status] as any}
                        className="text-[10px] px-2 py-0"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-0.5">{order.customer_name}</p>
                    {address?.city && (
                      <p className="text-xs text-muted-foreground">
                        {address.city}, {address.state}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-mono tabular-nums">
                      {formatINR(Number(order.total_amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

