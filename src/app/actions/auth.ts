"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Data,
  type RegisterStep2Data,
  type RegisterStep3Data,
} from "@/lib/validations";

interface RegisterTenantInput {
  account: RegisterStep1Data;
  business: RegisterStep2Data;
  theme: RegisterStep3Data;
}

interface RegisterTenantResult {
  success: boolean;
  tenantSlug?: string;
  error?: string;
}

export async function checkSubdomainAvailable(slug: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug.toLowerCase().trim())
    .single();

  return !data;
}

export async function registerTenant(
  input: RegisterTenantInput
): Promise<RegisterTenantResult> {
  // Validate all steps strictly with Zod
  const accountParsed = registerStep1Schema.safeParse(input.account);
  if (!accountParsed.success) {
    return { success: false, error: accountParsed.error.errors[0]?.message };
  }

  const businessParsed = registerStep2Schema.safeParse(input.business);
  if (!businessParsed.success) {
    return { success: false, error: businessParsed.error.errors[0]?.message };
  }

  const themeParsed = registerStep3Schema.safeParse(input.theme);
  if (!themeParsed.success) {
    return { success: false, error: themeParsed.error.errors[0]?.message };
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Verify subdomain availability
  const isAvailable = await checkSubdomainAvailable(businessParsed.data.slug);
  if (!isAvailable) {
    return { success: false, error: "Subdomain is already taken. Please choose another." };
  }

  // 2. Create the user in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: accountParsed.data.email,
    password: accountParsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: accountParsed.data.fullName,
      phone: accountParsed.data.phone,
    },
  });

  if (authError || !authUser.user) {
    return { success: false, error: authError?.message || "Failed to create merchant account." };
  }

  const userId = authUser.user.id;

  // 3. Create the tenant record
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      owner_id: userId,
      slug: businessParsed.data.slug.toLowerCase().trim(),
      display_name: businessParsed.data.displayName,
      legal_business_name: businessParsed.data.legalBusinessName,
      gstin: businessParsed.data.gstin || null,
      razorpay_linked_account_id: businessParsed.data.razorpayLinkedAccountId || null,
      logo_url: themeParsed.data.logoUrl || null,
      banner_url: themeParsed.data.bannerUrl || null,
      primary_color: themeParsed.data.primaryColor,
      accent_color: themeParsed.data.accentColor,
      font_pairing: themeParsed.data.fontPairing,
      border_radius: themeParsed.data.borderRadius,
      is_active: true,
      plan: "free",
    })
    .select("id, slug")
    .single();

  if (tenantError || !tenant) {
    // Rollback user creation
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { success: false, error: "Failed to create tenant: " + tenantError?.message };
  }

  // 4. Update the user's JWT custom claims with tenant_id in app_metadata
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
      role: "merchant",
    },
  });

  // 5. Seed default categories & demo products so storefront is ready to showcase
  const { data: defaultCategory } = await supabaseAdmin
    .from("categories")
    .insert({
      tenant_id: tenant.id,
      name: "Featured Collection",
      slug: "featured",
      display_order: 1,
      is_active: true,
    })
    .select("id")
    .single();

  if (defaultCategory) {
    await supabaseAdmin.from("products").insert([
      {
        tenant_id: tenant.id,
        category_id: defaultCategory.id,
        title: "Handcrafted Artisan Coffee Mug",
        slug: "handcrafted-artisan-coffee-mug",
        description: "Locally crafted ceramic coffee mug with matte glazed finish.",
        mrp: 899,
        selling_price: 649,
        gst_slab: 12,
        sku: "MUG-001",
        stock_count: 25,
        images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"],
        is_active: true,
        tags: ["kitchenware", "handmade"],
      },
      {
        tenant_id: tenant.id,
        category_id: defaultCategory.id,
        title: "Pure Linen Oversized Shirt",
        slug: "pure-linen-oversized-shirt",
        description: "100% organic Indian linen breathable everyday shirt.",
        mrp: 2499,
        selling_price: 1899,
        gst_slab: 5,
        sku: "SHIRT-001",
        stock_count: 14,
        images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80"],
        is_active: true,
        tags: ["apparel", "linen"],
      },
    ]);
  }

  return {
    success: true,
    tenantSlug: tenant.slug,
  };
}

