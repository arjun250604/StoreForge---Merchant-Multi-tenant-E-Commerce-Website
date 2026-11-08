import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.log("Note: SUPABASE_SERVICE_ROLE_KEY is required to run the automated seeder.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Starting StoreForge India database seeding...");

  // 1. Create Demo Merchant in Auth
  const demoEmail = "artisan@jaipurcrafts.in";
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: demoEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
      full_name: "Rajeshwar Singh",
      phone: "+919876543210",
    },
  });

  const userId = authUser?.user?.id || "00000000-0000-0000-0000-000000000001";

  // 2. Create Tenant: Jaipur Crafts Studio
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .upsert(
      {
        owner_id: userId,
        slug: "jaipur-crafts",
        display_name: "Jaipur Crafts Studio",
        legal_business_name: "Jaipur Crafts & Textiles Private Limited",
        gstin: "08AABCI1234F1Z9",
        razorpay_linked_account_id: "acc_JprCrafts987",
        logo_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80",
        banner_url: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=1600&auto=format&fit=crop&q=80",
        primary_color: "#059669", // Emerald
        accent_color: "#d97706", // Amber
        font_pairing: "jakarta",
        border_radius: "modern",
        announcement_bar_text: "Festive Indian Heritage Sale — Free Express Shipping Pan-India above ₹999!",
        is_active: true,
        plan: "growth",
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (tenantError || !tenant) {
    console.error("Error creating tenant:", tenantError);
    return;
  }

  console.log(`✅ Tenant created: ${tenant.display_name} (${tenant.slug})`);

  // Update auth metadata
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
      role: "merchant",
    },
  });

  // 3. Create Categories
  const categoriesData = [
    { name: "Handblock Apparel", slug: "handblock-apparel", display_order: 1 },
    { name: "Blue Pottery", slug: "blue-pottery", display_order: 2 },
    { name: "Pure Silk Scarves", slug: "silk-scarves", display_order: 3 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const { data } = await supabase
      .from("categories")
      .upsert(
        {
          tenant_id: tenant.id,
          ...cat,
          is_active: true,
        },
        { onConflict: "tenant_id,slug" }
      )
      .select("id, slug")
      .single();

    if (data) categories[data.slug] = data.id;
  }

  console.log("✅ Categories created");

  // 4. Products with strict Indian GST Slabs & pricing
  const productsData = [
    {
      tenant_id: tenant.id,
      category_id: categories["handblock-apparel"],
      title: "Bagru Hand-Blocked Pure Cotton Kurta",
      slug: "bagru-hand-blocked-cotton-kurta",
      description: "Authentic Bagru natural dye printing on 100% fine Indian cotton. Breathable, relaxed silhouette.",
      mrp: 2499,
      selling_price: 1799,
      gst_slab: 5,
      sku: "JPR-KRT-001",
      stock_count: 18,
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      ],
      is_active: true,
      tags: ["handblock", "cotton", "sustainable"],
    },
    {
      tenant_id: tenant.id,
      category_id: categories["blue-pottery"],
      title: "Turquoise Floral Blue Pottery Vase",
      slug: "turquoise-floral-pottery-vase",
      description: "Classic Jaipur blue pottery decorative vase hand-painted with Persian-inspired floral motifs.",
      mrp: 1899,
      selling_price: 1349,
      gst_slab: 12,
      sku: "JPR-POT-002",
      stock_count: 7,
      images: [
        "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80",
      ],
      is_active: true,
      tags: ["pottery", "decor", "handicraft"],
    },
    {
      tenant_id: tenant.id,
      category_id: categories["silk-scarves"],
      title: "Mulberry Silk Zari Stole",
      slug: "mulberry-silk-zari-stole",
      description: "Woven with raw mulberry silk featuring gold zari borders. Perfect festive drape.",
      mrp: 3499,
      selling_price: 2699,
      gst_slab: 18,
      sku: "JPR-SLK-003",
      stock_count: 3, // Low-stock trigger (< 5)
      images: [
        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
      ],
      is_active: true,
      tags: ["silk", "luxury", "festive"],
    },
    {
      tenant_id: tenant.id,
      category_id: categories["blue-pottery"],
      title: "Handmade Ceramic Espresso Cups (Set of 2)",
      slug: "handmade-ceramic-espresso-cups",
      description: "Miniature ceramic glazed cups crafted by heritage potters in Sanganer.",
      mrp: 899,
      selling_price: 649,
      gst_slab: 12,
      sku: "JPR-CUP-004",
      stock_count: 0, // Out-of-stock trigger
      images: [
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
      ],
      is_active: true,
      tags: ["tableware", "ceramics"],
    },
  ];

  for (const prod of productsData) {
    await supabase.from("products").upsert(prod, { onConflict: "tenant_id,slug" });
  }

  console.log("✅ Products created (including healthy, low-stock, and out-of-stock states)");

  // 5. Seed sample orders across Placed, Packed, and Shipped states
  const sampleOrders = [
    {
      tenant_id: tenant.id,
      customer_name: "Aakash Mehta",
      customer_email: "aakash@example.com",
      customer_phone: "+919811223344",
      shipping_address: {
        full_name: "Aakash Mehta",
        phone: "+919811223344",
        pincode: "400050",
        city: "Mumbai",
        state: "Maharashtra",
        address_line_1: "Flat 402, Sea Green Apartments, Bandra West",
      },
      subtotal: 1799,
      gst_amount: 85.67,
      total_amount: 1799,
      status: "placed",
      payment_status: "paid",
      split_settlement_status: "transferred",
    },
    {
      tenant_id: tenant.id,
      customer_name: "Pooja Hegde",
      customer_email: "pooja.h@example.com",
      customer_phone: "+919844556677",
      shipping_address: {
        full_name: "Pooja Hegde",
        phone: "+919844556677",
        pincode: "560034",
        city: "Bengaluru",
        state: "Karnataka",
        address_line_1: "Villa 12, Palm Meadows, Koramangala",
      },
      subtotal: 1349,
      gst_amount: 144.54,
      total_amount: 1349,
      status: "packed",
      payment_status: "paid",
      split_settlement_status: "transferred",
    },
    {
      tenant_id: tenant.id,
      customer_name: "Vikram Rathore",
      customer_email: "vikram@example.com",
      customer_phone: "+919711889900",
      shipping_address: {
        full_name: "Vikram Rathore",
        phone: "+919711889900",
        pincode: "110001",
        city: "New Delhi",
        state: "Delhi",
        address_line_1: "15, Barakhamba Road, Connaught Place",
      },
      subtotal: 2699,
      gst_amount: 411.71,
      total_amount: 2699,
      status: "shipped",
      payment_status: "paid",
      split_settlement_status: "transferred",
    },
  ];

  for (const ord of sampleOrders) {
    await supabase.from("orders").insert(ord);
  }

  console.log("✅ Kanban orders seeded across Placed, Packed, and Shipped columns");
  console.log("✨ Database seed completed successfully!");
}

seed().catch(console.error);

