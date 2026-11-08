import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getContrastColor, hexToHSL } from "@/lib/utils";
import type { Tenant } from "@/types";
import { StorefrontHeader } from "@/components/storefront/header";
import { CartDrawer } from "@/components/storefront/cart-drawer";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: { domain: string };
}

async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as Tenant;
}

export async function generateMetadata({
  params,
}: StorefrontLayoutProps): Promise<Metadata> {
  const tenant = await getTenantBySlug(params.domain);
  if (!tenant) return { title: "Store Not Found" };

  return {
    title: {
      default: tenant.display_name,
      template: `%s | ${tenant.display_name}`,
    },
    description: `Shop at ${tenant.display_name} — powered by StoreForge India`,
    openGraph: {
      type: "website",
      siteName: tenant.display_name,
      images: tenant.banner_url ? [{ url: tenant.banner_url }] : [],
    },
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const tenant = await getTenantBySlug(params.domain);

  if (!tenant) {
    notFound();
  }

  // Derive CSS custom properties from tenant branding
  const contrastColor = getContrastColor(tenant.primary_color);
  const primaryHSL = hexToHSL(tenant.primary_color);
  const accentHSL = hexToHSL(tenant.accent_color);

  const borderRadiusMap: Record<string, string> = {
    sharp: "0rem",
    modern: "0.5rem",
    playful: "1rem",
  };
  const radius = borderRadiusMap[tenant.border_radius] ?? "0.5rem";

  const fontFamilyMap: Record<string, string> = {
    inter: "'Inter', sans-serif",
    jakarta: "'Plus Jakarta Sans', sans-serif",
    poppins: "'Poppins', sans-serif",
    raleway: "'Raleway', sans-serif",
    nunito: "'Nunito', sans-serif",
  };
  const fontFamily = fontFamilyMap[tenant.font_pairing] ?? "'Inter', sans-serif";

  const cssVariables = `
    --tenant-primary: ${tenant.primary_color};
    --tenant-primary-hsl: ${primaryHSL};
    --tenant-accent: ${tenant.accent_color};
    --tenant-accent-hsl: ${accentHSL};
    --tenant-radius: ${radius};
    --tenant-contrast: ${contrastColor};
    --tenant-font: ${fontFamily};
    --primary: ${primaryHSL};
    --ring: ${primaryHSL};
    --radius: ${radius};
  `.trim();

  return (
    <div
      style={{ cssText: cssVariables } as React.CSSProperties}
      className="min-h-screen bg-background font-sans"
      data-tenant={tenant.slug}
    >
      {/* Announcement Bar */}
      {tenant.announcement_bar_text && (
        <div
          className="w-full py-2 px-4 text-center text-xs font-medium"
          style={{
            backgroundColor: tenant.primary_color,
            color: contrastColor,
          }}
        >
          {tenant.announcement_bar_text}
        </div>
      )}

      {/* Storefront Header */}
      <StorefrontHeader tenant={tenant} />

      {/* Cart Drawer */}
      <CartDrawer tenantId={tenant.id} />

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 mt-16">
        <div className="page-container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.display_name}
                  className="h-6 w-auto object-contain"
                />
              ) : (
                <span className="font-semibold text-sm">{tenant.display_name}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a
                href="/"
                className="font-medium hover:underline"
              >
                StoreForge India
              </a>
              {tenant.gstin && (
                <span className="ml-2 font-mono tabular-nums">
                  GSTIN: {tenant.gstin}
                </span>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
