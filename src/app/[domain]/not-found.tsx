import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorefrontNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 py-16 max-w-md mx-auto">
        <div className="relative mx-auto w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-3">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Store Not Found
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The storefront you&apos;re looking for doesn&apos;t exist or may have
          been deactivated by the merchant.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Go to StoreForge
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Are you a merchant?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Launch your own store →
          </Link>
        </p>
      </div>
    </div>
  );
}

