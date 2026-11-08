import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StoreForge India — Multi-Tenant E-Commerce SaaS",
    template: "%s | StoreForge India",
  },
  description:
    "Launch your own branded online store in minutes. StoreForge India is the all-in-one e-commerce SaaS platform for Indian vendors.",
  keywords: ["ecommerce", "saas", "india", "online store", "vendor", "razorpay"],
  authors: [{ name: "StoreForge India" }],
  creator: "StoreForge India",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "StoreForge India",
    title: "StoreForge India — Multi-Tenant E-Commerce SaaS",
    description: "Launch your own branded online store in minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoreForge India",
    description: "Launch your own branded online store in minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            expand={false}
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "font-sans text-sm border border-slate-200 dark:border-zinc-800",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
