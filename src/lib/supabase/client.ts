"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

let clientInstance: ReturnType<typeof createBrowserClient<any>> | null =
  null;

export function createSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createBrowserClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return clientInstance;
}
