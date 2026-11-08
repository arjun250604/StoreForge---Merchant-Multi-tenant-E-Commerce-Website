import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees (INR) using the en-IN locale.
 * Example: formatINR(124500) → "₹1,24,500.00"
 * Example: formatINR(1000, { fromPaise: true }) → "₹10.00"
 */
export function formatINR(
  amount: number,
  options: { fromPaise?: boolean; compact?: boolean } = {}
): string {
  const rupees = options.fromPaise ? amount / 100 : amount;

  if (options.compact) {
    if (rupees >= 1_00_00_000) {
      return `₹${(rupees / 1_00_00_000).toFixed(2)}Cr`;
    }
    if (rupees >= 1_00_000) {
      return `₹${(rupees / 1_00_000).toFixed(2)}L`;
    }
    if (rupees >= 1_000) {
      return `₹${(rupees / 1_000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Calculate the discount percentage between MRP and selling price.
 * Returns 0 if selling price >= MRP.
 */
export function calculateDiscountPercent(
  mrp: number,
  sellingPrice: number
): number {
  if (mrp <= 0 || sellingPrice >= mrp) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

/**
 * Determine readable contrast color (white or dark slate) for a given hex background.
 * Uses W3C relative luminance formula.
 */
export function getContrastColor(hexColor: string): "white" | "#1e293b" {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Relative luminance via WCAG 2.1 formula
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  // Against white background (L=1): ratio = (1 + 0.05) / (L + 0.05)
  // Use white text if contrast against white is low (i.e., dark background)
  return L > 0.179 ? "#1e293b" : "white";
}

/**
 * Convert a hex color to HSL components string for use in CSS variables.
 * Example: "#6366f1" → "239 84% 67%"
 */
export function hexToHSL(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lig = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / d + 2) / 6;
        break;
      case b:
        hue = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lig * 100)}%`;
}

/** Generate a URL-safe slug from any string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/** Format a date in Indian style: DD MMM YYYY */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Format a datetime in Indian style with time */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/** Generate a short display-friendly order ID from a UUID */
export function shortOrderId(uuid: string): string {
  return `#${uuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Validate Indian GSTIN format */
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** Validate Indian mobile number (+91 format) */
export const INDIAN_MOBILE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;

/** GST slab rates available for products in India */
export const GST_SLABS = [0, 5, 12, 18, 28] as const;
export type GSTSlab = (typeof GST_SLABS)[number];

/** Border radius presets mapping to CSS rem values */
export const BORDER_RADIUS_MAP: Record<"sharp" | "modern" | "playful" | string, string> = {
  sharp: "0rem",
  modern: "0.5rem",
  playful: "1rem",
};
