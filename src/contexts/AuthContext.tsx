import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isLiveSupabaseConfigured, type Profile, type UserRole } from "@/lib/supabase";
import { promptGoogleOAuthPopup, type GoogleUserData } from "@/lib/google-auth";
import { generateValidUuid } from "@/lib/utils";

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password?: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loginWithGoogleData: (data: GoogleUserData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  switchRoleForDemo: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function toValidUuid(idOrSeed?: string | null): string {
  if (!idOrSeed) return generateValidUuid();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idOrSeed)) {
    return idOrSeed;
  }
  return generateValidUuid(idOrSeed);
}

export const ROOT_ADMIN_EMAILS = [
  "malacarogeriojr@gmail.com",
  "rogeriomalaquiasjr@gmail.com",
];

export function isUserAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ROOT_ADMIN_EMAILS.includes(normalized);
}

export function getDefaultAdminName(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized === "malacarogeriojr@gmail.com") return "malaca";
  if (normalized === "rogeriomalaquiasjr@gmail.com") return "Rogério Malaquias";
  return email.split("@")[0] || "Usuário";
}

const LOCAL_SESSION_KEY = "shop7_active_auth_session_v1";
const LOCAL_PROFILES_KEY = "shop7_local_profiles_v1";

function syncLocalProfile(profile: Profile) {
  if (typeof window === "undefined" || !profile) return;
  const normalizedEmail = (profile.email || "").toLowerCase().trim();
  if (!normalizedEmail || normalizedEmail === "usuario@shop7.com" || profile.id?.includes("demo")) {
    return;
  }

  const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
  let list: Profile[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {}
  }
  if (!Array.isArray(list)) list = [];

  list = list.filter(
    (p) =>
      p.email?.toLowerCase().trim() !== "usuario@shop7.com" &&
      !p.email?.includes("shop7.local") &&
      !p.id?.includes("demo")
  );

  const isAdmin = isUserAdminEmail(profile.email);
  const syncedProfile: Profile = {
    ...profile,
    id: toValidUuid(profile.id || profile.email),
    role: isAdmin ? "admin" : profile.role,
    updated_at: new Date().toISOString(),
  };

  const existingIndex = list.findIndex(
    (p) =>
      p.id === syncedProfile.id ||
      (normalizedEmail && p.email?.toLowerCase().trim() === normalizedEmail)
  );

  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...syncedProfile };
  } else {
    list.unshift(syncedProfile);
  }
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));

  try {
    const deletedRaw = localStorage.getItem("shop7_deleted_profiles_v1");
    if (deletedRaw) {
      let deletedSet = new Set<string>(JSON.parse(deletedRaw));
      let changed = false;
      if (deletedSet.has(syncedProfile.id.toLowerCase().trim())) {
        deletedSet.delete(syncedProfile.id.toLowerCase().trim());
        changed = true;
      }
      if (normalizedEmail && deletedSet.has(normalizedEmail)) {
        deletedSet.delete(normalizedEmail);
        changed = true;
      }
      if (changed) {
        localStorage.setItem("shop7_deleted_profiles_v1", JSON.stringify(Array.from(deletedSet)));
      }
    }
  } catch (e) {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega a sessão inicial com total resiliência
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      const restoreLocalSession = () => {
        const saved = localStorage.getItem(LOCAL_SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const email = (parsed?.user?.email || "").toLowerCase().trim();
            if (
              !email ||
              email === "usuario@shop7.com" ||
              email.includes("shop7.local") ||
              parsed?.user?.id?.includes("demo")
            ) {
              localStorage.removeItem(LOCAL_SESSION_KEY);
              setUser(null);
              setProfile(null);
              return;
            }

            const validId = toValidUuid(parsed?.user?.id || email);
            const isAdmin = isUserAdminEmail(email);
            const resolvedRole: UserRole = isAdmin ? "admin" : (parsed.profile?.role || "user");
            const defaultName = isAdmin ? getDefaultAdminName(email) : (email.split("@")[0] || "Usuário");

            const validProfile: Profile = {
              id: validId,
              email,
              full_name: parsed.profile?.full_name || defaultName,
              avatar_url: parsed.profile?.avatar_url || null,
              role: resolvedRole,
              created_at: parsed.profile?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const validUser = { id: validId, email };
            setUser(validUser);
            setProfile(validProfile);
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: validUser, profile: validProfile }));
            syncLocalProfile(validProfile);
          } catch {
            localStorage.removeItem(LOCAL_SESSION_KEY);
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      };

      if (isLiveSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const email = session.user.email.toLowerCase().trim();
            const isAdmin = isUserAdminEmail(email);
            const validId = toValidUuid(session.user.id);
            setUser({ id: validId, email });

            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();

            if (prof) {
              const resProf: Profile = {
                ...(prof as Profile),
                id: validId,
                role: isAdmin ? "admin" : (prof as Profile).role,
              };
              setProfile(resProf);
              syncLocalProfile(resProf);
            } else {
              const meta = session.user.user_metadata as Record<string, any> | undefined;
              const defaultName = isAdmin ? getDefaultAdminName(email) : (email.split("@")[0] || "Usuário");
              const resProf: Profile = {
                id: validId,
                email,
                full_name: (meta?.["full_name"] || meta?.["name"] as string | undefined) || defaultName,
                avatar_url: (meta?.["avatar_url"] || meta?.["picture"] as string | undefined) || null,
                role: isAdmin ? "admin" : "user",
                created_at: new Date().toISOString(),
              };
              setProfile(resProf);
              syncLocalProfile(resProf);
            }
          } else {
            restoreLocalSession();
          }
        } catch (err) {
          console.warn("Supabase auth offline, restaurando sessão local:", err);
          restoreLocalSession();
        }
      } else {
        restoreLocalSession();
      }

      setIsLoading(false);
    }

    initAuth();

    // Listener de mudanças no Supabase Auth
    if (isLiveSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (event === "SIGNED_OUT") {
              setUser(null);
              setProfile(null);
              localStorage.removeItem(LOCAL_SESSION_KEY);
              return;
            }

            if (session?.user?.email) {
              const email = session.user.email.toLowerCase().trim();
              const isAdmin = isUserAdminEmail(email);
              const validId = toValidUuid(session.user.id);
              setUser({ id: validId, email });

              try {
                const { data: prof } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .maybeSingle();

                if (prof) {
                  const resolvedProfile = {
                    ...(prof as Profile),
                    id: validId,
                    role: isAdmin ? "admin" : (prof as Profile).role,
                  };
                  setProfile(resolvedProfile);
                  syncLocalProfile(resolvedProfile);
                } else {
                  const meta = session.user.user_metadata as Record<string, any> | undefined;
                  const defaultName = isAdmin ? getDefaultAdminName(email) : (email.split("@")[0] || "Usuário");
                  const newProf: Profile = {
                    id: validId,
                    email,
                    full_name: (meta?.["full_name"] || meta?.["name"]) || defaultName,
                    avatar_url: (meta?.["avatar_url"] || meta?.["picture"]) || null,
                    role: isAdmin ? "admin" : "user",
                    created_at: new Date().toISOString(),
                  };
                  try {
                    await supabase.from("profiles").upsert({ ...newProf, updated_at: new Date().toISOString() });
                  } catch (e) {}
                  
                  setProfile(newProf);
                  syncLocalProfile(newProf);
                }
              } catch (profErr) {
                console.warn("Erro ao buscar perfil em onAuthStateChange:", profErr);
              }
            }
          } catch (authErr) {
            console.warn("Erro no listener de mudanças de autenticação:", authErr);
          }
        }
      );
      return () => {
        subscription.unsubscribe();
      };
    }
    return () => {};
  }, []);

  // 1. Login com E-mail e Senha
  const signInWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      let loggedInWithSupabase = false;
      const normalizedEmail = email.trim().toLowerCase();
      const validId = toValidUuid(normalizedEmail);

      if (isLiveSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: password || "123456",
          });
          if (!error && data?.user) {
            loggedInWithSupabase = true;
          }
        } catch (e) {
          console.warn("Supabase indisponível, autenticando via sessão local:", e);
        }
      }

      if (!loggedInWithSupabase) {
        const isAdmin = isUserAdminEmail(normalizedEmail);
        let role: UserRole = isAdmin ? "admin" : "user";
        let name = isAdmin ? getDefaultAdminName(normalizedEmail) : (normalizedEmail.split("@")[0] || "Usuário");

        const newUser = { id: validId, email: normalizedEmail };
        const newProfile: Profile = {
          id: validId,
          email: normalizedEmail,
          full_name: name,
          avatar_url: null,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setUser(newUser);
        setProfile(newProfile);
        localStorage.setItem(
          LOCAL_SESSION_KEY,
          JSON.stringify({ user: newUser, profile: newProfile })
        );
        syncLocalProfile(newProfile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Cadastro com E-mail e Senha
  const signUpWithEmail = async (email: string, password?: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let registeredWithSupabase = false;
      let newId = toValidUuid(normalizedEmail);
      
      if (isLiveSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: password || "123456",
            options: {
              data: { full_name: fullName },
            },
          });
          if (!error && data?.user) {
            registeredWithSupabase = true;
            newId = toValidUuid(data.user.id);
          }
        } catch (e) {
          console.warn("Supabase indisponível, cadastrando via sessão local:", e);
        }
      }

      const isAdmin = isUserAdminEmail(normalizedEmail);
      const defaultName = isAdmin ? getDefaultAdminName(normalizedEmail) : (fullName || normalizedEmail.split("@")[0] || "Usuário SHOP7");

      const newProfile: Profile = {
        id: newId,
        email: normalizedEmail,
        full_name: defaultName,
        avatar_url: null,
        role: isAdmin ? "admin" : "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const newUser = { id: newId, email: normalizedEmail };

      if (registeredWithSupabase) {
        try {
          await supabase.from("profiles").upsert({
            ...newProfile,
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Aviso: Falha ao inserir perfil no Supabase manualmente:", err);
        }
      }

      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ user: newUser, profile: newProfile })
      );
      syncLocalProfile(newProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Login com dados do Google (GIS / One-Tap / OAuth)
  const loginWithGoogleData = async (data: GoogleUserData) => {
    setIsLoading(true);
    try {
      const normalizedEmail = (data.email || "").trim().toLowerCase();
      const isAdmin = isUserAdminEmail(normalizedEmail);

      let existingProfile: Profile | null = null;

      // 1. Verificar automaticamente se a conta Google já está cadastrada no Supabase
      if (isLiveSupabaseConfigured) {
        try {
          const { data: dbProf } = await supabase
            .from("profiles")
            .select("*")
            .ilike("email", normalizedEmail)
            .maybeSingle();

          if (dbProf) {
            existingProfile = dbProf as Profile;
          }
        } catch (err) {
          console.warn("Erro ao verificar conta existente no Supabase:", err);
        }
      }

      // 2. Verificar também no armazenamento local
      if (!existingProfile && typeof window !== "undefined") {
        const localRaw = localStorage.getItem(LOCAL_PROFILES_KEY);
        if (localRaw) {
          try {
            const list: Profile[] = JSON.parse(localRaw);
            const found = list.find((p) => p.email?.toLowerCase().trim() === normalizedEmail);
            if (found) existingProfile = found;
          } catch {}
        }
      }

      // UUID determinístico e válido para o banco PostgreSQL
      const resolvedUserId = existingProfile?.id ? toValidUuid(existingProfile.id) : toValidUuid(data.id || normalizedEmail);
      const resolvedRole: UserRole = isAdmin ? "admin" : (existingProfile?.role || "user");
      const resolvedCreatedAt = existingProfile?.created_at || new Date().toISOString();

      const defaultName = isAdmin ? getDefaultAdminName(normalizedEmail) : (normalizedEmail.split("@")[0] || "Usuário");
      const resolvedFullName = data.full_name || existingProfile?.full_name || defaultName;
      const resolvedAvatar = data.avatar_url || existingProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";

      const resolvedProfile: Profile = {
        id: resolvedUserId,
        email: normalizedEmail,
        full_name: resolvedFullName,
        avatar_url: resolvedAvatar,
        role: resolvedRole,
        created_at: resolvedCreatedAt,
        updated_at: new Date().toISOString(),
      };

      const newUser = { id: resolvedUserId, email: normalizedEmail };

      // Persistir perfil no Supabase se configurado
      if (isLiveSupabaseConfigured) {
        try {
          await supabase.from("profiles").upsert(resolvedProfile);
        } catch (err) {
          console.warn("Aviso: Falha ao sincronizar perfil Google no Supabase:", err);
        }
      }

      setUser(newUser);
      setProfile(resolvedProfile);
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ user: newUser, profile: resolvedProfile })
      );
      syncLocalProfile(resolvedProfile);
    } finally {
      setIsLoading(false);
    }
  };


  // 4. Fluxo Robusto de Login e Cadastro Google
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // 1. Tentar popup oficial do Google Identity Services (GIS)
      try {
        const googleData = await promptGoogleOAuthPopup();
        if (googleData && googleData.email) {
          await loginWithGoogleData(googleData);
          return;
        }
      } catch (gisError: any) {
        if (gisError?.message === "POPUP_CLOSED") {
          throw gisError; // Usuário fechou intencionalmente o popup do Google
        }
        console.warn("Google GIS popup não disponível no ambiente atual:", gisError?.message);
      }

      // 2. Tentar Supabase OAuth caso GIS falhe
      if (isLiveSupabaseConfigured) {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: window.location.origin,
            },
          });
          if (!error) return;
        } catch (supaErr) {
          console.warn("Supabase OAuth falhou:", supaErr);
        }
      }

      // Se chegar aqui e nenhuma autenticação retornou, lance erro.
      throw new Error("Não foi possível autenticar com o Google no momento.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Logout / Sair
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isLiveSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn("Supabase indisponível ao deslogar:", e);
        }
      }
      setUser(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Atualizar perfil
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user || !profile) return;
    const updated = { ...profile, ...data, updated_at: new Date().toISOString() };
    setProfile(updated);

    localStorage.setItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({ user, profile: updated })
    );
    syncLocalProfile(updated);

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from("profiles").update(data).eq("id", user.id);
      } catch (e) {
        console.warn("Supabase indisponível ao sincronizar perfil:", e);
      }
    }
  };

  // 7. Seletor de Role para Testes & Demonstração de UI
  const switchRoleForDemo = (newRole: UserRole) => {
    if (!profile || !user) return;
    const updated: Profile = { ...profile, role: newRole };
    setProfile(updated);
    localStorage.setItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({ user, profile: updated })
    );
    syncLocalProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || "user",
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        loginWithGoogleData,
        signOut,
        updateProfile,
        switchRoleForDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
