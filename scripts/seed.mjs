import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        val = val.trim().replace(/^['"](.*)['"]$/, "$1");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  // Ignore
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes("your-service-role-key")) {
  console.log("ℹ️  To run automated database seeding, configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.log("💡 Alternatively, execute schema.sql directly in your Supabase SQL Editor!");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Starting StoreForge India database seeding...");

  const demoEmail = "merchant@jaipurcrafts.in";
  let userId;

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const existingUser = usersData?.users?.find((u) => u.email === demoEmail);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`ℹ️  Using existing user ${demoEmail} (${userId})`);
  } else {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: "Password123!",
      email_confirm: true,
      user_metadata: {
        full_name: "Rajeshwar Singh",
        phone: "+919876543210",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return;
    }
    userId = authUser.user.id;
    console.log(`✅ Demo merchant account created: ${demoEmail}`);
  }

  // Upsert Tenant: Jaipur Crafts Studio
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
        primary_color: "#059669",
        accent_color: "#d97706",
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

  console.log(`✅ Storefront online: ${tenant.display_name} (Slug: ${tenant.slug})`);

  // Update auth metadata
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
      role: "merchant",
    },
  });

  // Create Categories
  const categoriesData = [
    { name: "Handblock Apparel", slug: "handblock-apparel", display_order: 1 },
    { name: "Blue Pottery", slug: "blue-pottery", display_order: 2 },
    { name: "Pure Silk Scarves", slug: "silk-scarves", display_order: 3 },
  ];

  const categories = {};
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

  // Create Products
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
      stock_count: 3,
      images: [
        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
      ],
      is_active: true,
      tags: ["silk", "luxury", "festive"],
    },
  ];

  for (const prod of productsData) {
    await supabase.from("products").upsert(prod, { onConflict: "tenant_id,slug" });
  }

  // Create Sample Orders
  const sampleOrders = [
    {
      tenant_id: tenant.id,
      customer_name: "Aakash Mehta",
      customer_email: "aakash@example.com",
      customer_phone: "9811223344",
      shipping_address: {
        full_name: "Aakash Mehta",
        phone: "9811223344",
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
      customer_phone: "9844556677",
      shipping_address: {
        full_name: "Pooja Hegde",
        phone: "9844556677",
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
      customer_phone: "9711889900",
      shipping_address: {
        full_name: "Vikram Rathore",
        phone: "9711889900",
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

  console.log("✨ Seed completed successfully! You can now log in with merchant@jaipurcrafts.in / Password123! or visit /jaipur-crafts");
}

seed().catch(console.error);
