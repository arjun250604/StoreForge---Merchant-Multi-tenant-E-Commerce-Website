"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Building2,
  Palette,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Store,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  registerTenant,
  checkSubdomainAvailable,
} from "@/app/actions/auth";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Data,
  type RegisterStep2Data,
  type RegisterStep3Data,
} from "@/lib/validations";
import { getContrastColor, BORDER_RADIUS_MAP } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Slate", hex: "#0f172a" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Form State
  const [account, setAccount] = useState<RegisterStep1Data>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [business, setBusiness] = useState<RegisterStep2Data>({
    legalBusinessName: "",
    displayName: "",
    slug: "",
    gstin: "",
    razorpayLinkedAccountId: "",
  });

  const [theme, setTheme] = useState<RegisterStep3Data>({
    logoUrl: "",
    bannerUrl: "",
    primaryColor: "#6366f1",
    accentColor: "#f43f5e",
    borderRadius: "modern",
    fontPairing: "inter",
  });

  // Step 1 Validation
  const handleNextStep1 = () => {
    const parsed = registerStep1Schema.safeParse(account);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Subdomain check
  const handleNextStep2 = async () => {
    const parsed = registerStep2Schema.safeParse(business);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }

    setSlugChecking(true);
    setSlugError(null);
    try {
      const isAvailable = await checkSubdomainAvailable(business.slug);
      if (!isAvailable) {
        setSlugError("This subdomain is already taken.");
        toast.error("Subdomain unavailable. Choose another one.");
        return;
      }
      setCurrentStep(3);
    } catch {
      toast.error("Error validating subdomain.");
    } finally {
      setSlugChecking(false);
    }
  };

  // Final Submission
  const handleSubmit = async () => {
    const parsed = registerStep3Schema.safeParse(theme);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerTenant({
        account,
        business,
        theme,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to create merchant store.");
        return;
      }

      toast.success("Store created successfully! Welcome to StoreForge.");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong during store setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewRadius = BORDER_RADIUS_MAP[theme.borderRadius] || "0.5rem";
  const previewContrast = getContrastColor(theme.primaryColor);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* ── LEFT PANEL: Form Wizard ── */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-14 border-r border-slate-200 dark:border-zinc-800 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                SF
              </div>
              <span className="font-bold text-lg tracking-tight">StoreForge India</span>
            </div>
            <a
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Already a merchant? Sign In
            </a>
          </div>

          {/* Stepper Progress */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-zinc-800 -translate-y-1/2 -z-10" />

              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1.5 bg-background px-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    currentStep > 1
                      ? "bg-emerald-500 text-white"
                      : currentStep === 1
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-slate-200 dark:bg-zinc-800 text-muted-foreground"
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Account</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1.5 bg-background px-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    currentStep > 2
                      ? "bg-emerald-500 text-white"
                      : currentStep === 2
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-slate-200 dark:bg-zinc-800 text-muted-foreground"
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Business & GST</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1.5 bg-background px-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    currentStep === 3
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-slate-200 dark:bg-zinc-800 text-muted-foreground"
                  }`}
                >
                  3
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Store Theme</span>
              </div>
            </div>
          </div>

          {/* STEP 1: Account */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create your merchant account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Start with your primary administrator credentials.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Aditi Sharma"
                    value={account.fullName}
                    onChange={(e) => setAccount({ ...account, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="aditi@craftworks.in"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile Number (+91)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      +91
                    </span>
                    <Input
                      id="phone"
                      placeholder="9876543210"
                      className="pl-11"
                      value={account.phone}
                      onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password (min. 8 chars, 1 uppercase, 1 digit)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={account.password}
                    onChange={(e) => setAccount({ ...account, password: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleNextStep1} size="lg" className="w-full mt-6">
                Next: Business Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 2: Business & Compliance */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Business & Compliance</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure legal identity, subdomain, and Indian compliance parameters.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Storefront Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g. Jaipur Crafts Studio"
                    value={business.displayName}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/[\s_-]+/g, "-");
                      setBusiness({
                        ...business,
                        displayName: name,
                        slug: business.slug ? business.slug : slug,
                      });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug">Subdomain Slug</Label>
                  <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
                    <Input
                      id="slug"
                      placeholder="jaipur-crafts"
                      className="border-0 focus-visible:ring-0 font-mono text-sm"
                      value={business.slug}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                    />
                    <span className="pr-3 text-xs text-muted-foreground font-mono">
                      .{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "storeforge.in"}
                    </span>
                  </div>
                  {slugError && <p className="text-xs text-red-500">{slugError}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="legalBusinessName">Legal Registered Business Name</Label>
                  <Input
                    id="legalBusinessName"
                    placeholder="Jaipur Crafts Pvt Ltd"
                    value={business.legalBusinessName}
                    onChange={(e) =>
                      setBusiness({ ...business, legalBusinessName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gstin">GSTIN (Optional / Indian GST Validation)</Label>
                    <span className="text-[11px] text-muted-foreground font-mono">15 digits</span>
                  </div>
                  <Input
                    id="gstin"
                    placeholder="27AAAAA0000A1Z5"
                    className="font-mono uppercase"
                    maxLength={15}
                    value={business.gstin}
                    onChange={(e) =>
                      setBusiness({ ...business, gstin: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="razorpayLinkedAccountId">Razorpay Linked Account ID (Optional)</Label>
                    <Badge variant="outline" className="text-[10px]">Route API</Badge>
                  </div>
                  <Input
                    id="razorpayLinkedAccountId"
                    placeholder="acc_XXXXXXXXXXXXXX"
                    className="font-mono text-sm"
                    value={business.razorpayLinkedAccountId}
                    onChange={(e) =>
                      setBusiness({ ...business, razorpayLinkedAccountId: e.target.value })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Required for live split payouts via Razorpay Route. Leave blank for test sandbox mode.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNextStep2}
                  size="lg"
                  className="flex-1"
                  disabled={slugChecking}
                >
                  {slugChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking Subdomain...
                    </>
                  ) : (
                    <>
                      Next: Brand Theme
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Storefront Theme */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Customize Storefront Branding</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Adjust color tokens, button radiuses, and store images in real-time.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Primary Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          className={`h-7 w-7 rounded-full border-2 transition-transform ${
                            theme.primaryColor.toLowerCase() === preset.hex.toLowerCase()
                              ? "scale-110 border-foreground ring-2 ring-primary/20"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          onClick={() => setTheme({ ...theme, primaryColor: preset.hex })}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <Input
                      type="text"
                      className="font-mono text-xs w-28 uppercase"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Border Radius Preset</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sharp", "modern", "playful"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTheme({ ...theme, borderRadius: r })}
                        className={`py-2 px-3 text-xs font-medium border rounded-md capitalize transition-all ${
                          theme.borderRadius === r
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        {r} ({r === "sharp" ? "0rem" : r === "modern" ? "0.5rem" : "1.0rem"})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl">Store Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={theme.logoUrl}
                    onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bannerUrl">Hero Banner URL</Label>
                  <Input
                    id="bannerUrl"
                    placeholder="https://images.unsplash.com/..."
                    value={theme.bannerUrl}
                    onChange={(e) => setTheme({ ...theme, bannerUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Launching Storefront...
                    </>
                  ) : (
                    <>
                      Launch My Storefront 🚀
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Protected by StoreForge Security. Razorpay Route split settlement authorized.
        </p>
      </div>

      {/* ── RIGHT PANEL: Real-Time Live Preview ── */}
      <div className="lg:col-span-5 bg-slate-50 dark:bg-zinc-950 p-6 sm:p-10 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" /> Live Storefront Preview
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {business.slug ? `${business.slug}.storeforge.in` : "yourstore.storeforge.in"}
            </Badge>
          </div>

          {/* Storefront Mock Card */}
          <div
            className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden transition-all duration-300"
            style={{ borderRadius: previewRadius }}
          >
            {/* Mock Header */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme.logoUrl ? (
                  <img
                    src={theme.logoUrl}
                    alt="Logo"
                    className="h-6 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: previewContrast,
                    }}
                  >
                    {(business.displayName || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-bold truncate max-w-[140px]">
                  {business.displayName || "Your Store"}
                </span>
              </div>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Mock Banner */}
            <div
              className="h-28 w-full bg-cover bg-center flex items-end p-3 relative"
              style={{
                backgroundImage: theme.bannerUrl
                  ? `url('${theme.bannerUrl}')`
                  : undefined,
                backgroundColor: `${theme.primaryColor}20`,
              }}
            >
              <div className="bg-white/90 dark:bg-black/80 px-2 py-0.5 rounded text-[10px] font-semibold">
                Featured Collection
              </div>
            </div>

            {/* Mock Product Card */}
            <div className="p-4 space-y-3">
              <div className="aspect-[4/3] rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-muted-foreground">
                Product Image Showcase
              </div>
              <div>
                <p className="text-xs font-semibold">Signature Artisan Item</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold font-mono">₹1,249.00</span>
                  <span className="text-[10px] text-muted-foreground line-through font-mono">₹1,899.00</span>
                </div>
              </div>

              {/* Dynamic Branded Button */}
              <button
                type="button"
                className="w-full py-2 text-xs font-semibold shadow transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: previewContrast,
                  borderRadius: previewRadius,
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>

          {/* Compliance & Settlement Trust Badge */}
          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>India E-Commerce Ready</span>
            </div>
            <div className="space-y-1 text-muted-foreground text-[11px]">
              <p>• GSTIN: <span className="font-mono text-foreground">{business.gstin || "Unregistered"}</span></p>
              <p>• Razorpay Route Account: <span className="font-mono text-foreground">{business.razorpayLinkedAccountId || "acc_TEST_MODE"}</span></p>
              <p>• Platform Settlement: <span className="font-semibold text-foreground">98% direct to merchant</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

