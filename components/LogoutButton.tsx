"use client";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const logout = async () => {
    await createClient().auth.signOut();
    location.href = "/";
  };
  return <button className="btn secondary" onClick={logout}>Keluar</button>;
}