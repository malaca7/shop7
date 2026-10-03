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
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    role: "user",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "user-demo-2",
    email: "mariana.costa@gmail.com",
    full_name: "Mariana Costa",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    role: "user",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "mod-demo-1",
    email: "moderador@shop7.com",
    full_name: "Beatriz Mod",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    role: "moderator",
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "admin-demo-1",
    email: "admin@shop7.com",
    full_name: "Administrador SHOP7",
    avatar_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
    role: "admin",
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: "admin-malaca-1",
    email: "malacarogeriojr@gmail.com",
    full_name: "Rogério Malaquias Jr",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  let list: Profile[] = [];
  if (!raw) {
    list = [...INITIAL_DEMO_PROFILES];
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  } else {
    try {
      list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        list = [...INITIAL_DEMO_PROFILES];
        localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
      }
    } catch {
      list = [...INITIAL_DEMO_PROFILES];
    }
  }

  // Sincroniza usuário da sessão ativa atual caso não esteja na lista
  try {
    const activeSessionRaw = localStorage.getItem("shop7_active_auth_session_v1");
    if (activeSessionRaw) {
      const parsed = JSON.parse(activeSessionRaw);
      if (parsed?.profile?.email) {
        const foundIndex = list.findIndex(
          (p) =>
            p.id === parsed.profile.id ||
            p.email?.toLowerCase().trim() === parsed.profile.email.toLowerCase().trim()
        );
        if (foundIndex >= 0) {
          list[foundIndex] = { ...list[foundIndex], ...parsed.profile };
        } else {
          list.unshift(parsed.profile);
        }
        localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {}

  // Garantir que malacarogeriojr@gmail.com sempre conste como admin
  const malacaProfile = list.find((p) => p.email?.toLowerCase().trim() === "malacarogeriojr@gmail.com");
  if (!malacaProfile) {
    list.unshift({
      id: "admin-malaca-1",
      email: "malacarogeriojr@gmail.com",
      full_name: "Rogério Malaquias Jr",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  } else if (malacaProfile.role !== "admin") {
    malacaProfile.role = "admin";
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  }

  return list;
}

function saveLocalProfiles(profiles: Profile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

export const AdsService = {
  // 1. Obter anúncios aprovados (Público / Marketplace)
  async getApprovedAds(): Promise<Ad[]> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("ads")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        if (error) {
          console.warn("Supabase indisponível ao carregar anúncios aprovados, usando fallback local:", error.message);
          return getLocalAds().filter((a) => a.status === "approved");
        }
        if (data && data.length > 0) {
          return data;
        }
        return getLocalAds().filter((a) => a.status === "approved");
      } catch (err) {
        console.warn("Falha de rede em getApprovedAds, usando fallback local:", err);
        return getLocalAds().filter((a) => a.status === "approved");
      }
    }
    return getLocalAds().filter((a) => a.status === "approved");
  },

  // 2. Obter anúncios do próprio usuário logado
  async getMyAds(userId: string): Promise<Ad[]> {
    if (!userId) return [];
    if (isLiveSupabaseConfigured) {
      try {
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
      } catch (err) {
        console.warn("Falha de rede em getMyAds, usando fallback:", err);
        return getLocalAds().filter((a) => a.user_id === userId);
      }
    }
    return getLocalAds().filter((a) => a.user_id === userId);
  },

  // 3. Obter todos os anúncios pendentes (Moderadores & Admins)
  async getPendingAds(): Promise<Ad[]> {
    if (isLiveSupabaseConfigured) {
      try {
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
      } catch (err) {
        console.warn("Falha de rede em getPendingAds, usando fallback:", err);
        return getLocalAds().filter((a) => a.status === "pending");
      }
    }
    return getLocalAds().filter((a) => a.status === "pending");
  },

  // 4. Obter todos os anúncios com filtro de status opcional (Moderadores & Admins)
  async getAllAds(statusFilter?: AdStatus): Promise<Ad[]> {
    if (isLiveSupabaseConfigured) {
      try {
        let query = supabase.from("ads").select("*").order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        const { data, error } = await query;
        if (error) {
          console.warn("Supabase ads indisponível ou tabela ainda não criada, usando fallback:", error.message);
          const all = getLocalAds();
          return statusFilter ? all.filter((a) => a.status === statusFilter) : all;
        }
        return data || [];
      } catch (err) {
        console.warn("Falha de rede em getAllAds, usando fallback:", err);
        const all = getLocalAds();
        return statusFilter ? all.filter((a) => a.status === statusFilter) : all;
      }
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
        if (!error && data) {
          const ads = getLocalAds();
          ads.unshift(data);
          saveLocalAds(ads);
          return data;
        }
        console.warn("Falha ao inserir no Supabase (verifique schema.sql), gravando local:", error?.message);
      } catch (e: any) {
        console.warn("Exceção no Supabase insert, gravando local:", e.message);
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

    let updatedFromDb: Ad | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("ads")
          .update(changes)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) {
          updatedFromDb = data;
        } else {
          console.warn("Falha ao atualizar no Supabase, salvando localmente:", error?.message);
        }
      } catch (err) {
        console.warn("Supabase indisponível em updateAd, salvando localmente:", err);
      }
    }

    const ads = getLocalAds();
    const index = ads.findIndex((a) => a.id === id);
    if (index !== -1) {
      const existing = ads[index];
      const updatedAd: Ad = updatedFromDb || {
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
    }

    if (updatedFromDb) return updatedFromDb;
    throw new Error("Anúncio não encontrado");
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

    let moderatedFromDb: Ad | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("ads")
          .update(changes)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) {
          moderatedFromDb = data;
        } else {
          console.warn("Falha ao moderar no Supabase, aplicando localmente:", error?.message);
        }
      } catch (err) {
        console.warn("Supabase indisponível em moderateAd, aplicando localmente:", err);
      }
    }

    const ads = getLocalAds();
    const index = ads.findIndex((a) => a.id === id);
    if (index !== -1) {
      const existing = ads[index];
      const updatedAd: Ad = moderatedFromDb || {
        ...existing,
        ...changes,
      };
      ads[index] = updatedAd;
      saveLocalAds(ads);
      return updatedAd;
    }

    if (moderatedFromDb) return moderatedFromDb;
    throw new Error("Anúncio não encontrado");
  },

  // 8. Excluir anúncio
  async deleteAd(id: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.from("ads").delete().eq("id", id);
        if (error) {
          console.warn("Falha ao excluir no Supabase, excluindo localmente:", error.message);
        }
      } catch (err) {
        console.warn("Supabase indisponível em deleteAd, excluindo localmente:", err);
      }
    }
    const ads = getLocalAds().filter((a) => a.id !== id);
    saveLocalAds(ads);
    return true;
  },

  // 9. Gestão de Usuários (Admin)
  async getAllProfiles(): Promise<Profile[]> {
    const local = getLocalProfiles();
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) {
          console.warn("Supabase profiles indisponível, usando fallback:", error.message);
          return local;
        }
        if (data && Array.isArray(data)) {
          // Mesclar perfis do Supabase com os locais (Supabase tem prioridade)
          const merged: Profile[] = [...data];
          const dbIds = new Set(data.map((p) => p.id));
          const dbEmails = new Set(data.map((p) => (p.email || "").toLowerCase().trim()));
          for (const lp of local) {
            const lpEmail = (lp.email || "").toLowerCase().trim();
            if (!dbIds.has(lp.id) && (!lpEmail || !dbEmails.has(lpEmail))) {
              merged.push(lp);
            }
          }
          return merged;
        }
      } catch (err) {
        console.warn("Supabase offline em getAllProfiles, usando fallback:", err);
      }
    }
    return local;
  },

  // 10. Alterar Role do Usuário (Admin)
  async updateUserRole(userId: string, newRole: UserRole): Promise<Profile> {
    return this.updateProfileData(userId, { role: newRole });
  },

  // 11. Criar novo usuário (Admin / Moderador)
  async createProfile(data: {
    email: string;
    full_name?: string;
    avatar_url?: string | null;
    role?: UserRole;
  }): Promise<Profile> {
    const emailClean = (data.email || "").trim().toLowerCase();
    const newProfile: Profile = {
      id: "user-" + Date.now(),
      email: data.email.trim(),
      full_name: data.full_name?.trim() || data.email.split("@")[0],
      avatar_url: data.avatar_url?.trim() || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      role: data.role || "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let createdFromDb: Profile | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbData, error } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();
        if (!error && dbData) {
          createdFromDb = dbData;
        }
      } catch (err) {
        console.warn("Supabase indisponível em createProfile, salvando localmente:", err);
      }
    }

    const finalProfile = createdFromDb || newProfile;
    const profiles = getLocalProfiles();
    const filtered = profiles.filter((p) => p.email?.toLowerCase().trim() !== emailClean && p.id !== finalProfile.id);
    filtered.unshift(finalProfile);
    saveLocalProfiles(filtered);
    return finalProfile;
  },

  // 12. Atualizar qualquer perfil por completo (Admin / Moderador)
  async updateProfileData(userId: string, data: Partial<Profile>): Promise<Profile> {
    const changes = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    let updatedFromDb: Profile | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbData, error } = await supabase
          .from("profiles")
          .update(changes)
          .eq("id", userId)
          .select()
          .single();
        if (!error && dbData) {
          updatedFromDb = dbData;
        }
      } catch (err) {
        console.warn("Supabase indisponível em updateProfileData:", err);
      }
    }

    const profiles = getLocalProfiles();
    const normalizedEmail = (data.email || "").toLowerCase().trim();
    const index = profiles.findIndex(
      (p) =>
        p.id === userId ||
        (normalizedEmail && p.email?.toLowerCase().trim() === normalizedEmail)
    );

    let finalProfile: Profile;
    if (index !== -1) {
      const existing = profiles[index];
      finalProfile = updatedFromDb || {
        ...existing,
        ...changes,
      };
      profiles[index] = finalProfile;
    } else {
      finalProfile = updatedFromDb || {
        id: userId,
        email: data.email || "usuario@shop7.com",
        full_name: data.full_name || null,
        avatar_url: data.avatar_url || null,
        role: data.role || "user",
        created_at: new Date().toISOString(),
        ...changes,
      };
      profiles.unshift(finalProfile);
    }

    saveLocalProfiles(profiles);

    // Sincronizar também a sessão ativa se for o usuário logado
    try {
      const activeSessionRaw = localStorage.getItem("shop7_active_auth_session_v1");
      if (activeSessionRaw) {
        const parsed = JSON.parse(activeSessionRaw);
        if (
          parsed?.user?.id === userId ||
          (parsed?.user?.email && parsed.user.email.toLowerCase().trim() === finalProfile.email?.toLowerCase().trim())
        ) {
          parsed.profile = { ...parsed.profile, ...finalProfile };
          localStorage.setItem("shop7_active_auth_session_v1", JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    return finalProfile;
  },

  // 13. Excluir usuário e opcionalmente seus dados (Admin / Moderador)
  async deleteProfile(userId: string): Promise<boolean> {
    const profiles = getLocalProfiles();
    const target = profiles.find((p) => p.id === userId);
    const targetEmail = (target?.email || "").toLowerCase().trim();

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from("profiles").delete().eq("id", userId);
        if (targetEmail) {
          await supabase.from("profiles").delete().eq("email", targetEmail);
        }
      } catch (err) {
        console.warn("Supabase indisponível em deleteProfile:", err);
      }
    }

    const filteredProfiles = profiles.filter(
      (p) =>
        p.id !== userId &&
        (!targetEmail || p.email?.toLowerCase().trim() !== targetEmail)
    );
    saveLocalProfiles(filteredProfiles);

    // Remove os anúncios associados ao usuário excluído
    const ads = getLocalAds().filter(
      (a) =>
        a.user_id !== userId &&
        (!target?.full_name || a.seller_name !== target.full_name)
    );
    saveLocalAds(ads);

    return true;
  },

  // 14. Criar anúncio diretamente com permissão de Moderador ou Admin
  async adminCreateAd(
    adData: Omit<Ad, "id" | "created_at" | "updated_at"> & { status?: AdStatus }
  ): Promise<Ad> {
    const payload: Omit<Ad, "id"> = {
      ...adData,
      status: adData.status || ("approved" as const),
      rejection_reason: adData.rejection_reason || null,
      moderated_by: adData.moderated_by || null,
      moderated_at: adData.status === "approved" ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("ads").insert([payload]).select().single();
        if (!error && data) {
          const ads = getLocalAds();
          ads.unshift(data);
          saveLocalAds(ads);
          return data;
        }
      } catch (e: any) {
        console.warn("Exceção no Supabase adminCreateAd:", e.message);
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

  // 15. Atualizar qualquer campo de anúncio diretamente (Admin / Moderador)
  async adminUpdateAd(id: string, updateData: Partial<Ad>): Promise<Ad> {
    const changes = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    let updatedFromDb: Ad | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("ads")
          .update(changes)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) {
          updatedFromDb = data;
        }
      } catch (err) {
        console.warn("Supabase indisponível em adminUpdateAd, salvando localmente:", err);
      }
    }

    const ads = getLocalAds();
    const index = ads.findIndex((a) => a.id === id);
    if (index !== -1) {
      const existing = ads[index];
      const updatedAd: Ad = updatedFromDb || {
        ...existing,
        ...changes,
        id: existing.id,
      };
      ads[index] = updatedAd;
      saveLocalAds(ads);
      return updatedAd;
    }

    if (updatedFromDb) return updatedFromDb;
    throw new Error("Anúncio não encontrado");
  },

  // 16. Métricas da plataforma em tempo real
  getStats() {
    const ads = getLocalAds();
    const profiles = getLocalProfiles();
    const approved = ads.filter((a) => a.status === "approved");
    const pending = ads.filter((a) => a.status === "pending");
    const rejected = ads.filter((a) => a.status === "rejected");
    const totalValue = approved.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    return {
      totalAds: ads.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalUsers: profiles.length,
      totalValue,
    };
  },
};
