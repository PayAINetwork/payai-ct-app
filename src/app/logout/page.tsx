"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.replace("/login");
    };
    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-lg">Logging out...</span>
    </div>
  );
} 