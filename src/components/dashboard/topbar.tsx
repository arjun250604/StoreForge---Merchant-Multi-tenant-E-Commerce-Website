"use client";

import React from "react";
import { Moon, Sun, Bell, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface TopBarProps {
  tenant: {
    slug: string;
    display_name: string;
    logo_url: string | null;
    primary_color: string;
    plan: string;
  };
  user: User;
}

export function DashboardTopBar({ tenant, user }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const avatarInitial = (user.user_metadata?.full_name as string)?.[0]?.toUpperCase() ??
    user.email?.[0]?.toUpperCase() ??
    "M";

  return (
    <header className="glass-header h-16 flex items-center px-4 sm:px-6 lg:px-8 gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
          Store: {tenant.slug}
        </span>
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Bell className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="text-muted-foreground"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-2 pr-3">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: tenant.primary_color }}
            >
              {avatarInitial}
            </div>
            <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
              {(user.user_metadata?.full_name as string) ?? user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium text-sm truncate">
              {(user.user_metadata?.full_name as string) ?? "Merchant"}
            </p>
            <p className="text-xs text-muted-foreground font-normal truncate">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400 cursor-pointer"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

