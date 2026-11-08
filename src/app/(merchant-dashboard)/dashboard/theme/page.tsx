"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Palette,
  Save,
  Loader2,
  Store,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase/client";
import { updateTenantTheme } from "@/app/actions/tenant";
import { getContrastColor, BORDER_RADIUS_MAP } from "@/lib/utils";
import type { Tenant } from "@/types";

const COLOR_PRESETS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Slate", hex: "#0f172a" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Crimson", hex: "#dc2626" },
];

const FONT_PRESETS = [
  { id: "inter", name: "Inter (Modern & Clean)" },
  { id: "jakarta", name: "Plus Jakarta Sans (SaaS & Bold)" },
  { id: "poppins", name: "Poppins (Friendly & Round)" },
  { id: "raleway", name: "Raleway (Elegant & Premium)" },
  { id: "nunito", name: "Nunito (Playful & Soft)" },
];

export default function ThemeCustomizerPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Theme states
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [accentColor, setAccentColor] = useState("#f43f5e");
  const [borderRadius, setBorderRadius] = useState<"sharp" | "modern" | "playful">("modern");
  const [fontPairing, setFontPairing] = useState("inter");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [announcementBarText, setAnnouncementBarText] = useState("");

  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadTenant() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (data) {
        setTenant(data as Tenant);
        setPrimaryColor(data.primary_color || "#6366f1");
        setAccentColor(data.accent_color || "#f43f5e");
        setBorderRadius((data.border_radius as any) || "modern");
        setFontPairing(data.font_pairing || "inter");
        setLogoUrl(data.logo_url || "");
        setBannerUrl(data.banner_url || "");
        setAnnouncementBarText(data.announcement_bar_text || "");
      }
      setLoading(false);
    }
    loadTenant();
  }, [supabase]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      const res = await updateTenantTheme({
        tenantId: tenant.id,
        primaryColor,
        accentColor,
        borderRadius,
        fontPairing,
        logoUrl,
        bannerUrl,
        announcementBarText,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update theme.");
      } else {
        toast.success("Theme settings saved! Your storefront is updated.");
      }
    } catch {
      toast.error("Failed to save theme settings.");
    } finally {
      setSaving(false);
    }
  };

  const previewRadius = BORDER_RADIUS_MAP[borderRadius] || "0.5rem";
  const previewContrast = getContrastColor(primaryColor);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storefront Theme & Branding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize visual tokens for <span className="font-semibold text-foreground">{tenant?.display_name}</span>.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Brand Palette
              </CardTitle>
              <CardDescription>
                Primary buttons, active states, and accents dynamically compute WCAG accessible contrast.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Primary Brand Color</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        primaryColor.toLowerCase() === p.hex.toLowerCase()
                          ? "scale-110 border-foreground ring-2 ring-primary/20"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: p.hex }}
                      onClick={() => setPrimaryColor(p.hex)}
                      title={p.name}
                    />
                  ))}
                  <Input
                    className="font-mono text-xs w-28 uppercase"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    className="font-mono text-xs w-28 uppercase"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                  <div
                    className="h-8 w-8 rounded-md border"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Geometry & Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["sharp", "modern", "playful"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setBorderRadius(r)}
                      className={`py-2 px-3 text-xs font-medium border rounded-md capitalize transition-all ${
                        borderRadius === r
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {r} ({r === "sharp" ? "0rem" : r === "modern" ? "0.5rem" : "1.0rem"})
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Font Pairing</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FONT_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontPairing(f.id)}
                      className={`text-left p-2.5 text-xs border rounded-md transition-all ${
                        fontPairing === f.id
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assets & Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl">Store Logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bannerUrl">Hero Banner URL</Label>
                <Input
                  id="bannerUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="announcementBar">Top Announcement Bar Text</Label>
                <Input
                  id="announcementBar"
                  placeholder="e.g. Free Express Shipping across India on orders above ₹499!"
                  value={announcementBarText}
                  onChange={(e) => setAnnouncementBarText(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" /> Live Store Preview
              </span>
              <span className="font-mono text-[10px]">
                {tenant?.slug}.storeforge.in
              </span>
            </div>

            <div
              className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
              style={{ borderRadius: previewRadius }}
            >
              {/* Announcement */}
              {announcementBarText && (
                <div
                  className="px-3 py-1.5 text-center text-[10px] font-semibold"
                  style={{ backgroundColor: primaryColor, color: previewContrast }}
                >
                  {announcementBarText}
                </div>
              )}

              {/* Header */}
              <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-6 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: primaryColor, color: previewContrast }}
                    >
                      {(tenant?.display_name || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold truncate max-w-[130px]">
                    {tenant?.display_name}
                  </span>
                </div>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Hero Banner */}
              <div
                className="h-28 w-full bg-cover bg-center flex items-end p-3 relative"
                style={{
                  backgroundImage: bannerUrl ? `url('${bannerUrl}')` : undefined,
                  backgroundColor: `${primaryColor}20`,
                }}
              >
                <div className="bg-white/90 dark:bg-black/80 px-2 py-0.5 rounded text-[10px] font-semibold">
                  Featured Collection
                </div>
              </div>

              {/* Product Card */}
              <div className="p-4 space-y-3">
                <div className="aspect-[4/3] rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-muted-foreground">
                  Product Image Preview
                </div>
                <div>
                  <p className="text-xs font-semibold">Handcrafted Signature Item</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold font-mono">₹1,499.00</span>
                    <span className="text-[10px] text-muted-foreground line-through font-mono">
                      ₹2,199.00
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2 text-xs font-semibold shadow transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: primaryColor,
                    color: previewContrast,
                    borderRadius: previewRadius,
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Dynamic Token Injection
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tokens are dynamically mapped via CSS variables in <code className="font-mono text-foreground">/[domain]/layout.tsx</code> on every incoming request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

