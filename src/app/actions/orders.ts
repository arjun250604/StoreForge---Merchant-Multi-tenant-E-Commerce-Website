"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  simulateRazorpayOrder,
  createRazorpayOrderWithSplit,
} from "@/lib/razorpay";
import type { ShippingAddress } from "@/types";

interface OrderItemInput {
  productId: string;
  productTitle: string;
  productSku?: string | null;
  quantity: number;
  unitPrice: number;
  gstSlab: number;
  lineTotal: number;
}

interface CreateOrderInput {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: ShippingAddress;
  items: OrderItemInput[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
}

interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  razorpayOrderId?: string;
  error?: string;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const supabase = createSupabaseAdminClient();

  const productIds = input.items.map((i) => i.productId);
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, tenant_id, stock_count, is_active")
    .in("id", productIds);

  if (productError || !products) {
    return { success: false, error: "Failed to validate products in cart." };
  }

  for (const product of products) {
    if (product.tenant_id !== input.tenantId) {
      return { success: false, error: "One or more products do not belong to this storefront." };
    }
    if (!product.is_active) {
      return { success: false, error: "A product in your cart is currently inactive." };
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, razorpay_linked_account_id, slug")
    .eq("id", input.tenantId)
    .single();

  if (tenantError || !tenant) {
    return { success: false, error: "Tenant could not be resolved." };
  }

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail ?? null,
      shipping_address: input.shippingAddress as any,
      subtotal: input.subtotal,
      gst_amount: input.gstAmount,
      total_amount: input.totalAmount,
      status: "placed",
      payment_status: "pending",
      split_settlement_status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: "Failed to record order: " + (orderError?.message || "Unknown error") };
  }

  // Insert order items
  const itemsPayload = input.items.map((item) => ({
    order_id: order.id,
    tenant_id: input.tenantId,
    product_id: item.productId,
    product_title: item.productTitle,
    product_sku: item.productSku ?? null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    gst_slab: item.gstSlab,
    line_total: item.lineTotal,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsPayload);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Failed to store order items." };
  }

  // Handle Razorpay Split
  let razorpayOrderId: string | null = null;
  const isSimulated =
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.includes("your_key") ||
    process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_your");

  const vendorAccount = tenant.razorpay_linked_account_id || "acc_SIMULATED_VENDOR";

  try {
    if (isSimulated) {
      const sim = simulateRazorpayOrder(input.totalAmount, vendorAccount, order.id);
      razorpayOrderId = sim.id;

      // Automatically mark as paid for seamless developer testing
      await supabase
        .from("orders")
        .update({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_SIM_${Date.now()}`,
          payment_status: "paid",
          split_settlement_status: "transferred",
        })
        .eq("id", order.id);
    } else {
      const liveOrder = await createRazorpayOrderWithSplit(
        input.totalAmount,
        vendorAccount,
        order.id,
        {
          tenant_slug: tenant.slug,
          customer_name: input.customerName,
        }
      );
      razorpayOrderId = liveOrder.id;

      await supabase
        .from("orders")
        .update({
          razorpay_order_id: razorpayOrderId,
        })
        .eq("id", order.id);
    }
  } catch (err: any) {
    console.error("[createOrder] Razorpay Route error:", err);
  }

  // Safely decrement stock counts
  for (const item of input.items) {
    await supabase.rpc("decrement_stock", {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    } as any);
  }

  return {
    success: true,
    orderId: order.id,
    razorpayOrderId: razorpayOrderId ?? undefined,
  };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: "placed" | "packed" | "shipped" | "delivered" | "cancelled",
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

