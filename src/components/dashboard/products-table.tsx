"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSheet } from "./product-sheet";
import { formatINR, calculateDiscountPercent } from "@/lib/utils";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/types";

interface ProductsTableProps {
  initialProducts: Product[];
  categories: Pick<Category, "id" | "name" | "slug">[];
  tenantId: string;
}

function getStockBadgeVariant(stock: number): "success" | "warning" | "destructive" {
  if (stock === 0) return "destructive";
  if (stock < 5) return "warning";
  return "success";
}

function getStockLabel(stock: number): string {
  if (stock === 0) return "Out of Stock";
  if (stock < 5) return `Low Stock (${stock})`;
  return `In Stock (${stock})`;
}

export function ProductsTable({
  initialProducts,
  categories,
  tenantId,
}: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const supabase = createSupabaseClient();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleActive = async (product: Product) => {
    const newValue = !product.is_active;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: newValue } : p
      )
    );

    const { error } = await supabase
      .from("products")
      .update({ is_active: newValue })
      .eq("id", product.id)
      .eq("tenant_id", tenantId);

    if (error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !newValue } : p
        )
      );
      toast.error("Failed to update product status.");
    } else {
      toast.success(
        `${product.title} ${newValue ? "is now Live" : "set to Draft"}`
      );
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;

    const prevProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== product.id));

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .eq("tenant_id", tenantId);

    if (error) {
      setProducts(prevProducts);
      toast.error("Failed to delete product.");
    } else {
      toast.success(`"${product.title}" deleted.`);
    }
  };

  const handleProductSaved = (savedProduct: Product) => {
    setProducts((prev) => {
      const existing = prev.find((p) => p.id === savedProduct.id);
      if (existing) {
        return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      }
      return [savedProduct, ...prev];
    });
    setIsSheetOpen(false);
    setEditingProduct(null);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or SKU..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsSheetOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 py-16 text-center">
          <Package
            className="h-12 w-12 text-muted-foreground/50 mb-4"
            strokeWidth={1.5}
          />
          <h3 className="font-semibold mb-1">
            {searchQuery || selectedCategory !== "all"
              ? "No products match your filter"
              : "No products yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting search or category filters."
              : "Start by adding your first product to your catalog."}
          </p>
          {!searchQuery && selectedCategory === "all" && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsSheetOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    SKU
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Selling Price / MRP
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredProducts.map((product) => {
                  const discount = calculateDiscountPercent(
                    Number(product.mrp),
                    Number(product.selling_price)
                  );
                  return (
                    <tr
                      key={product.id}
                      className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{product.title}</p>
                            {discount > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                {discount}% off
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        {product.sku ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {product.sku}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono font-semibold tabular-nums text-sm">
                            {formatINR(Number(product.selling_price))}
                          </p>
                          {Number(product.mrp) > Number(product.selling_price) && (
                            <p className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                              {formatINR(Number(product.mrp))}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={getStockBadgeVariant(product.stock_count) as any}>
                          {getStockLabel(product.stock_count)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={() => handleToggleActive(product)}
                            aria-label={
                              product.is_active ? "Unpublish product" : "Publish product"
                            }
                          />
                          <span className="text-xs text-muted-foreground hidden lg:inline">
                            {product.is_active ? "Live" : "Draft"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsSheetOpen(true);
                            }}
                            aria-label="Edit product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleDelete(product)}
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        tenantId={tenantId}
        onSaved={handleProductSaved}
      />
    </>
  );
}

