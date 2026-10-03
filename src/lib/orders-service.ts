import { supabase, isLiveSupabaseConfigured, type Order, type OrderStatus } from "./supabase";

const LOCAL_ORDERS_KEY = "shop7_local_orders_v1";

const INITIAL_DEMO_ORDERS: Order[] = [];

function getLocalOrders(): Order[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const list: Order[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Higienização automática: remover pedidos fictícios residuais
    const cleaned = list.filter(
      (o) =>
        o.buyer_id !== "user-demo" &&
        o.id !== "PED-98214" &&
        o.id !== "PED-74190" &&
        !o.buyer_id?.includes("demo")
    );
    if (cleaned.length !== list.length) {
      saveLocalOrders(cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

export function subscribeToOrders(onEvent: () => void) {
  if (!isLiveSupabaseConfigured) return () => {};
  const channel = supabase
    .channel("realtime_orders_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => {
        onEvent();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export const OrdersService = {
  // 1. Criar novo pedido (Compra realizada por usuário)
  async createOrder(params: {
    ad_id?: string;
    buyer_id: string;
    seller_id?: string;
    title: string;
    price: number;
    quantity?: number;
    seller_name?: string;
    buyer_name?: string;
    activation_code?: string;
  }): Promise<Order> {
    const qty = params.quantity || 1;
    const totalPrice = params.price * qty;

    const newOrderPayload = {
      ad_id: params.ad_id || null,
      buyer_id: params.buyer_id,
      seller_id: params.seller_id || null,
      title: params.title,
      price: params.price,
      quantity: qty,
      total_price: totalPrice,
      status: "completed" as const,
      seller_name: params.seller_name || "Vendedor SHOP7",
      buyer_name: params.buyer_name || "Comprador SHOP7",
      activation_code:
        params.activation_code ||
        (params.title.toLowerCase().includes("chave") ||
        params.title.toLowerCase().includes("key")
          ? "SHOP7-" + Math.random().toString(36).substring(2, 10).toUpperCase()
          : null),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .insert([newOrderPayload])
          .select()
          .single();

        if (!error && data) {
          const local = getLocalOrders();
          local.unshift(data);
          saveLocalOrders(local);
          return data;
        }
        if (error) {
          console.warn("Aviso ao criar pedido no Supabase:", error.message);
        }
      } catch (err: any) {
        console.warn("Falha ao registrar pedido no Supabase:", err?.message || err);
      }
    }

    const fallbackOrder: Order = {
      id: "PED-" + Math.floor(10000 + Math.random() * 90000),
      ...newOrderPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const local = getLocalOrders();
    local.unshift(fallbackOrder);
    saveLocalOrders(local);
    return fallbackOrder;
  },

  // 2. Obter compras de um usuário (comprador)
  async getMyPurchases(buyerId: string): Promise<Order[]> {
    if (!buyerId) return [];
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("buyer_id", buyerId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          saveLocalOrders(data);
          return data;
        }
      } catch (err) {
        console.warn("Falha de rede em getMyPurchases:", err);
      }
    }
    const local = getLocalOrders();
    return local.filter((o) => o.buyer_id === buyerId);
  },

  // 3. Obter vendas de um usuário (vendedor)
  async getMySales(sellerId: string): Promise<Order[]> {
    if (!sellerId) return [];
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("Falha em getMySales:", err);
      }
    }
    const local = getLocalOrders();
    return local.filter((o) => o.seller_id === sellerId);
  },

  // 4. Obter todos os pedidos (Admin / Moderador)
  async getAllOrders(): Promise<Order[]> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          saveLocalOrders(data);
          return data;
        }
      } catch (err) {
        console.warn("Falha em getAllOrders:", err);
      }
    }
    return getLocalOrders();
  },

  // 5. Atualizar status de pedido
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("Falha em updateOrderStatus:", err);
      }
    }

    const local = getLocalOrders();
    const idx = local.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      local[idx].status = status;
      local[idx].updated_at = new Date().toISOString();
      saveLocalOrders(local);
      return local[idx];
    }
    throw new Error("Pedido não encontrado");
  },
};
