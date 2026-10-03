import { supabase, isLiveSupabaseConfigured, type Ad, type AdStatus, type Profile, type UserRole } from "./supabase";

const LOCAL_ADS_KEY = "shop7_local_ads_v1";
const LOCAL_PROFILES_KEY = "shop7_local_profiles_v1";

// Mock inicial realista para demonstração imediata
const INITIAL_DEMO_ADS: Ad[] = [];

const INITIAL_DEMO_PROFILES: Profile[] = [];

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
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
  let list: Profile[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) list = [];

  // Higienização completa contra contas fictícias residuais
  const beforeCount = list.length;
  list = list.filter((p) => {
    const email = (p.email || "").toLowerCase().trim();
    return (
      email &&
      email !== "usuario@shop7.com" &&
      !email.includes("shop7.local") &&
      p.id !== "user-demo" &&
      p.id !== "user-demo-1" &&
      !p.id?.includes("demo")
    );
  });
  if (list.length !== beforeCount) {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  }

  // Sincroniza usuário da sessão ativa atual caso não esteja na lista
  try {
    const activeSessionRaw = localStorage.getItem("shop7_active_auth_session_v1");
    if (activeSessionRaw) {
      const parsed = JSON.parse(activeSessionRaw);
      const activeEmail = (parsed?.profile?.email || "").toLowerCase().trim();
      if (
        activeEmail &&
        activeEmail !== "usuario@shop7.com" &&
        !activeEmail.includes("shop7.local") &&
        !parsed.profile.id?.includes("demo")
      ) {
        const foundIndex = list.findIndex(
          (p) =>
            p.id === parsed.profile.id ||
            p.email?.toLowerCase().trim() === activeEmail
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

  // Garantir que administradores mestres sempre constem como admin
  const adminEmails = [
    "malacarogeriojr@gmail.com",
    "rogeriomalaquiasjr@gmail.com",
    "admin@shop7.com",
  ];
  let updatedAny = false;
  for (const admEmail of adminEmails) {
    const adminProf = list.find((p) => p.email?.toLowerCase().trim() === admEmail);
    if (adminProf && adminProf.role !== "admin") {
      adminProf.role = "admin";
      updatedAny = true;
    }
  }
  if (updatedAny) {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  }

  return list;
}

function saveLocalProfiles(profiles: Profile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

const DELETED_PROFILES_KEY = "shop7_deleted_profiles_v1";

function getDeletedProfileKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = localStorage.getItem(DELETED_PROFILES_KEY);
  if (!raw) return new Set();
  try {
    const list: string[] = JSON.parse(raw);
    return new Set(list.map((k) => k.toLowerCase().trim()));
  } catch {
    return new Set();
  }
}

function addDeletedProfileKey(idOrEmail?: string | null) {
  if (typeof window === "undefined" || !idOrEmail) return;
  const set = getDeletedProfileKeys();
  set.add(idOrEmail.toLowerCase().trim());
  localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(Array.from(set)));
}

function removeDeletedProfileKey(idOrEmail?: string | null) {
  if (typeof window === "undefined" || !idOrEmail) return;
  const set = getDeletedProfileKeys();
  set.delete(idOrEmail.toLowerCase().trim());
  localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(Array.from(set)));
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
        console.warn("Falha ao inserir no Supabase, gravando local:", error?.message);
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
  async updateAd(id: string, updateData: Partial<Ad>): Promise<Ad> {
    const changes = {
      ...updateData,
      status: "pending" as const,
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
    const deletedKeys = getDeletedProfileKeys();

    // Filtra perfis locais removendo qualquer um que tenha sido excluído
    const validLocal = local.filter(
      (p) =>
        !deletedKeys.has(p.id.toLowerCase().trim()) &&
        !deletedKeys.has((p.email || "").toLowerCase().trim())
    );

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase profiles indisponível, usando fallback local:", error.message);
          return validLocal;
        }

        if (data && Array.isArray(data)) {
          // Criar mapa de perfis locais por ID e por e-mail para mesclagem inteligente
          const localMapById = new Map<string, Profile>();
          const localMapByEmail = new Map<string, Profile>();
          for (const lp of validLocal) {
            localMapById.set(lp.id, lp);
            if (lp.email) localMapByEmail.set(lp.email.toLowerCase().trim(), lp);
          }

          const merged: Profile[] = [];
          const processedLocalIds = new Set<string>();

          for (const dbProf of data) {
            const dbId = dbProf.id;
            const dbEmail = (dbProf.email || "").toLowerCase().trim();

            // Se foi explicitamente deletado pelo admin, ignore
            if (deletedKeys.has(dbId.toLowerCase().trim()) || (dbEmail && deletedKeys.has(dbEmail))) {
              continue;
            }

            // Verificar se existe versão local editada pelo admin
            const localVersion = localMapById.get(dbId) || (dbEmail ? localMapByEmail.get(dbEmail) : undefined);
            if (localVersion) {
              processedLocalIds.add(localVersion.id);
              // Priorizar os dados locais que o admin editou
              merged.push({
                ...dbProf,
                ...localVersion,
              });
            } else {
              merged.push(dbProf);
            }
          }

          // Adicionar qualquer perfil local que ainda não esteja no Supabase
          for (const lp of validLocal) {
            if (!processedLocalIds.has(lp.id)) {
              merged.push(lp);
            }
          }

          saveLocalProfiles(merged);
          return merged;
        }
      } catch (err) {
        console.warn("Supabase offline em getAllProfiles, usando fallback local:", err);
      }
    }

    return validLocal;
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
    const newId = "user-" + Date.now();

    // Se estava na lista de deletados, reativa
    removeDeletedProfileKey(newId);
    removeDeletedProfileKey(emailClean);

    const newProfile: Profile = {
      id: newId,
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
    const filtered = profiles.filter(
      (p) => p.email?.toLowerCase().trim() !== emailClean && p.id !== finalProfile.id
    );
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

    removeDeletedProfileKey(userId);
    if (data.email) removeDeletedProfileKey(data.email);

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
      finalProfile = {
        ...existing,
        ...changes,
        ...(updatedFromDb || {}),
      };
      profiles[index] = finalProfile;
    } else {
      finalProfile = updatedFromDb || {
        id: userId,
        email: data.email || "",
        full_name: data.full_name || null,
        avatar_url: data.avatar_url || null,
        role: data.role || "user",
        created_at: new Date().toISOString(),
        ...changes,
      };
      if (finalProfile.email) {
        profiles.unshift(finalProfile);
      }
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

  // 13. Excluir usuário e seus anúncios (Admin / Moderador)
  async deleteProfile(userId: string): Promise<boolean> {
    const profiles = getLocalProfiles();
    const target = profiles.find((p) => p.id === userId);
    const targetEmail = (target?.email || "").toLowerCase().trim();

    // Grava nas chaves deletadas para nunca mais reaparecer mesmo com cache do Supabase
    addDeletedProfileKey(userId);
    if (targetEmail) addDeletedProfileKey(targetEmail);

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

// ================================================================
// ASSINATURAS EM TEMPO REAL (SUPABASE REALTIME CHANNELS)
// ================================================================

export function subscribeToAds(onEvent: () => void) {
  if (!isLiveSupabaseConfigured) return () => {};
  const channel = supabase
    .channel("realtime_ads_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ads" },
      () => {
        onEvent();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToProfiles(onEvent: () => void) {
  if (!isLiveSupabaseConfigured) return () => {};
  const channel = supabase
    .channel("realtime_profiles_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      () => {
        onEvent();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
