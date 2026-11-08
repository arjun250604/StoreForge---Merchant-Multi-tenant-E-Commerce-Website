"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { productFormSchema, type ProductFormData } from "@/lib/validations";
import { createSupabaseClient } from "@/lib/supabase/client";
import { slugify, calculateDiscountPercent, GST_SLABS } from "@/lib/utils";
import type { Product, Category } from "@/types";

interface ProductSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Pick<Category, "id" | "name" | "slug">[];
  tenantId: string;
  onSaved: (product: Product) => void;
}

export function ProductSheet({
  isOpen,
  onClose,
  product,
  categories,
  tenantId,
  onSaved,
}: ProductSheetProps) {
  const isEditing = !!product;
  const supabase = createSupabaseClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      categoryId: null,
      mrp: 0,
      sellingPrice: 0,
      gstSlab: 0,
      sku: "",
      stockCount: 0,
      images: [],
      isActive: true,
      tags: [],
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        slug: product.slug,
        description: product.description ?? "",
        categoryId: product.category_id ?? null,
        mrp: Number(product.mrp),
        sellingPrice: Number(product.selling_price),
        gstSlab: product.gst_slab,
        sku: product.sku ?? "",
        stockCount: product.stock_count,
        images: product.images ?? [],
        isActive: product.is_active,
        tags: product.tags ?? [],
      });
    } else {
      reset({
        title: "",
        slug: "",
        description: "",
        categoryId: null,
        mrp: 0,
        sellingPrice: 0,
        gstSlab: 0,
        sku: "",
        stockCount: 0,
        images: [],
        isActive: true,
        tags: [],
      });
    }
  }, [product, reset, isOpen]);

  const titleValue = watch("title");
  useEffect(() => {
    if (!isEditing && titleValue) {
      setValue("slug", slugify(titleValue));
    }
  }, [titleValue, isEditing, setValue]);

  const mrp = watch("mrp");
  const sellingPrice = watch("sellingPrice");
  const discount = calculateDiscountPercent(mrp, sellingPrice);
  const images = watch("images");
  const isActive = watch("isActive");
  const gstSlab = watch("gstSlab");

  const onSubmit = async (data: ProductFormData) => {
    const payload = {
      tenant_id: tenantId,
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      category_id: data.categoryId || null,
      mrp: data.mrp,
      selling_price: data.sellingPrice,
      gst_slab: data.gstSlab,
      sku: data.sku || null,
      stock_count: data.stockCount,
      images: data.images,
      is_active: data.isActive,
      tags: data.tags,
    };

    if (isEditing && product) {
      const { data: updated, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id)
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

      if (error || !updated) {
        toast.error(error?.message ?? "Failed to update product.");
        return;
      }
      toast.success(`"${data.title}" updated successfully`);
      onSaved(updated as Product);
    } else {
      const { data: created, error } = await supabase
        .from("products")
        .insert(payload)
        .select("*")
        .single();

      if (error || !created) {
        if (error?.code === "23505") {
          toast.error("A product with this slug already exists.");
        } else {
          toast.error(error?.message ?? "Failed to create product.");
        }
        return;
      }
      toast.success(`"${data.title}" added to your catalog`);
      onSaved(created as Product);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
          <SheetTitle>
            {isEditing ? "Edit Product" : "Add New Product"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update product details, pricing, and stock."
              : "Create a new catalog item for your storefront."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Royal Silk Scarf"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="royal-silk-scarf"
                {...register("slug")}
                className={`font-mono text-sm ${errors.slug ? "border-red-500" : ""}`}
              />
              {errors.slug && (
                <p className="text-xs text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe product materials, specifications, and care instructions..."
                rows={3}
                {...register("description")}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={watch("categoryId") ?? "none"}
                  onValueChange={(v) =>
                    setValue("categoryId", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>GST Slab Rate</Label>
                <Select
                  value={String(gstSlab)}
                  onValueChange={(v) => setValue("gstSlab", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_SLABS.map((slab) => (
                      <SelectItem key={slab} value={String(slab)}>
                        {slab}% GST
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3">Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mrp">MRP (₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      ₹
                    </span>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={`pl-7 font-mono ${errors.mrp ? "border-red-500" : ""}`}
                      {...register("mrp", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.mrp && (
                    <p className="text-xs text-red-500">{errors.mrp.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sellingPrice">
                    Selling Price (₹) *
                    {discount > 0 && (
                      <Badge variant="success" className="ml-2 text-[10px]">
                        {discount}% off
                      </Badge>
                    )}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      ₹
                    </span>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={`pl-7 font-mono ${errors.sellingPrice ? "border-red-500" : ""}`}
                      {...register("sellingPrice", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.sellingPrice && (
                    <p className="text-xs text-red-500">
                      {errors.sellingPrice.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3">Inventory</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU Code</Label>
                  <Input
                    id="sku"
                    placeholder="SKU-IND-1001"
                    className="font-mono text-sm"
                    {...register("sku")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stockCount">Stock Count *</Label>
                  <Input
                    id="stockCount"
                    type="number"
                    min="0"
                    placeholder="0"
                    className={`font-mono ${errors.stockCount ? "border-red-500" : ""}`}
                    {...register("stockCount", { valueAsNumber: true })}
                  />
                  {errors.stockCount && (
                    <p className="text-xs text-red-500">
                      {errors.stockCount.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3">Product Images (URLs)</h4>
              <div className="space-y-2">
                {(images ?? []).map((url: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start">
                    {url && (
                      <img
                        src={url}
                        alt={`Image ${idx + 1}`}
                        className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <Input
                      placeholder="https://images.unsplash.com/..."
                      value={url}
                      onChange={(e) => {
                        const newImages = [...(images ?? [])];
                        newImages[idx] = e.target.value;
                        setValue("images", newImages);
                      }}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 text-red-500"
                      onClick={() => {
                        const newImages = images.filter((_: string, i: number) => i !== idx);
                        setValue("images", newImages);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {(images ?? []).length < 8 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => setValue("images", [...(images ?? []), ""])}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Image URL
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-zinc-800 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Publish to Storefront</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? "Product will be visible to shoppers immediately"
                    : "Product is stored as hidden draft"}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>{isEditing ? "Save Changes" : "Create Product"}</>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

