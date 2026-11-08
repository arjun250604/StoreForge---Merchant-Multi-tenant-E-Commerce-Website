import { NextRequest, NextResponse } from "next/server";

// Root domain — the SaaS marketing and merchant admin domain
const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

// Determine if we're in local dev mode
const IS_LOCAL_DEV =
  ROOT_DOMAIN.includes("localhost") || ROOT_DOMAIN.includes("127.0.0.1");

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - Public files (assets, robots.txt, sitemap.xml)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)",
  ],
};

/**
 * Extract the tenant slug from the request host.
 * - Production: slug.yourplatform.com → slug
 * - Local dev:  slug.localhost:3000  → slug
 * Returns null for the root domain (admin/marketing).
 */
function extractTenantSlug(hostname: string): string | null {
  // Strip port
  const hostWithoutPort = hostname.split(":")[0];

  if (IS_LOCAL_DEV) {
    // Local: "slug.localhost" → slug, "localhost" → null
    const parts = hostWithoutPort.split(".");
    if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
      return parts.slice(0, -1).join(".");
    }
    return null;
  }

  // Production: strip TLD + root domain parts
  const rootParts = ROOT_DOMAIN.split("."); // e.g. ["yourplatform", "com"]
  const hostParts = hostWithoutPort.split(".");

  // "slug.yourplatform.com" → ["slug", "yourplatform", "com"]
  if (hostParts.length > rootParts.length) {
    // Everything before the root domain is the tenant slug
    const slugParts = hostParts.slice(0, hostParts.length - rootParts.length);
    return slugParts.join(".");
  }

  return null;
}

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") ?? "";

  // ── Bypass: Next.js internal / static / API requests ──
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const tenantSlug = extractTenantSlug(hostname);

  // ── Root domain: serve SaaS marketing / merchant dashboard ──
  if (!tenantSlug) {
    // No rewrite needed — serve normally under app/(saas-marketing) or (merchant-dashboard)
    return NextResponse.next();
  }

  // ── Tenant subdomain: rewrite to /[domain]/... ──
  const originalPathname = url.pathname;
  const originalSearch = url.search;

  url.pathname = `/${tenantSlug}${originalPathname === "/" ? "" : originalPathname}`;

  const response = NextResponse.rewrite(url);

  // Forward the original host so layouts can read it
  response.headers.set("x-forwarded-host", hostname);
  response.headers.set("x-tenant-slug", tenantSlug);
  response.headers.set("x-original-pathname", originalPathname + originalSearch);

  return response;
}
