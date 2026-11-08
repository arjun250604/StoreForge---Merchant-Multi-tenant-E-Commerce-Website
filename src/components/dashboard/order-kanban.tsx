"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Package, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatINR, shortOrderId, formatDateTime } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/orders";
import type { OrderWithItems } from "@/types";

interface OrderKanbanProps {
  initialOrders: OrderWithItems[];
  tenantId: string;
}

type KanbanStatus = "placed" | "packed" | "shipped";

const COLUMNS: {
  id: KanbanStatus;
  label: string;
  next: KanbanStatus | "delivered" | null;
  nextLabel: string;
  icon: React.ElementType;
  badgeVariant: string;
  headerColor: string;
}[] = [
  {
    id: "placed",
    label: "Placed",
    next: "packed",
    nextLabel: "Mark Packed",
    icon: Clock,
    badgeVariant: "placed",
    headerColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
  },
  {
    id: "packed",
    label: "Packed",
    next: "shipped",
    nextLabel: "Mark Shipped",
    icon: Package,
    badgeVariant: "packed",
    headerColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
  },
  {
    id: "shipped",
    label: "Shipped",
    next: "delivered",
    nextLabel: "Mark Delivered",
    icon: Truck,
    badgeVariant: "shipped",
    headerColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50",
  },
];

export function OrderKanban({ initialOrders, tenantId }: OrderKanbanProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [, startTransition] = useTransition();
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const getOrdersForColumn = (status: KanbanStatus) =>
    orders.filter((o) => o.status === status);

  const handleAdvanceStatus = async (
    orderId: string,
    nextStatus: KanbanStatus | "delivered"
  ) => {
    setLoadingOrderId(orderId);

    // Optimistic UI updates
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: nextStatus as any } : o
      )
    );

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus as any, tenantId);
      if (!result.success) {
        setOrders(previousOrders);
        toast.error(result.error ?? "Failed to update order status.");
      } else {
        const statusLabels: Record<string, string> = {
          packed: "Packed",
          shipped: "Shipped",
          delivered: "Delivered",
        };
        toast.success(`Order ${shortOrderId(orderId)} advanced to ${statusLabels[nextStatus]}`);
      }
      setLoadingOrderId(null);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {COLUMNS.map((column) => {
        const columnOrders = getOrdersForColumn(column.id);
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className="flex flex-col rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-50/50 dark:bg-zinc-900/50"
          >
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${column.headerColor}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <h3 className="font-semibold text-sm">{column.label}</h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-white dark:bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-foreground border border-current/20">
                {columnOrders.length}
              </span>
            </div>

            <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
              <div className="p-3 space-y-3">
                {columnOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground">No orders in this column</p>
                  </div>
                ) : (
                  columnOrders.map((order) => {
                    const address = order.shipping_address as any;
                    const isLoading = loadingOrderId === order.id;
                    const itemCount = order.order_items?.length ?? 0;

                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 space-y-2.5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
                            {shortOrderId(order.id)}
                          </span>
                          <Badge variant={column.badgeVariant as any} className="text-[10px]">
                            {column.label}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-semibold">{order.customer_name}</p>
                          {address?.city && (
                            <p className="text-xs text-muted-foreground">
                              {address.city}, {address.state} — {address.pincode}
                            </p>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-zinc-800 rounded-md px-2.5 py-1.5">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                          {order.order_items?.slice(0, 2).map((item, idx) => (
                            <span key={item.id}>
                              {idx === 0 ? ": " : ", "}
                              {item.product_title} ×{item.quantity}
                            </span>
                          ))}
                          {itemCount > 2 && (
                            <span> +{itemCount - 2} more</span>
                          )}
                        </div>

                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold font-mono tabular-nums">
                              {formatINR(Number(order.total_amount))}
                            </p>
                            <span
                              className={`text-[10px] font-medium ${
                                order.split_settlement_status === "transferred"
                                  ? "text-emerald-600"
                                  : order.split_settlement_status === "failed"
                                  ? "text-red-500"
                                  : "text-amber-600"
                              }`}
                            >
                              Split:{" "}
                              {order.split_settlement_status === "transferred"
                                ? "✓ Settled"
                                : order.split_settlement_status === "failed"
                                ? "✗ Failed"
                                : "⏳ Pending"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>

                        {column.next && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7 gap-1.5"
                            disabled={isLoading}
                            onClick={() =>
                              handleAdvanceStatus(order.id, column.next!)
                            }
                          >
                            {isLoading ? (
                              <span className="inline-block h-3 w-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                            ) : (
                              <ArrowRight className="h-3 w-3" />
                            )}
                            {column.nextLabel}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

