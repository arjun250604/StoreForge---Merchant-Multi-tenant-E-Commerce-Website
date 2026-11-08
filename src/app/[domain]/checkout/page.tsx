"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Info,
  CheckCircle2,
  Loader2,
  Package,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { formatINR } from "@/lib/utils";
import { checkoutFormSchema, type CheckoutFormData } from "@/lib/validations";
import { createOrder } from "@/app/actions/orders";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

interface CheckoutPageProps {
  params: { domain: string };
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter();
  const { items, tenantId, getSubtotal, getGSTBreakdown, getTotalWithGST, clearCart } =
    useCartStore();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string } | null>(null);
  const [vendorAccountId, setVendorAccountId] = useState<string>("acc_XXXXXXXXXX");

  const COMMISSION_PERCENT = Number(
    process.env.NEXT_PUBLIC_PLATFORM_COMMISSION_PERCENT ?? 2
  );

  const subtotal = getSubtotal();
  const { total: gstAmount } = getGSTBreakdown();
  const total = getTotalWithGST();

  const platformCommission = Math.round((total * COMMISSION_PERCENT) / 100 * 100) / 100;
  const vendorPayout = Math.round((total - platformCommission) * 100) / 100;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      pincode: "",
      city: "",
      state: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
    },
  });

  useEffect(() => {
    if (!params.domain) return;
    fetch(`/api/tenant/${params.domain}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.razorpay_linked_account_id) {
          setVendorAccountId(data.razorpay_linked_account_id);
        }
      })
      .catch(() => {});
  }, [params.domain]);

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="page-container py-16 text-center">
        <ShoppingCart
          className="mx-auto h-16 w-16 text-muted-foreground mb-6"
          strokeWidth={1.5}
        />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">
          Add some products to your cart before checking out.
        </p>
        <Button asChild>
          <a href={`/${params.domain}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </a>
        </Button>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="page-container py-16 text-center max-w-lg mx-auto">
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Placed! 🎉</h2>
        <p className="text-muted-foreground mb-4">
          Your order has been confirmed and is being processed.
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-800 px-4 py-2 font-mono text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="tabular-nums font-medium">
            #{orderPlaced.orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="gap-2"
          >
            <Link href={`/${params.domain}/orders/${orderPlaced.orderId}`}>
              Track Order Status Live
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/${params.domain}`)}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!tenantId) {
      toast.error("Cart error. Please refresh and try again.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const result = await createOrder({
        tenantId,
        customerName: data.fullName,
        customerPhone: data.phone,
        customerEmail: data.email || null,
        shippingAddress: {
          full_name: data.fullName,
          phone: data.phone,
          pincode: data.pincode,
          city: data.city,
          state: data.state,
          address_line_1: data.addressLine1,
          address_line_2: data.addressLine2,
          landmark: data.landmark,
        },
        items: items.map((item) => ({
          productId: item.productId,
          productTitle: item.title,
          productSku: item.sku,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          gstSlab: item.gstSlab,
          lineTotal: item.sellingPrice * item.quantity,
        })),
        subtotal,
        gstAmount,
        totalAmount: total,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to place order. Please try again.");
        return;
      }

      clearCart();
      setOrderPlaced({ orderId: result.orderId! });
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="page-container py-8 pb-16">
      <div className="mb-6">
        <a
          href={`/${params.domain}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to store
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Rahul Sharma"
                      {...register("fullName")}
                      className={errors.fullName ? "border-red-500" : ""}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        +91
                      </span>
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        className={`pl-11 ${errors.phone ? "border-red-500" : ""}`}
                        {...register("phone")}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="rahul@example.com"
                    {...register("email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Flat / House No., Building Name, Street"
                    {...register("addressLine1")}
                    className={errors.addressLine1 ? "border-red-500" : ""}
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-red-500">{errors.addressLine1.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Area, Colony, Locality"
                    {...register("addressLine2")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="landmark">Landmark (optional)</Label>
                  <Input
                    id="landmark"
                    placeholder="Near Metro Station, Opposite Park..."
                    {...register("landmark")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="400001"
                      maxLength={6}
                      {...register("pincode")}
                      className={`font-mono ${errors.pincode ? "border-red-500" : ""}`}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-red-500">{errors.pincode.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      {...register("city")}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      {...register("state")}
                      className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        errors.state ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-xs text-red-500">{errors.state.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary + Razorpay Split */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{item.title}</p>
                          <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums font-medium flex-shrink-0">
                        {formatINR(item.sellingPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal (incl. GST)</span>
                    <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>GST included</span>
                    <span className="font-mono tabular-nums">{formatINR(gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-medium">Free</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono tabular-nums text-lg">{formatINR(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Razorpay Split Breakdown Card */}
            <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm text-blue-900 dark:text-blue-300">
                    Payment Architecture (Razorpay Route)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2.5">
                  {/* Customer Payment */}
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 p-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Pays</p>
                      <p className="text-lg font-bold font-mono tabular-nums">{formatINR(total)}</p>
                    </div>
                    <Badge variant="info">Total</Badge>
                  </div>

                  <div className="flex items-center gap-2 px-3">
                    <div className="flex-1 h-px bg-blue-200 dark:bg-blue-900/50" />
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                  </div>

                  {/* Platform Commission */}
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/30 p-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Platform Commission ({COMMISSION_PERCENT}%)
                      </p>
                      <p className="text-sm font-semibold font-mono tabular-nums text-orange-600">
                        {formatINR(platformCommission)}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-transparent">
                      Retained
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 px-3">
                    <div className="flex-1 h-px bg-blue-200 dark:bg-blue-900/50" />
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                  </div>

                  {/* Vendor Settlement */}
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/30 p-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Razorpay Route Transfer to Vendor ({100 - COMMISSION_PERCENT}%)
                      </p>
                      <p className="text-lg font-bold font-mono tabular-nums text-emerald-600">
                        {formatINR(vendorPayout)}
                      </p>
                      {vendorAccountId && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          Target: {vendorAccountId}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent">
                      Direct Payout
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Razorpay Route automatically settles vendor proceeds at capture. Works in simulated test mode out-of-the-box.
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing Order...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirm & Pay {formatINR(total)}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By confirming, order is instantly routed and updated on the merchant&apos;s Kanban board.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

