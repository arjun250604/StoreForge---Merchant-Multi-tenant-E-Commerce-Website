import Razorpay from "razorpay";

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay singleton instance (server-side only)
// ─────────────────────────────────────────────────────────────────────────────

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      throw new Error(
        "[StoreForge] Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
      );
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RazorpayTransfer {
  account: string;        // Vendor's linked account ID, e.g. "acc_XXXXXXXXXX"
  amount: number;         // Amount in smallest currency unit (paise)
  currency: "INR";
  notes?: Record<string, string>;
  linked_account_notes?: string[];
  on_hold?: 0 | 1;
  on_hold_until?: number;
}

export interface CreateOrderPayload {
  amount: number;              // Total in paise (₹1 = 100 paise)
  currency?: "INR";
  receipt: string;             // Unique order reference (e.g. "receipt_<uuid>")
  notes?: Record<string, string>;
  transfers?: RazorpayTransfer[];
}

export interface SplitBreakdown {
  customerTotal: number;       // in paise
  platformCommission: number;  // in paise
  vendorPayout: number;        // in paise
  platformCommissionPercent: number;
  vendorLinkedAccountId: string;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  transfers?: unknown[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Split Calculation
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_COMMISSION_PERCENT =
  Number(process.env.NEXT_PUBLIC_PLATFORM_COMMISSION_PERCENT ?? 2);

/**
 * Calculates the exact split breakdown for a Razorpay Route transfer.
 *
 * @param amountInPaise  - Total order amount in paise (100 paise = ₹1)
 * @param vendorAccountId - Razorpay linked account ID of the merchant
 * @returns SplitBreakdown with commission and payout figures
 */
export function calculateSplitBreakdown(
  amountInPaise: number,
  vendorAccountId: string
): SplitBreakdown {
  // Integer arithmetic to avoid floating-point rounding errors
  const platformCommission = Math.round(
    (amountInPaise * PLATFORM_COMMISSION_PERCENT) / 100
  );
  const vendorPayout = amountInPaise - platformCommission;

  return {
    customerTotal: amountInPaise,
    platformCommission,
    vendorPayout,
    platformCommissionPercent: PLATFORM_COMMISSION_PERCENT,
    vendorLinkedAccountId: vendorAccountId,
  };
}

/**
 * Formats a paise amount into human-readable INR currency string.
 * Example: 124500 → "₹1,245.00"
 */
export function formatINR(amountInPaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Creation with Route Splits
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Razorpay Order with automatic Route split to vendor's linked account.
 *
 * The `transfers` array instructs Razorpay Route to automatically split funds:
 *   - 98% → Vendor's linked account (acc_XXXXXXXXXX)
 *   - 2%  → Platform (retained in the main Razorpay account)
 *
 * @param amountInRupees   - Order total in rupees (will be converted to paise)
 * @param vendorAccountId  - Merchant's Razorpay linked account ID
 * @param orderId          - Internal DB order UUID (used as receipt)
 * @param metadata         - Optional key-value metadata attached to the order
 */
export async function createRazorpayOrderWithSplit(
  amountInRupees: number,
  vendorAccountId: string,
  orderId: string,
  metadata: Record<string, string> = {}
): Promise<RazorpayOrderResult> {
  const amountInPaise = Math.round(amountInRupees * 100);
  const split = calculateSplitBreakdown(amountInPaise, vendorAccountId);

  const payload: CreateOrderPayload = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_${orderId.replace(/-/g, "").slice(0, 20)}`,
    notes: {
      internal_order_id: orderId,
      vendor_account: vendorAccountId,
      platform: "StoreForge India",
      ...metadata,
    },
    transfers: [
      {
        account: vendorAccountId,
        amount: split.vendorPayout,
        currency: "INR",
        notes: {
          internal_order_id: orderId,
          settlement_type: "vendor_payout",
          commission_percent: String(PLATFORM_COMMISSION_PERCENT),
        },
        linked_account_notes: ["internal_order_id", "settlement_type"],
        on_hold: 0,
      },
    ],
  };

  const rzp = getRazorpayInstance();

  // Razorpay SDK types don't expose `transfers` in their type definitions,
  // so we cast through unknown for the extended payload
  const order = await rzp.orders.create(
    payload as Parameters<typeof rzp.orders.create>[0]
  );

  return order as RazorpayOrderResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test / Simulation Mode (no live API keys required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates Razorpay order creation for local dev / demo mode.
 * Returns a mock order object matching the real Razorpay API shape.
 */
export function simulateRazorpayOrder(
  amountInRupees: number,
  vendorAccountId: string,
  orderId: string
): RazorpayOrderResult {
  const amountInPaise = Math.round(amountInRupees * 100);
  const split = calculateSplitBreakdown(amountInPaise, vendorAccountId);

  return {
    id: `order_SIMULATED_${Date.now()}`,
    entity: "order",
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency: "INR",
    receipt: `receipt_${orderId.replace(/-/g, "").slice(0, 20)}`,
    status: "created",
    transfers: [
      {
        account: vendorAccountId,
        amount: split.vendorPayout,
        currency: "INR",
        notes: {
          internal_order_id: orderId,
          settlement_type: "vendor_payout",
          simulated: "true",
        },
      },
    ],
  };
}

/**
 * Verifies a Razorpay payment signature to prevent fraud.
 * Call this in the webhook handler after payment capture.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const crypto = require("crypto");
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === razorpaySignature;
}
