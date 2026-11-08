import { z } from "zod";
import { GSTIN_REGEX, INDIAN_MOBILE_REGEX } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const registerStep1Schema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  phone: z
    .string()
    .regex(INDIAN_MOBILE_REGEX, "Please enter a valid Indian mobile number"),
});

export const registerStep2Schema = z.object({
  legalBusinessName: z
    .string()
    .min(3, "Business name must be at least 3 characters")
    .max(200, "Business name is too long"),
  displayName: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(80, "Store name is too long"),
  slug: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain must be 30 characters or fewer")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    )
    .regex(/^[a-z0-9]/, "Subdomain must start with a letter or number")
    .regex(/[a-z0-9]$/, "Subdomain must end with a letter or number"),
  gstin: z
    .string()
    .regex(GSTIN_REGEX, "Please enter a valid 15-digit GSTIN")
    .optional()
    .or(z.literal("")),
  razorpayLinkedAccountId: z
    .string()
    .regex(
      /^acc_[A-Za-z0-9]{14}$/,
      "Please enter a valid Razorpay linked account ID (e.g. acc_XXXXXXXXXXXXXX)"
    )
    .optional()
    .or(z.literal("")),
});

export const registerStep3Schema = z.object({
  logoUrl: z.string().url("Please enter a valid logo URL").optional().or(z.literal("")),
  bannerUrl: z.string().url("Please enter a valid banner URL").optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color (e.g. #6366f1)"),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color (e.g. #f59e0b)"),
  borderRadius: z.enum(["sharp", "modern", "playful"]),
  fontPairing: z.enum(["inter", "jakarta", "poppins", "raleway", "nunito"]),
});

// ─────────────────────────────────────────────────────────────────────────────
// Product Form Schema
// ─────────────────────────────────────────────────────────────────────────────

export const productSchema = z
  .object({
    title: z
      .string()
      .min(2, "Product title must be at least 2 characters")
      .max(200, "Product title is too long"),
    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .max(200, "Slug is too long")
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    description: z.string().max(5000, "Description is too long").optional().or(z.literal("")),
    categoryId: z.string().uuid("Invalid category").nullable(),
    mrp: z
      .number({ invalid_type_error: "MRP must be a number" })
      .positive("MRP must be greater than 0")
      .max(10_00_000, "MRP cannot exceed ₹10,00,000"),
    sellingPrice: z
      .number({ invalid_type_error: "Selling price must be a number" })
      .positive("Selling price must be greater than 0")
      .max(10_00_000, "Selling price cannot exceed ₹10,00,000"),
    gstSlab: z.number().refine((v) => [0, 5, 12, 18, 28].includes(v), {
      message: "GST slab must be 0, 5, 12, 18, or 28",
    }),
    sku: z.string().max(100, "SKU is too long").optional().or(z.literal("")),
    stockCount: z
      .number({ invalid_type_error: "Stock count must be a number" })
      .int("Stock count must be a whole number")
      .min(0, "Stock count cannot be negative")
      .max(1_000_000, "Stock count is unrealistically high"),
    images: z.array(z.string()).max(10, "Maximum 10 images allowed"),
    isActive: z.boolean(),
    tags: z.array(z.string().max(50, "Tag too long")).max(20, "Maximum 20 tags allowed"),
  })
  .refine((data) => data.sellingPrice <= data.mrp, {
    message: "Selling price cannot be greater than MRP",
    path: ["sellingPrice"],
  });

export const productFormSchema = productSchema;

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Form Schema
// ─────────────────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  phone: z
    .string()
    .regex(INDIAN_MOBILE_REGEX, "Please enter a valid Indian mobile number"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City name is too long"),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100, "State name is too long"),
  addressLine1: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address is too long"),
  addressLine2: z.string().max(300, "Address is too long").optional().or(z.literal("")),
  landmark: z.string().max(200, "Landmark is too long").optional().or(z.literal("")),
});

export const checkoutFormSchema = checkoutSchema;

// ─────────────────────────────────────────────────────────────────────────────
// Category Schema
// ─────────────────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  displayOrder: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Inferred TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Data = z.infer<typeof registerStep3Schema>;

export type RegisterStep1Input = RegisterStep1Data;
export type RegisterStep2Input = RegisterStep2Data;
export type RegisterStep3Input = RegisterStep3Data;

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductInput = ProductFormData;

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type CheckoutInput = CheckoutFormData;

export type CategoryInput = z.infer<typeof categorySchema>;
