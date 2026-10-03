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

export type OrderStatus = "pending" | "completed" | "cancelled" | "refunded";

export interface Order {
  id: string;
  ad_id?: string | null;
  buyer_id: string;
  seller_id?: string | null;
  title: string;
  price: number;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  seller_name?: string | null;
  buyer_name?: string | null;
  activation_code?: string | null;
  created_at: string;
  updated_at?: string;
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

export let isSupabaseEgressExceeded = false;

// Safe fetch wrapper que intercepta erros de rede/DNS e detecta cota de egress do Supabase
const safeFetch: typeof fetch = async (input, init) => {
  if (!isLiveSupabaseConfigured) {
    return new Response(
      JSON.stringify({
        message: "Configuração de Supabase ausente ou inválida",
        code: "UNCONFIGURED",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const res = await fetch(input, init);
    if (res.status === 402) {
      isSupabaseEgressExceeded = true;
    }
    return res;
  } catch (err: any) {
    console.warn(
      `[SHOP7 Supabase] Conexão indisponível (${err?.message || "Failed to fetch"}). Operando em modo tolerante a falhas.`
    );
    return new Response(
      JSON.stringify({
        message: err?.message || "Failed to fetch",
        details: "Servidor Supabase temporariamente inacessível",
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

// Cliente Supabase oficial
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://vpxpfbacysibxlfjayks.supabase.co",
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: safeFetch,
    },
  }
);
