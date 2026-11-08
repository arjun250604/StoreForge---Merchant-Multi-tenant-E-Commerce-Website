import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopBar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, display_name, logo_url, primary_color, plan")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) {
    redirect("/register");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar tenant={tenant} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopBar tenant={tenant} user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

