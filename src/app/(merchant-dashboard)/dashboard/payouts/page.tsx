import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatINR, shortOrderId, formatDateTime } from "@/lib/utils";
import {
  Wallet,
  Building,
  Receipt,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Payouts & GST Reports",
};

export default async function PayoutsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .single();
  if (!tenant) redirect("/register");

  const COMMISSION_PERCENT = Number(process.env.NEXT_PUBLIC_PLATFORM_COMMISSION_PERCENT ?? 2);

  // Fetch orders with order_items
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const orderList = orders ?? [];

  // Financial calculations
  const totalVolume = orderList
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const platformFees = (totalVolume * COMMISSION_PERCENT) / 100;
  const netVendorPayout = totalVolume - platformFees;

  const totalGSTCollected = orderList
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.gst_amount || 0), 0);

  // GST Slab Breakdown aggregation
  const slabMap: Record<number, { taxable: number; gst: number }> = {
    0: { taxable: 0, gst: 0 },
    5: { taxable: 0, gst: 0 },
    12: { taxable: 0, gst: 0 },
    18: { taxable: 0, gst: 0 },
    28: { taxable: 0, gst: 0 },
  };

  orderList.forEach((order) => {
    if (order.payment_status === "paid" && order.order_items) {
      order.order_items.forEach((item: any) => {
        const slab = item.gst_slab || 0;
        const lineTotal = Number(item.line_total || 0);
        const gstPart = (lineTotal * slab) / (100 + slab);
        const taxablePart = lineTotal - gstPart;

        if (slabMap[slab]) {
          slabMap[slab].taxable += taxablePart;
          slabMap[slab].gst += gstPart;
        }
      });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payouts & GST Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated Razorpay Route settlements (98/2 split) and Indian GST compliance statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="h-4 w-4" /> Export GSTR-1 JSON
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Net Vendor Payout (98%)</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {formatINR(netVendorPayout)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Direct transfer to <span className="font-mono text-foreground">{tenant.razorpay_linked_account_id || "acc_TEST"}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Platform Fee ({COMMISSION_PERCENT}%)</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono tabular-nums text-orange-600">
              {formatINR(platformFees)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              StoreForge platform commission retained
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">GST Collected (Tax Liability)</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono tabular-nums text-blue-600">
              {formatINR(totalGSTCollected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              GSTIN: <span className="font-mono text-foreground">{tenant.gstin || "Unregistered"}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GST Slab Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">GST Slab Summary (Indian Tax Compliance)</CardTitle>
          </div>
          <CardDescription>
            Itemized tax liability calculated across all captured sales for standard GSTR-1 filing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-muted-foreground">
                  <th className="py-2.5 font-medium">GST Rate</th>
                  <th className="py-2.5 font-medium">Taxable Value (₹)</th>
                  <th className="py-2.5 font-medium">CGST (₹)</th>
                  <th className="py-2.5 font-medium">SGST (₹)</th>
                  <th className="py-2.5 font-medium text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono text-xs tabular-nums">
                {[0, 5, 12, 18, 28].map((rate) => {
                  const data = slabMap[rate] || { taxable: 0, gst: 0 };
                  const halfGst = data.gst / 2;
                  return (
                    <tr key={rate} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      <td className="py-2.5 font-sans font-medium">
                        <Badge variant="outline">{rate}% Slab</Badge>
                      </td>
                      <td className="py-2.5">{formatINR(data.taxable)}</td>
                      <td className="py-2.5">{formatINR(halfGst)}</td>
                      <td className="py-2.5">{formatINR(halfGst)}</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">
                        {formatINR(data.gst)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base">Settlement Transaction Ledger</CardTitle>
          </div>
          <CardDescription>
            Real-time status of Razorpay Route split disbursements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orderList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No settlements recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-muted-foreground text-xs">
                    <th className="py-2.5 font-medium">Order ID</th>
                    <th className="py-2.5 font-medium">Customer</th>
                    <th className="py-2.5 font-medium">Total Paid</th>
                    <th className="py-2.5 font-medium">Platform Fee (2%)</th>
                    <th className="py-2.5 font-medium">Vendor Payout (98%)</th>
                    <th className="py-2.5 font-medium">Route Settlement</th>
                    <th className="py-2.5 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                  {orderList.map((order) => {
                    const gross = Number(order.total_amount);
                    const fee = (gross * COMMISSION_PERCENT) / 100;
                    const payout = gross - fee;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <td className="py-3 font-mono font-bold">{shortOrderId(order.id)}</td>
                        <td className="py-3 font-medium">{order.customer_name}</td>
                        <td className="py-3 font-mono tabular-nums font-semibold">{formatINR(gross)}</td>
                        <td className="py-3 font-mono tabular-nums text-orange-600">− {formatINR(fee)}</td>
                        <td className="py-3 font-mono tabular-nums font-bold text-emerald-600">{formatINR(payout)}</td>
                        <td className="py-3">
                          {order.split_settlement_status === "transferred" ? (
                            <Badge variant="success" className="gap-1 text-[10px]">
                              <CheckCircle className="h-3 w-3" /> Transferred
                            </Badge>
                          ) : order.split_settlement_status === "failed" ? (
                            <Badge variant="destructive" className="gap-1 text-[10px]">
                              <AlertCircle className="h-3 w-3" /> Failed
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1 text-[10px]">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatDateTime(order.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

