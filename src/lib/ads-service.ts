import { supabase, isLiveSupabaseConfigured, type Ad, type AdStatus, type Profile, type UserRole } from "./supabase";

const LOCAL_ADS_KEY = "shop7_local_ads_v1";
const LOCAL_PROFILES_KEY = "shop7_local_profiles_v1";

// Mock inicial realista para demonstração imediata
const INITIAL_DEMO_ADS: Ad[] = [
  {
    id: "ad-demo-1",
    user_id: "user-demo-1",
    title: "Conta Valorant Imortal 3 · Vandal Vingança de Gaia + Passes",
    description: "Conta com nível 184, 4 passes completos, skins premium e e-mail de criação liberado para troca imediata.",
    category: "contas",
    type: "item",
    price: 349.90,
    images: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60",
    ],
    stock: 1,
    additional_info: "Acesso total via e-mail. Troca de dados guiada pela mediação SHOP7.",
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    seller_name: "ShadowGamer",
  },
  {
    id: "ad-demo-2",
    user_id: "user-demo-2",
    title: "Setup de Servidor Discord para Comunidades & Streamers",
    description: "Configuração completa de bots, canais de voz temporários, automação de cargos, logs e proteção anti-raid.",
    category: "servicos",
    type: "servico",
    price: 120.00,
    images: [
      "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=800&auto=format&fit=crop&q=60",
    ],
    stock: 10,
    additional_info: "Entrega em até 48h com suporte de 7 dias após a finalização.",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    seller_name: "PixelCraft Design",
  },
  {
    id: "ad-demo-3",
    user_id: "user-demo-3",
    title: "Headset Gamer Sem Fio 7.1 Surround · Zero Latência",
    description: "Headset novo, lacrado na caixa. Microfone removível com cancelamento de ruído, bateria de 40 horas.",
    category: "produtos-fisicos",
    type: "item",
    price: 489.00,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
    ],
    stock: 3,
    additional_info: "Envio em até 24h úteis via Sedex com código de rastreio nacional.",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    seller_name: "CyberStore SP",
  },
];

const INITIAL_DEMO_PROFILES: Profile[] = [
  {
    id: "user-demo-1",
    email: "usuario@shop7.com",
    full_name: "Carlos Eduardo",
    avatar_url: null,
    role: "user",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "mod-demo-1",
    email: "moderador@shop7.com",
    full_name: "Beatriz Mod",
    avatar_url: null,
    role: "moderator",
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "admin-demo-1",
    email: "admin@shop7.com",
    full_name: "Administrador SHOP7",
    avatar_url: null,
    role: "admin",
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
];

function getLocalAds(): Ad[] {
  if (typeof window === "undefined") return INITIAL_DEMO_ADS;
  const raw = localStorage.getItem(LOCAL_ADS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(INITIAL_DEMO_ADS));
    return INITIAL_DEMO_ADS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_ADS;
  }
}

function saveLocalAds(ads: Ad[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(ads));
}

function getLocalProfiles(): Profile[] {
  if (typeof window === "undefined") return INITIAL_DEMO_PROFILES;
  const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(INITIAL_DEMO_PROFILES));
    return INITIAL_DEMO_PROFILES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PROFILES;
  }
}

function saveLocalProfiles(profiles: Profile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

export const AdsService = {
  // 1. Obter anúncios aprovados (Público / Marketplace)
  async getApprovedAds(): Promise<Ad[]> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Erro ao carregar anúncios aprovados do Supabase:", error);
        return [];
      }
      return data || [];
    }
    return getLocalAds().filter((a) => a.status === "approved");
  },

  // 2. Obter anúncios do próprio usuário logado
  async getMyAds(userId: string): Promise<Ad[]> {
    if (!userId) return [];
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Supabase ads indisponível ou tabela ainda não criada, usando fallback:", error.message);
        return getLocalAds().filter((a) => a.user_id === userId);
      }
      return data || [];
    }
    return getLocalAds().filter((a) => a.user_id === userId);
  },

  // 3. Obter todos os anúncios pendentes (Moderadores & Admins)
  async getPendingAds(): Promise<Ad[]> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Supabase pending ads indisponível ou tabela ainda não criada, usando fallback:", error.message);
        return getLocalAds().filter((a) => a.status === "pending");
      }
      return data || [];
    }
    return getLocalAds().filter((a) => a.status === "pending");
  },

  // 4. Obter todos os anúncios com filtro de status opcional (Moderadores & Admins)
  async getAllAds(statusFilter?: AdStatus): Promise<Ad[]> {
    if (isLiveSupabaseConfigured) {
      let query = supabase.from("ads").select("*").order("created_at", { ascending: false });
      if (statusFilter) query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) {
        console.warn("Supabase ads indisponível ou tabela ainda não criada, usando fallback:", error.message);
        const all = getLocalAds();
        return statusFilter ? all.filter((a) => a.status === statusFilter) : all;
      }
      return data || [];
    }
    const all = getLocalAds();
    return statusFilter ? all.filter((a) => a.status === statusFilter) : all;
  },

  // 5. Criar novo anúncio (SEMPRE inicia como 'pending')
  async createAd(
    adData: Omit<Ad, "id" | "status" | "rejection_reason" | "moderated_by" | "moderated_at" | "created_at" | "updated_at">
  ): Promise<Ad> {
    const payload = {
      ...adData,
      status: "pending" as const,
      rejection_reason: null,
      moderated_by: null,
      moderated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("ads").insert([payload]).select().single();
        if (!error && data) return data;
        console.warn("Falha ao inserir no Supabase (verifique se executou supabase/schema.sql no SQL Editor):", error?.message);
      } catch (e: any) {
        console.warn("Exceção no Supabase insert:", e.message);
      }
    }

    const newAd: Ad = {
      ...payload,
      id: "ad-" + Date.now(),
    };
    const ads = getLocalAds();
    ads.unshift(newAd);
    saveLocalAds(ads);
    return newAd;
  },

  // 6. Atualizar anúncio existente (Dono)
  // Regra de Ouro: Edição de anúncio reverte para 'pending' e exige nova aprovação!
  async updateAd(id: string, updateData: Partial<Ad>): Promise<Ad> {
    const changes = {
      ...updateData,
      status: "pending" as const, // Força retorno para moderação
      rejection_reason: null,
      moderated_by: null,
      moderated_at: null,
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ads")
        .update(changes)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const ads = getLocalAds();
    const index = ads.findIndex((a) => a.id === id);
    const existing = ads[index];
    if (!existing) throw new Error("Anúncio não encontrado");
    const updatedAd: Ad = {
      ...existing,
      ...changes,
      id: existing.id,
      user_id: existing.user_id,
      title: changes.title ?? existing.title,
      description: changes.description ?? existing.description,
      category: changes.category ?? existing.category,
      type: changes.type ?? existing.type,
      price: changes.price ?? existing.price,
      images: changes.images ?? existing.images,
      stock: changes.stock ?? existing.stock,
      additional_info: (changes.additional_info !== undefined ? changes.additional_info : existing.additional_info) ?? null,
      seller_name: (changes.seller_name !== undefined ? changes.seller_name : existing.seller_name) ?? null,
    };
    ads[index] = updatedAd;
    saveLocalAds(ads);
    return updatedAd;
  },

  // 7. Moderar anúncio: Aprovar ou Rejeitar (Moderador / Admin)
  async moderateAd(
    id: string,
    status: "approved" | "rejected",
    reason?: string,
    moderatorId?: string
  ): Promise<Ad> {
    const changes = {
      status,
      rejection_reason: status === "rejected" ? reason || "Não especificado" : null,
      moderated_by: moderatorId || null,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ads")
        .update(changes)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const ads = getLocalAds();
    const index = ads.findIndex((a) => a.id === id);
    const existing = ads[index];
    if (!existing) throw new Error("Anúncio não encontrado");
    const updatedAd: Ad = {
      ...existing,
      ...changes,
    };
    ads[index] = updatedAd;
    saveLocalAds(ads);
    return updatedAd;
  },

  // 8. Excluir anúncio
  async deleteAd(id: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    }
    const ads = getLocalAds().filter((a) => a.id !== id);
    saveLocalAds(ads);
    return true;
  },

  // 9. Gestão de Usuários (Admin)
  async getAllProfiles(): Promise<Profile[]> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) {
        console.warn("Supabase profiles indisponível ou tabela ainda não criada, usando fallback:", error.message);
        return getLocalProfiles();
      }
      return data || [];
    }
    return getLocalProfiles();
  },

  // 10. Alterar Role do Usuário (Admin)
  async updateUserRole(userId: string, newRole: UserRole): Promise<Profile> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    const profiles = getLocalProfiles();
    const index = profiles.findIndex((p) => p.id === userId);
    const existingProf = profiles[index];
    if (!existingProf) throw new Error("Usuário não encontrado");
    const updatedProf: Profile = {
      ...existingProf,
      role: newRole,
      updated_at: new Date().toISOString(),
    };
    profiles[index] = updatedProf;
    saveLocalProfiles(profiles);
    return updatedProf;
  },
};
