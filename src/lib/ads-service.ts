import { supabase, isLiveSupabaseConfigured, type Ad, type AdStatus, type Profile, type UserRole } from "./supabase";
import { generateValidUuid } from "./utils";
import { realtimeSync, ROOT_ADMINS_DEFAULT } from "./realtime-sync";

const LOCAL_ADS_KEY = "shop7_local_ads_v1";
const LOCAL_PROFILES_KEY = "shop7_local_profiles_v1";
const DELETED_PROFILES_KEY = "shop7_deleted_profiles_v1";

const INITIAL_DEMO_ADS: Ad[] = [];

function getLocalAds(): Ad[] {
  if (typeof window === "undefined") return INITIAL_DEMO_ADS;
  const raw = localStorage.getItem(LOCAL_ADS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(INITIAL_DEMO_ADS));
    return INITIAL_DEMO_ADS;
  }
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : INITIAL_DEMO_ADS;
  } catch {
    return INITIAL_DEMO_ADS;
  }
}

function saveLocalAds(ads: Ad[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(ads));
}

function getLocalProfiles(): Profile[] {
  if (typeof window === "undefined") return ROOT_ADMINS_DEFAULT;
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
        !parsed.profile?.id?.includes("demo")
      ) {
        const foundIndex = list.findIndex(
          (p) =>
            p.id.toLowerCase().trim() === (parsed.profile.id || "").toLowerCase().trim() ||
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

  // Garantir que administradores padrão estejam presentes inicialmente sem sobrescrever papéis personalizados
  const deletedKeys = getDeletedProfileKeys();
  for (const defAdm of ROOT_ADMINS_DEFAULT) {
    const isDeleted =
      deletedKeys.has(defAdm.id.toLowerCase().trim()) ||
      (defAdm.email && deletedKeys.has(defAdm.email.toLowerCase().trim()));
    if (isDeleted) continue;

    const existingIndex = list.findIndex(
      (p) =>
        p.email?.toLowerCase().trim() === defAdm.email.toLowerCase().trim() ||
        p.id.toLowerCase().trim() === defAdm.id.toLowerCase().trim()
    );
    if (existingIndex >= 0) {
      if (!list[existingIndex].full_name) {
        list[existingIndex].full_name = defAdm.full_name;
      }
    } else {
      list.push(defAdm);
    }
  }

  // Persistir a lista
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  }

  return list;
}

function saveLocalProfiles(profiles: Profile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

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
  subscribeToAds(onEvent: () => void): () => void {
    return subscribeToAds(onEvent);
  },

  subscribeToProfiles(onEvent: () => void): () => void {
    return subscribeToProfiles(onEvent);
  },

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
          return getLocalAds().filter((a) => a.status === "approved");
        }
        if (data && data.length > 0) {
          return data;
        }
        return getLocalAds().filter((a) => a.status === "approved");
      } catch (err) {
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
          return getLocalAds().filter((a) => a.user_id === userId);
        }
        return data || [];
      } catch (err) {
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
          return getLocalAds().filter((a) => a.status === "pending");
        }
        return data || [];
      } catch (err) {
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
          const all = getLocalAds();
          return statusFilter ? all.filter((a) => a.status === statusFilter) : all;
        }
        return data || [];
      } catch (err) {
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

    let createdAd: Ad | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("ads").insert([payload]).select().single();
        if (!error && data) {
          createdAd = data;
        }
      } catch (e: any) {}
    }

    const newAd: Ad = createdAd || {
      ...payload,
      id: generateValidUuid(),
    };
    const ads = getLocalAds();
    ads.unshift(newAd);
    saveLocalAds(ads);

    realtimeSync.broadcastAdUpsert(newAd);
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
      } catch (err) {}
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
      realtimeSync.broadcastAdUpsert(updatedAd);
      return updatedAd;
    }

    if (updatedFromDb) {
      realtimeSync.broadcastAdUpsert(updatedFromDb);
      return updatedFromDb;
    }
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
      } catch (err) {}
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
      realtimeSync.broadcastAdUpsert(updatedAd);
      return updatedAd;
    }

    if (moderatedFromDb) {
      realtimeSync.broadcastAdUpsert(moderatedFromDb);
      return moderatedFromDb;
    }
    throw new Error("Anúncio não encontrado");
  },

  // 8. Excluir anúncio
  async deleteAd(id: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from("ads").delete().eq("id", id);
      } catch (err) {}
    }
    const ads = getLocalAds().filter((a) => a.id !== id);
    saveLocalAds(ads);
    realtimeSync.broadcastAdDelete(id);
    return true;
  },

  // 9. Gestão de Usuários (Admin)
  async getAllProfiles(): Promise<Profile[]> {
    realtimeSync.ensureDefaultAdminsSeeded();
    const local = getLocalProfiles();
    const deletedKeys = getDeletedProfileKeys();

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

        if (!error && data && Array.isArray(data)) {
          const localMapById = new Map<string, Profile>();
          const localMapByEmail = new Map<string, Profile>();
          for (const lp of validLocal) {
            localMapById.set(lp.id.toLowerCase().trim(), lp);
            if (lp.email) localMapByEmail.set(lp.email.toLowerCase().trim(), lp);
          }

          const merged: Profile[] = [];
          const processedLocalIds = new Set<string>();

          for (const dbProf of data) {
            const dbId = dbProf.id.toLowerCase().trim();
            const dbEmail = (dbProf.email || "").toLowerCase().trim();

            if (deletedKeys.has(dbId) || (dbEmail && deletedKeys.has(dbEmail))) {
              continue;
            }

            const localVersion = localMapById.get(dbId) || (dbEmail ? localMapByEmail.get(dbEmail) : undefined);
            if (localVersion) {
              processedLocalIds.add(localVersion.id.toLowerCase().trim());
              merged.push({
                ...dbProf,
                ...localVersion,
              });
            } else {
              merged.push(dbProf);
            }
          }

          for (const lp of validLocal) {
            if (!processedLocalIds.has(lp.id.toLowerCase().trim())) {
              merged.push(lp);
            }
          }

          saveLocalProfiles(merged);
          return merged;
        }
      } catch (err) {}
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
    const newId = generateValidUuid(emailClean);

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
      } catch (err) {}
    }

    const finalProfile = createdFromDb || newProfile;
    const profiles = getLocalProfiles();
    const filtered = profiles.filter(
      (p) =>
        p.email?.toLowerCase().trim() !== emailClean &&
        p.id.toLowerCase().trim() !== finalProfile.id.toLowerCase().trim()
    );
    filtered.unshift(finalProfile);
    saveLocalProfiles(filtered);

    realtimeSync.broadcastProfileUpsert(finalProfile);
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
      } catch (err) {}
    }

    const profiles = getLocalProfiles();
    const normalizedEmail = (data.email || "").toLowerCase().trim();
    const normalizedId = userId.toLowerCase().trim();

    const index = profiles.findIndex(
      (p) =>
        p.id.toLowerCase().trim() === normalizedId ||
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

    // Sincronizar sessão ativa caso seja o usuário logado
    try {
      const activeSessionRaw = localStorage.getItem("shop7_active_auth_session_v1");
      if (activeSessionRaw) {
        const parsed = JSON.parse(activeSessionRaw);
        if (
          parsed?.user?.id?.toLowerCase().trim() === normalizedId ||
          (parsed?.user?.email && parsed.user.email.toLowerCase().trim() === finalProfile.email?.toLowerCase().trim())
        ) {
          parsed.profile = { ...parsed.profile, ...finalProfile };
          localStorage.setItem("shop7_active_auth_session_v1", JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    realtimeSync.broadcastProfileUpsert(finalProfile);
    return finalProfile;
  },

  // 13. Excluir usuário e seus anúncios (Admin / Moderador)
  async deleteProfile(userId: string): Promise<boolean> {
    const profiles = getLocalProfiles();
    const normalizedId = (userId || "").toLowerCase().trim();
    const target = profiles.find((p) => p.id.toLowerCase().trim() === normalizedId);
    const targetEmail = (target?.email || "").toLowerCase().trim();

    addDeletedProfileKey(userId);
    if (targetEmail) addDeletedProfileKey(targetEmail);

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from("profiles").delete().eq("id", userId);
        if (targetEmail) {
          await supabase.from("profiles").delete().eq("email", targetEmail);
        }
      } catch (err) {}
    }

    const filteredProfiles = profiles.filter(
      (p) =>
        p.id.toLowerCase().trim() !== normalizedId &&
        (!targetEmail || p.email?.toLowerCase().trim() !== targetEmail)
    );
    saveLocalProfiles(filteredProfiles);

    // Remove os anúncios associados ao usuário excluído
    const ads = getLocalAds().filter(
      (a) =>
        a.user_id.toLowerCase().trim() !== normalizedId &&
        (!target?.full_name || a.seller_name !== target.full_name)
    );
    saveLocalAds(ads);

    realtimeSync.broadcastProfileDelete(userId, targetEmail);
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

    let createdFromDb: Ad | null = null;
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("ads").insert([payload]).select().single();
        if (!error && data) {
          createdFromDb = data;
        }
      } catch (e: any) {}
    }

    const newAd: Ad = createdFromDb || {
      ...payload,
      id: generateValidUuid(),
    };
    const ads = getLocalAds();
    ads.unshift(newAd);
    saveLocalAds(ads);

    realtimeSync.broadcastAdUpsert(newAd);
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
      } catch (err) {}
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
      realtimeSync.broadcastAdUpsert(updatedAd);
      return updatedAd;
    }

    if (updatedFromDb) {
      realtimeSync.broadcastAdUpsert(updatedFromDb);
      return updatedFromDb;
    }
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

export function subscribeToAds(onEvent: () => void): () => void {
  const unsubSupabase = (() => {
    if (!isLiveSupabaseConfigured) return () => {};
    try {
      const channelId = "rt_ads_" + Math.random().toString(36).substring(2, 8);
      const channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ads" },
          () => {
            try {
              onEvent();
            } catch (e) {}
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch {
      return () => {};
    }
  })();

  const unsubEngine = realtimeSync.subscribe((type) => {
    if (type === "ads" || type === "all") {
      onEvent();
    }
  });

  return () => {
    unsubSupabase();
    unsubEngine();
  };
}

export function subscribeToProfiles(onEvent: () => void): () => void {
  const unsubSupabase = (() => {
    if (!isLiveSupabaseConfigured) return () => {};
    try {
      const channelId = "rt_profiles_" + Math.random().toString(36).substring(2, 8);
      const channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            try {
              onEvent();
            } catch (e) {}
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch {
      return () => {};
    }
  })();

  const unsubEngine = realtimeSync.subscribe((type) => {
    if (type === "profiles" || type === "all") {
      onEvent();
    }
  });

  return () => {
    unsubSupabase();
    unsubEngine();
  };
}
