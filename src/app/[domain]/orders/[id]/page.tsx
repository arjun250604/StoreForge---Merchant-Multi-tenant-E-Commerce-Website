import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatINR, shortOrderId, formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  ArrowLeft,
  Printer,
  Receipt,
  MapPin,
  CreditCard,
} from "lucide-react";
import { PrintReceiptButton } from "@/components/storefront/print-receipt-button";
import type { OrderWithItems, Tenant } from "@/types";

interface CustomerOrderDetailPageProps {
  params: { domain: string; id: string };
}

const STAGES = [
  { id: "placed", label: "Order Placed", icon: Clock },
  { id: "packed", label: "Packed & Ready", icon: Package },
  { id: "shipped", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStageIndex(status: string) {
  switch (status) {
    case "placed": return 0;
    case "packed": return 1;
    case "shipped": return 2;
    case "delivered": return 3;
    default: return 0;
  }
}

export default async function CustomerOrderDetailPage({
  params,
}: CustomerOrderDetailPageProps) {
  const supabase = createSupabaseAdminClient();

  // 1. Resolve tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, display_name, gstin, logo_url, primary_color")
    .eq("slug", params.domain)
    .single();

  if (!tenant) notFound();

  // 2. Fetch order with order_items (supports full UUID or short 8-char lookup)
  let orderQuery = supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("tenant_id", tenant.id);

  if (params.id.length === 36) {
    orderQuery = orderQuery.eq("id", params.id);
  } else {
    // Lookup by short ID prefix
    orderQuery = orderQuery.ilike("id", `${params.id.toLowerCase()}%`);
  }

  const { data: orderData, error } = await orderQuery.single();

  if (error || !orderData) {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We couldn&apos;t locate an order matching ID &quot;{params.id}&quot; on {tenant.display_name}.
        </p>
        <Button asChild>
          <Link href={`/${params.domain}/orders`}>
            Back to Orders Portal
          </Link>
        </Button>
      </div>
    );
  }

  const order = orderData as OrderWithItems;
  const address = order.shipping_address as any;
  const currentStage = getStageIndex(order.status);

  return (
    <div className="page-container py-10 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/${params.domain}/orders`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Orders
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Order <span className="font-mono text-primary">{shortOrderId(order.id)}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Placed on {formatDateTime(order.created_at)} at {tenant.display_name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintReceiptButton />
          <Badge
            variant={
              order.status === "delivered" || order.status === "shipped"
                ? "success"
                : order.status === "packed"
                ? "warning"
                : "placed"
            }
            className="text-xs capitalize py-1 px-3"
          >
            Status: {order.status}
          </Badge>
        </div>
      </div>

      {/* Visual Fulfilment Pipeline Stepper */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCompleted = idx <= currentStage;
              const isCurrent = idx === currentStage;

              return (
                <div key={stage.id} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent ? "text-primary font-bold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] text-primary/80 font-medium">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Itemized Invoice */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Order Receipt</CardTitle>
                </div>
                {tenant.gstin && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    GSTIN: {tenant.gstin}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.product_title}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × {formatINR(Number(item.unit_price))} (Incl. {item.gst_slab}% GST)
                      </p>
                      {item.product_sku && (
                        <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.product_sku}</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-sm tabular-nums flex-shrink-0">
                      {formatINR(Number(item.line_total))}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal (Inclusive of GST)</span>
                  <span className="font-mono tabular-nums">{formatINR(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Tax Included (GST)</span>
                  <span className="font-mono tabular-nums">{formatINR(Number(order.gst_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Standard Shipping</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total Amount Paid</span>
                <span className="font-mono tabular-nums text-primary">
                  {formatINR(Number(order.total_amount))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Shipping & Payment Summary */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Delivery Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5 text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">{order.customer_name}</p>
              <p>+91 {order.customer_phone}</p>
              <Separator className="my-2" />
              <p>{address?.address_line_1}</p>
              {address?.address_line_2 && <p>{address.address_line_2}</p>}
              {address?.landmark && <p className="italic">Near {address.landmark}</p>}
              <p className="font-semibold text-foreground pt-1">
                {address?.city}, {address?.state} — <span className="font-mono">{address?.pincode}</span>
              </p>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm">Payment Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge variant="success" className="text-[10px] uppercase">
                  {order.payment_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Settlement Method:</span>
                <span className="font-medium text-foreground">Razorpay Route</span>
              </div>
              {order.razorpay_order_id && (
                <div className="pt-1">
                  <span className="text-[10px] text-muted-foreground block">Ref ID:</span>
                  <span className="font-mono text-[10px] text-foreground">{order.razorpay_order_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button asChild variant="outline" className="w-full text-xs">
            <Link href={`/${params.domain}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

