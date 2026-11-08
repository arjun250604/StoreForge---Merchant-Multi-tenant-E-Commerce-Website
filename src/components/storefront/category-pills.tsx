"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryPillsProps {
  categories: Category[];
  selectedCategory?: string;
}

export function CategoryPills({
  categories,
  selectedCategory,
}: CategoryPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryClick = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`?${params.toString()}`);
  };

  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => handleCategoryClick(null)}
        className={cn(
          "flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150",
          !selectedCategory
            ? "border-transparent text-white"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        )}
        style={
          !selectedCategory
            ? {
                backgroundColor: "var(--tenant-primary)",
                color: "var(--tenant-contrast)",
              }
            : undefined
        }
      >
        All
      </button>

      {categories.map((category) => {
        const isSelected = selectedCategory === category.slug;
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={cn(
              "flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150",
              isSelected
                ? "border-transparent text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            )}
            style={
              isSelected
                ? {
                    backgroundColor: "var(--tenant-primary)",
                    color: "var(--tenant-contrast)",
                  }
                : undefined
            }
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

