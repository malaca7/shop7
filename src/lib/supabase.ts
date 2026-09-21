import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "user" | "moderator" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export type AdType = "item" | "servico";
export type AdStatus = "pending" | "approved" | "rejected";

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  type: AdType;
  price: number;
  images: string[];
  stock: number;
  additional_info?: string | null;
  status: AdStatus;
  rejection_reason?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  created_at: string;
  updated_at: string;
  seller_name?: string | null;
}

const env = import.meta.env as Record<string, string | undefined>;
export const supabaseUrl = env["VITE_SUPABASE_URL"] || "https://ptsfnikkvkxfzjcfuvfj.supabase.co";
export const supabaseAnonKey = env["VITE_SUPABASE_ANON_KEY"] || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0c2ZuaWtrdmt4ZnpqY2Z1dmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTgyNjMsImV4cCI6MjEwNTU5NDI2M30.zyf0_YcYIEwHkTD-GKNg5FuS7iEftjd_p7cLe3XMXww";

export const isLiveSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes("seu-projeto") &&
  !supabaseAnonKey.includes("sua-chave");

// Cliente Supabase oficial
export const supabase: SupabaseClient = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient(
      "https://shop7-demo.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
