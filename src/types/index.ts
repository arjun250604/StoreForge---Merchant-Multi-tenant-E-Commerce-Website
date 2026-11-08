export * from "./supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Cart Types (Zustand store)
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  image: string;
  sellingPrice: number;
  mrp: number;
  gstSlab: number;
  quantity: number;
  sku: string | null;
}

export interface CartStore {
  items: CartItem[];
  tenantId: string | null;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setTenantId: (tenantId: string) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getGSTBreakdown: () => { slabs: Array<{ rate: number; amount: number }>; total: number };
  getTotalWithGST: () => number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantTheme {
  primaryColor: string;
  accentColor: string;
  fontPairing: string;
  borderRadius: string;
  contrastColor: "white" | "#1e293b";
}

export type FontPairing =
  | "inter"
  | "jakarta"
  | "poppins"
  | "raleway"
  | "nunito";

export type BorderRadiusPreset = "sharp" | "modern" | "playful";

export const BORDER_RADIUS_MAP: Record<BorderRadiusPreset, string> = {
  sharp: "0rem",
  modern: "0.5rem",
  playful: "1rem",
};

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema Types (inferred from validation schemas)
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterStep1Data {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterStep2Data {
  legalBusinessName: string;
  displayName: string;
  slug: string;
  gstin: string;
  razorpayLinkedAccountId: string;
}

export interface RegisterStep3Data {
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  accentColor: string;
  borderRadius: BorderRadiusPreset;
  fontPairing: FontPairing;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  pincode: string;
  city: string;
  state: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
}

export interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  categoryId: string | null;
  mrp: number;
  sellingPrice: number;
  gstSlab: number;
  sku: string;
  stockCount: number;
  images: string[];
  isActive: boolean;
  tags: string[];
}
