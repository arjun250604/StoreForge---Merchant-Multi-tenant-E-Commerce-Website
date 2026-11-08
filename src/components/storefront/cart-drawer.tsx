"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { formatINR } from "@/lib/utils";

interface CartDrawerProps {
  tenantId: string;
}

const FREE_SHIPPING_THRESHOLD = 500;

export function CartDrawer({}: CartDrawerProps) {
  const { isCartOpen, closeCart } = useUIStore();
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    getGSTBreakdown,
    getTotalWithGST,
    getTotalItems,
  } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const subtotal = getSubtotal();
  const { slabs: gstSlabs } = getGSTBreakdown();
  const total = getTotalWithGST();
  const totalItems = getTotalItems();

  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );
  const amountToFreeShipping = Math.max(
    FREE_SHIPPING_THRESHOLD - subtotal,
    0
  );

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
            {totalItems > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full bg-primary/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag
                  className="h-12 w-12 text-primary/50"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add products to get started
              </p>
            </div>
            <Button onClick={closeCart} variant="outline" className="mt-2">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-primary/5 border-b border-slate-200 dark:border-zinc-800">
              {amountToFreeShipping > 0 ? (
                <p className="text-xs text-muted-foreground mb-1.5">
                  Add{" "}
                  <span className="font-semibold text-foreground">
                    {formatINR(amountToFreeShipping)}
                  </span>{" "}
                  more for free shipping
                </p>
              ) : (
                <p className="text-xs font-medium text-emerald-600">
                  🎉 You qualify for free shipping!
                </p>
              )}
              <Progress value={shippingProgress} className="h-1.5" />
            </div>

            <ScrollArea className="flex-1">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 px-6 py-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem(item.productId);
                                toast.info(`${item.title} removed from cart`);
                              } else {
                                updateQuantity(item.productId, item.quantity - 1);
                              }
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono tabular-nums">
                            {formatINR(item.sellingPrice * item.quantity)}
                          </span>
                          <button
                            onClick={() => {
                              removeItem(item.productId);
                              toast.info(`${item.title} removed`);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-slate-200 dark:border-zinc-800 px-6 py-4 space-y-3">
              {gstSlabs.length > 0 && (
                <div className="space-y-1">
                  {gstSlabs.map(({ rate, amount }) => (
                    <div
                      key={rate}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span>GST ({rate}%) included</span>
                      <span className="font-mono tabular-nums">
                        {formatINR(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono tabular-nums text-lg">
                  {formatINR(total)}
                </span>
              </div>

              <Button
                className="w-full"
                size="lg"
                asChild
                style={{
                  backgroundColor: "var(--tenant-primary)",
                  color: "var(--tenant-contrast)",
                } as React.CSSProperties}
                onClick={closeCart}
              >
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

