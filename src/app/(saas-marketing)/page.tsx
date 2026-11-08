import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Palette,
  CreditCard,
  Building,
  CheckCircle,
  BarChart3,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="glass-header">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              SF
            </div>
            <span className="font-bold text-lg tracking-tight">StoreForge India</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Merchant Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                Launch Store
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="page-container pt-20 pb-16 text-center max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-4 py-1 px-3 gap-1.5 border-primary/30 text-primary">
          <Zap className="h-3.5 w-3.5" /> Next.js 14 Multi-Tenant E-Commerce SaaS for India
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          Launch Your Branded Storefront in Minutes.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The all-in-one multi-tenant commerce engine engineered for Indian merchants.
          Custom subdomains, automatic Razorpay Route split settlements, and Indian GST compliance from a single shared instance.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Button size="xl" asChild className="gap-2">
            <Link href="/register">
              Start Free Merchant Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Edge Subdomain Rewrites
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Razorpay Route 98/2 Split
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Strict PostgreSQL RLS
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> GST Tax Slabs (0%–28%)
          </span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="page-container py-16 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Enterprise Multi-Tenancy Architecture</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Everything independent merchants need to scale their digital commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Edge Subdomain Routing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fast Next.js edge middleware parses host headers and rewrites tenant subdomains (<code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">[store].storeforge.in</code>) with zero latency overhead.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Automated Split Settlements</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Razorpay Route API splits customer payments at transaction capture: 98% directly to the merchant&apos;s linked account and 2% platform fee retained.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 mb-4">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Dynamic CSS Variable Theming</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each merchant configures their primary brand colors, fonts, and border radiuses. Theme tokens are injected at the layout root with automated contrast calculations.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 mb-4">
              <Building className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Indian GST Compliance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Strict 15-character GSTIN regex validation and automatic GST tax slab calculations (0%, 5%, 12%, 18%, 28%) across checkout and catalog tables.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Kanban Fulfilment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visual order pipeline with Placed → Packed → Shipped stages, instant split status tracking, and optimistic UI transitions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">PostgreSQL Row-Level Security</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ironclad database isolation: merchants can only access rows matching their JWT claim (<code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">auth.jwt() -&gt; app_metadata -&gt; tenant_id</code>).
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} StoreForge India. Built with Next.js 14, Supabase, Tailwind CSS, and Razorpay Route.</p>
      </footer>
    </div>
  );
}

