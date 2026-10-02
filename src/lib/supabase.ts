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
export const supabaseUrl = (env["VITE_SUPABASE_URL"] || "").trim();
export const supabaseAnonKey = (env["VITE_SUPABASE_ANON_KEY"] || "").trim();

// Verifica se o Supabase está de fato configurado com credenciais válidas e ativas
export const isLiveSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes("seu-projeto") &&
  !supabaseUrl.includes("shop7-demo") &&
  !supabaseUrl.includes("shop7-local") &&
  !supabaseUrl.includes("ptsfnikkvkxfzjcfuvfj") && // Projeto com DNS inexistente
  !supabaseAnonKey.includes("sua-chave") &&
  !supabaseAnonKey.includes("dummy");

// Safe fetch wrapper que intercepta qualquer erro de rede/DNS ('TypeError: Failed to fetch')
// impedindo que exceções não tratadas quebrem a aplicação React
const safeFetch: typeof fetch = async (input, init) => {
  if (!isLiveSupabaseConfigured) {
    return new Response(
      JSON.stringify({
        message: "Supabase em modo local de demonstração",
        code: "LOCAL_MODE",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    return await fetch(input, init);
  } catch (err: any) {
    console.warn(
      `[SHOP7 Supabase] Conexão indisponível (${err?.message || "Failed to fetch"}). Utilizando armazenamento local seguro.`
    );
    return new Response(
      JSON.stringify({
        message: err?.message || "Failed to fetch",
        details: "Servidor Supabase offline ou inacessível",
        code: "NETWORK_FAILURE",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Cliente Supabase oficial com proteção total contra falhas de rede
export const supabase: SupabaseClient = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: safeFetch,
      },
    })
  : createClient(
      "https://shop7-local.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: safeFetch,
        },
      }
    );
