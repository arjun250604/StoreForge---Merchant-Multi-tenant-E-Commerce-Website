export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─────────────────────────────────────────────────────────────────────────────
// Database Type Definition — StoreForge India
// Matches Supabase JS v2 PostgREST schema requirements
// ─────────────────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          owner_id: string;
          slug: string;
          display_name: string;
          legal_business_name: string;
          gstin: string | null;
          razorpay_linked_account_id: string | null;
          logo_url: string | null;
          banner_url: string | null;
          primary_color: string;
          accent_color: string;
          font_pairing: string;
          border_radius: string;
          announcement_bar_text: string | null;
          is_active: boolean;
          plan: "free" | "growth" | "pro";
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          owner_id: string;
          slug: string;
          display_name: string;
          legal_business_name: string;
          gstin?: string | null;
          razorpay_linked_account_id?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          font_pairing?: string;
          border_radius?: string;
          announcement_bar_text?: string | null;
          is_active?: boolean;
          plan?: "free" | "growth" | "pro";
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          owner_id?: string;
          slug?: string;
          display_name?: string;
          legal_business_name?: string;
          gstin?: string | null;
          razorpay_linked_account_id?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          font_pairing?: string;
          border_radius?: string;
          announcement_bar_text?: string | null;
          is_active?: boolean;
          plan?: "free" | "growth" | "pro";
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          tenant_id: string;
          category_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          mrp: number;
          selling_price: number;
          gst_slab: number;
          sku: string | null;
          stock_count: number;
          images: string[];
          is_active: boolean;
          tags: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tenant_id: string;
          category_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          mrp: number;
          selling_price: number;
          gst_slab?: number;
          sku?: string | null;
          stock_count?: number;
          images?: string[];
          is_active?: boolean;
          tags?: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tenant_id?: string;
          category_id?: string | null;
          title?: string;
          slug?: string;
          description?: string | null;
          mrp?: number;
          selling_price?: number;
          gst_slab?: number;
          sku?: string | null;
          stock_count?: number;
          images?: string[];
          is_active?: boolean;
          tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          tenant_id: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string;
          shipping_address: Json;
          subtotal: number;
          gst_amount: number;
          total_amount: number;
          status: "placed" | "packed" | "shipped" | "delivered" | "cancelled";
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          payment_status: "pending" | "paid" | "failed" | "refunded";
          split_settlement_status: "pending" | "transferred" | "failed";
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tenant_id: string;
          customer_name: string;
          customer_email?: string | null;
          customer_phone: string;
          shipping_address: Json;
          subtotal: number;
          gst_amount: number;
          total_amount: number;
          status?: "placed" | "packed" | "shipped" | "delivered" | "cancelled";
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          split_settlement_status?: "pending" | "transferred" | "failed";
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tenant_id?: string;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string;
          shipping_address?: Json;
          subtotal?: number;
          gst_amount?: number;
          total_amount?: number;
          status?: "placed" | "packed" | "shipped" | "delivered" | "cancelled";
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          split_settlement_status?: "pending" | "transferred" | "failed";
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          created_at: string;
          order_id: string;
          tenant_id: string;
          product_id: string;
          product_title: string;
          product_sku: string | null;
          quantity: number;
          unit_price: number;
          gst_slab: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          order_id: string;
          tenant_id: string;
          product_id: string;
          product_title: string;
          product_sku?: string | null;
          quantity: number;
          unit_price: number;
          gst_slab?: number;
          line_total: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          order_id?: string;
          tenant_id?: string;
          product_id?: string;
          product_title?: string;
          product_sku?: string | null;
          quantity?: number;
          unit_price?: number;
          gst_slab?: number;
          line_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_tenant_by_slug: {
        Args: { p_slug: string };
        Returns: Database["public"]["Tables"]["tenants"]["Row"][];
      };
      get_tenant_kpis: {
        Args: { p_tenant_id: string };
        Returns: {
          gross_revenue: number;
          paid_revenue: number;
          active_orders: number;
          low_stock_count: number;
        }[];
      };
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number };
        Returns: void;
      };
    };
    Enums: {
      order_status: "placed" | "packed" | "shipped" | "delivered" | "cancelled";
      payment_status: "pending" | "paid" | "failed" | "refunded";
      settlement_status: "pending" | "transferred" | "failed";
      tenant_plan: "free" | "growth" | "pro";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
export type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderItemUpdate = Database["public"]["Tables"]["order_items"]["Update"];

export type OrderStatus = Order["status"];
export type PaymentStatus = Order["payment_status"];
export type SettlementStatus = Order["split_settlement_status"];

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
}
