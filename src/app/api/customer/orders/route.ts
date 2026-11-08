import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const phone = searchParams.get("phone");

  if (!slug || !phone) {
    return NextResponse.json({ error: "Missing slug or phone parameters" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Find tenant by slug
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Find orders for this phone number and tenant
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, customer_name, customer_phone, total_amount, status, payment_status")
    .eq("tenant_id", tenant.id)
    .ilike("customer_phone", `%${phone}%`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: orders || [] });
}

