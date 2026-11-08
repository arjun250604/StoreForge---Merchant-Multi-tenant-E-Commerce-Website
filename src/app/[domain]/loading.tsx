import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
  return (
    <div>
      {/* Hero Skeleton */}
      <Skeleton className="w-full h-64 sm:h-80 lg:h-96 rounded-none" />

      {/* Category Pills Skeleton */}
      <div className="page-container mt-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Product Grid Skeleton */}
      <div className="page-container mt-6 pb-16">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

