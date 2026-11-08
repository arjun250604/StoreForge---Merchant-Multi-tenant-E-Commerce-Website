import React from "react";
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

interface KPICardsProps {
  tenantId: string;
}

interface KPIData {
  grossRevenue: number;
  netPayout: number;
  activeOrders: number;
  lowStockCount: number;
}

async function getKPIs(tenantId: string): Promise<KPIData> {
  const supabase = createSupabaseAdminClient();
  const COMMISSION = Number(process.env.NEXT_PUBLIC_PLATFORM_COMMISSION_PERCENT ?? 2);

  const [ordersResult, lowStockResult] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount, status, payment_status")
      .eq("tenant_id", tenantId),
    supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .lt("stock_count", 5),
  ]);

  const orders = ordersResult.data ?? [];
  const grossRevenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const netPayout = grossRevenue * (1 - COMMISSION / 100);
  const activeOrders = orders.filter((o) =>
    ["placed", "packed", "shipped"].includes(o.status)
  ).length;

  return {
    grossRevenue,
    netPayout,
    activeOrders,
    lowStockCount: lowStockResult.count ?? 0,
  };
}

export async function KPICards({ tenantId }: KPICardsProps) {
  const kpis = await getKPIs(tenantId);

  const cards = [
    {
      label: "Total Gross Revenue",
      value: formatINR(kpis.grossRevenue),
      sublabel: "From captured customer payments",
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Net Payout (98%)",
      value: formatINR(kpis.netPayout),
      sublabel: "After 2% platform fee settlement",
      icon: Wallet,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Active Orders",
      value: kpis.activeOrders.toString(),
      sublabel: "Placed + Packed + Shipped",
      icon: ShoppingBag,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
    },
    {
      label: "Low-Stock Alerts",
      value: kpis.lowStockCount.toString(),
      sublabel: "SKUs with stock < 5 units",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.sublabel}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

