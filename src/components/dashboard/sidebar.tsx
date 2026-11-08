"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Palette,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/store/ui";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Catalog",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    label: "Orders Kanban",
    href: "/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    label: "Storefront Theme",
    href: "/dashboard/theme",
    icon: Palette,
  },
  {
    label: "Payouts & GST",
    href: "/dashboard/payouts",
    icon: CreditCard,
  },
];

interface SidebarProps {
  tenant: {
    slug: string;
    display_name: string;
    logo_url: string | null;
    primary_color: string;
    plan: string;
  };
}

export function DashboardSidebar({ tenant }: SidebarProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300",
          isSidebarCollapsed ? "w-16" : "w-56"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-4 border-b border-slate-200 dark:border-zinc-800 min-h-[64px]",
            isSidebarCollapsed && "justify-center px-2"
          )}
        >
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.display_name}
              className={cn(
                "object-contain flex-shrink-0",
                isSidebarCollapsed ? "h-8 w-8 rounded-full" : "h-7 w-auto max-w-[100px]"
              )}
            />
          ) : (
            <div
              className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: tenant.primary_color }}
            >
              {tenant.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{tenant.display_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{tenant.plan} plan</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return isSidebarCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-lg mx-auto transition-all duration-150",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-zinc-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-zinc-800"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-zinc-800 p-2 space-y-1">
          {isSidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`/${tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-9 w-9 rounded-lg mx-auto text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-zinc-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">Preview Store</TooltipContent>
            </Tooltip>
          ) : (
            <a
              href={`/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-zinc-800 transition-colors"
            >
              <Store className="h-4 w-4" />
              Preview Store
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-9 text-muted-foreground hover:text-foreground"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

