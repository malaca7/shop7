import { supabase, isLiveSupabaseConfigured, type Order, type OrderStatus } from "./supabase";

const LOCAL_ORDERS_KEY = "shop7_local_orders_v1";

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: "PED-98214",
    ad_id: "ad-demo-1",
    buyer_id: "user-demo",
    seller_id: "seller-1",
    title: "Chave Global de Ativação · Cyberpunk 2077 Phantom Liberty",
    price: 139.90,
    quantity: 1,
    total_price: 139.90,
    status: "completed",
    seller_name: "KeyMaster Oficial",
    buyer_name: "Comprador SHOP7",
    activation_code: "GOG-CYBER-8842-XPL9-9121",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "PED-74190",
    ad_id: "ad-demo-2",
    buyer_id: "user-demo",
    seller_id: "seller-2",
    title: "Mousepad Gamer Extra Grande 900x400mm Speed Dark",
    price: 89.00,
    quantity: 1,
    total_price: 89.00,
    status: "completed",
    seller_name: "ProGaming Brasil",
    buyer_name: "Comprador SHOP7",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

function getLocalOrders(): Order[] {
  if (typeof window === "undefined") return INITIAL_DEMO_ORDERS;
  const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
    return INITIAL_DEMO_ORDERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_ORDERS;
  }
}

function saveLocalOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
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

    const newOrder: Order = {
      id: "PED-" + Math.floor(10000 + Math.random() * 90000),
      ad_id: params.ad_id || null,
      buyer_id: params.buyer_id,
      seller_id: params.seller_id || null,
      title: params.title,
      price: params.price,
      quantity: qty,
      total_price: totalPrice,
      status: "completed",
      seller_name: params.seller_name || "Vendedor SHOP7",
      buyer_name: params.buyer_name || "Comprador SHOP7",
      activation_code: params.activation_code || (params.title.toLowerCase().includes("chave") || params.title.toLowerCase().includes("key") ? "SHOP7-" + Math.random().toString(36).substring(2, 10).toUpperCase() : null),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .insert([{
            ad_id: newOrder.ad_id,
            buyer_id: newOrder.buyer_id,
            seller_id: newOrder.seller_id,
            title: newOrder.title,
            price: newOrder.price,
            quantity: newOrder.quantity,
            total_price: newOrder.total_price,
            status: newOrder.status,
            seller_name: newOrder.seller_name,
            buyer_name: newOrder.buyer_name,
            activation_code: newOrder.activation_code,
          }])
          .select()
          .single();

        if (!error && data) {
          const local = getLocalOrders();
          local.unshift(data);
          saveLocalOrders(local);
          return data;
        }
      } catch (err) {
        console.warn("Falha ao registrar pedido no Supabase, salvando local:", err);
      }
    }

    const local = getLocalOrders();
    local.unshift(newOrder);
    saveLocalOrders(local);
    return newOrder;
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

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn("Falha de rede em getMyPurchases:", err);
      }
    }
    const local = getLocalOrders();
    return local.filter((o) => o.buyer_id === buyerId || buyerId === "user-demo");
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

        if (!error && data && data.length > 0) {
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
