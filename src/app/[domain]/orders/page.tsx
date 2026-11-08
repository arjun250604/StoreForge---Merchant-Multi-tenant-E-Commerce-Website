"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Package,
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR, shortOrderId, formatDateTime } from "@/lib/utils";

interface OrdersPageProps {
  params: { domain: string };
}

export default function CustomerOrdersLookupPage({ params }: OrdersPageProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[] | null>(null);

  const handleLookupByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customer/orders?slug=${params.domain}&phone=${cleanPhone}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to find orders.");
        setOrders([]);
      } else {
        setOrders(data.orders || []);
        if ((data.orders || []).length === 0) {
          toast.info("No orders found for this mobile number.");
        }
      }
    } catch {
      toast.error("Error looking up orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupById = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderIdInput.trim().replace(/^#/, "");
    if (!id) {
      toast.error("Please enter an Order ID.");
      return;
    }
    router.push(`/${params.domain}/orders/${id}`);
  };

  return (
    <div className="page-container py-12 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/${params.domain}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
      </div>

      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center text-primary mb-2">
          <Package className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Order Portal</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Track live delivery status, view invoices, and review order receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Lookup by Phone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Find by Mobile Number</CardTitle>
            <CardDescription>View all orders placed with your phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookupByPhone} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    +91
                  </span>
                  <Input
                    id="phone"
                    placeholder="9876543210"
                    className="pl-11 font-mono"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Find My Orders
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lookup by Order ID */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Track Specific Order</CardTitle>
            <CardDescription>Enter your 8-digit Order reference ID</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookupById} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="e.g. #A1B2C3D4 or UUID"
                  className="font-mono uppercase"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" className="w-full gap-2">
                Track Order
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Orders List Result */}
      {orders !== null && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-lg font-semibold">Your Recent Orders ({orders.length})</h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No orders found for +91 {phone}. Check that the phone number matches your checkout details.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{shortOrderId(order.id)}</span>
                        <Badge
                          variant={
                            order.status === "shipped" || order.status === "delivered"
                              ? "success"
                              : order.status === "packed"
                              ? "warning"
                              : "placed"
                          }
                          className="capitalize text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Placed on {formatDateTime(order.created_at)}
                      </p>
                      <p className="text-sm font-semibold font-mono tabular-nums">
                        Total: {formatINR(Number(order.total_amount))}
                      </p>
                    </div>

                    <Button asChild size="sm" className="w-full sm:w-auto gap-1.5">
                      <Link href={`/${params.domain}/orders/${order.id}`}>
                        Track Progress & Receipt
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

