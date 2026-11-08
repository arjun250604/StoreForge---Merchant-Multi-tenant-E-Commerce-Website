"use client";

import React, { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { formatINR, calculateDiscountPercent } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  tenantSlug: string;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, removeItem, items } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantity ?? 0;
  const discountPercent = calculateDiscountPercent(
    Number(product.mrp),
    Number(product.selling_price)
  );
  const primaryImage = product.images?.[0] ?? null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: primaryImage ?? "",
      sellingPrice: Number(product.selling_price),
      mrp: Number(product.mrp),
      gstSlab: product.gst_slab,
      sku: product.sku,
    });
    toast.success(`${product.title} added to cart`);
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleIncrease = () => {
    if (product.stock_count > 0 && quantity >= product.stock_count) {
      toast.error("Maximum available stock reached");
      return;
    }
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity <= 1) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const isOutOfStock = product.stock_count === 0;

  return (
    <div className="product-card group overflow-hidden">
      {/* 4:5 Aspect Ratio */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-zinc-800">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingCart
              className="h-12 w-12 text-slate-300 dark:text-zinc-600"
              strokeWidth={1}
            />
          </div>
        )}

        {discountPercent > 0 && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              −{discountPercent}%
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium line-clamp-2 leading-snug">
          {product.title}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold font-mono tabular-nums">
            {formatINR(Number(product.selling_price))}
          </span>
          {Number(product.mrp) > Number(product.selling_price) && (
            <span className="text-xs text-muted-foreground line-through font-mono tabular-nums">
              {formatINR(Number(product.mrp))}
            </span>
          )}
        </div>

        {product.gst_slab > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Incl. {product.gst_slab}% GST
          </p>
        )}

        {!isOutOfStock && (
          <div className="pt-1">
            {quantity === 0 ? (
              <Button
                size="sm"
                className="w-full btn-tenant-primary"
                onClick={handleAddToCart}
                disabled={isAdding}
                style={
                  {
                    backgroundColor: "var(--tenant-primary)",
                    color: "var(--tenant-contrast)",
                    borderRadius: "var(--tenant-radius)",
                  } as React.CSSProperties
                }
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={handleDecrease}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-semibold tabular-nums w-6 text-center">
                  {quantity}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={handleIncrease}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

