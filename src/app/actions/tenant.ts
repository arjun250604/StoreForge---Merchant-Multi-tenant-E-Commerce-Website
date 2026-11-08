"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateThemeInput {
  tenantId: string;
  primaryColor: string;
  accentColor: string;
  fontPairing: string;
  borderRadius: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  announcementBarText?: string | null;
}

export async function updateTenantTheme(input: UpdateThemeInput) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const { error } = await supabase
    .from("tenants")
    .update({
      primary_color: input.primaryColor,
      accent_color: input.accentColor,
      font_pairing: input.fontPairing,
      border_radius: input.borderRadius,
      logo_url: input.logoUrl || null,
      banner_url: input.bannerUrl || null,
      announcement_bar_text: input.announcementBarText || null,
    })
    .eq("id", input.tenantId)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/theme");
  revalidatePath("/dashboard");
  return { success: true };
}

