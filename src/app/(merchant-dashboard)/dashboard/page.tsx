import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { KPICardsSkeleton } from "@/components/dashboard/kpi-cards-skeleton";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, display_name, slug, primary_color, razorpay_linked_account_id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) redirect("/register");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back! Here&apos;s what&apos;s happening in{" "}
          <span className="font-medium text-foreground">{tenant.display_name}</span>.
        </p>
      </div>

      <Suspense fallback={<KPICardsSkeleton />}>
        <KPICards tenantId={tenant.id} />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Suspense
            fallback={
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 h-64 skeleton" />
            }
          >
            <RecentOrders tenantId={tenant.id} />
          </Suspense>
        </div>
        <div>
          <Suspense
            fallback={
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 h-64 skeleton" />
            }
          >
            <LowStockAlert tenantId={tenant.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

