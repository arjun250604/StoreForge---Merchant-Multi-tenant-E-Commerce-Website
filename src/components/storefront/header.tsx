"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import type { Tenant } from "@/types";

interface StorefrontHeaderProps {
  tenant: Tenant;
}

export function StorefrontHeader({ tenant }: StorefrontHeaderProps) {
  const router = useRouter();
  const { getTotalItems, setTenantId } = useCartStore();
  const { openCart } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTenantId(tenant.id);
  }, [tenant.id, setTenantId]);

  const totalItems = isMounted ? getTotalItems() : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
  };

  return (
    <header className="glass-header">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.display_name}
                className="h-8 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <span className="text-lg font-bold tracking-tight">
                {tenant.display_name}
              </span>
            )}
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden sm:flex flex-1 max-w-md"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            {/* Track Orders Link */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              <Link href="/orders">Track Orders</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              {isSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
              aria-label={`Cart (${totalItems} items)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: tenant.primary_color }}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="pb-3 sm:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

