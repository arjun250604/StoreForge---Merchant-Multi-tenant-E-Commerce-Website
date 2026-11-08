import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrderKanban } from "@/components/dashboard/order-kanban";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Fulfilment",
};

export default async function OrdersPage() {
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

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("tenant_id", tenant.id)
    .in("status", ["placed", "packed", "shipped"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Fulfilment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive Kanban workflow: Placed → Packed → Shipped.
        </p>
      </div>
      <OrderKanban
        initialOrders={(orders ?? []) as any}
        tenantId={tenant.id}
      />
    </div>
  );
}

