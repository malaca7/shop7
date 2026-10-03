import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isLiveSupabaseConfigured, type Profile, type UserRole } from "@/lib/supabase";
import { promptGoogleOAuthPopup, type GoogleUserData } from "@/lib/google-auth";

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password?: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  switchRoleForDemo: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function isUserAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === "malacarogeriojr@gmail.com" ||
    normalized === "admin@shop7.com" ||
    normalized.includes("admin")
  );
}

const LOCAL_SESSION_KEY = "shop7_active_auth_session_v1";

function syncLocalProfile(profile: Profile) {
  const LOCAL_PROFILES_KEY = "shop7_local_profiles_v1";
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
  let list: Profile[] = [];
  if (raw) {
    try { list = JSON.parse(raw); } catch {}
  }
  const existingIndex = list.findIndex(p => p.id === profile.id || p.email === profile.email);
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...profile };
  } else {
    list.unshift(profile);
  }
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega a sessão inicial
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      if (isLiveSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const isAdmin = isUserAdminEmail(session.user.email);
            setUser({ id: session.user.id, email: session.user.email || "" });
            // Buscar perfil no PostgreSQL
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (prof) {
              setProfile({
                ...(prof as Profile),
                role: isAdmin ? "admin" : (prof as Profile).role,
              });
            } else {
              const meta = session.user.user_metadata as Record<string, any> | undefined;
              setProfile({
                id: session.user.id,
                email: session.user.email || "",
                full_name: (meta?.["full_name"] as string | undefined) || (isAdmin ? "Rogério Malaquias Jr" : null),
                avatar_url: (meta?.["avatar_url"] as string | undefined) || null,
                role: isAdmin ? "admin" : "user",
              });
            }
          } else {
            // Verificar sessão local salva
            const saved = localStorage.getItem(LOCAL_SESSION_KEY);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (isUserAdminEmail(parsed.user?.email)) {
                  parsed.profile.role = "admin";
                  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed));
                }
                setUser(parsed.user);
                setProfile(parsed.profile);
              } catch {
                localStorage.removeItem(LOCAL_SESSION_KEY);
              }
            }
          }
        } catch (err) {
          console.warn("Supabase indisponível, usando sessão local:", err);
          const saved = localStorage.getItem(LOCAL_SESSION_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (isUserAdminEmail(parsed.user?.email)) {
                parsed.profile.role = "admin";
                localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed));
              }
              setUser(parsed.user);
              setProfile(parsed.profile);
            } catch {
              localStorage.removeItem(LOCAL_SESSION_KEY);
            }
          }
        }
      } else {
        // Modo Demonstração Local Persistente
        const saved = localStorage.getItem(LOCAL_SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (isUserAdminEmail(parsed.user?.email)) {
              parsed.profile.role = "admin";
              localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed));
            }
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch {
            localStorage.removeItem(LOCAL_SESSION_KEY);
          }
        } else {
          // Usuário padrão de demonstração para conveniência
          const defaultUser = { id: "user-demo-1", email: "usuario@shop7.com" };
          const defaultProfile: Profile = {
            id: "user-demo-1",
            email: "usuario@shop7.com",
            full_name: "Carlos Eduardo",
            avatar_url: null,
            role: "user",
            created_at: new Date().toISOString(),
          };
          setUser(defaultUser);
          setProfile(defaultProfile);
          localStorage.setItem(
            LOCAL_SESSION_KEY,
            JSON.stringify({ user: defaultUser, profile: defaultProfile })
          );
        }
      }

      setIsLoading(false);
    }

    initAuth();

    // Listener de mudanças no Supabase Auth
    if (isLiveSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          try {
            if (session?.user) {
              const isAdmin = isUserAdminEmail(session.user.email);
              setUser({ id: session.user.id, email: session.user.email || "" });
              try {
                const { data: prof } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .single();
                if (prof) {
                  const resolvedProfile = {
                    ...(prof as Profile),
                    role: isAdmin ? "admin" : (prof as Profile).role,
                  };
                  setProfile(resolvedProfile);
                  syncLocalProfile(resolvedProfile);
                } else {
                  const meta = session.user.user_metadata as Record<string, any> | undefined;
                  const newProf = {
                    id: session.user.id,
                    email: session.user.email || "",
                    full_name: (meta?.["full_name"] || meta?.["name"] || (isAdmin ? "Rogério Malaquias Jr" : session.user.email?.split("@")[0])) || null,
                    avatar_url: (meta?.["avatar_url"] || meta?.["picture"]) || null,
                    role: isAdmin ? "admin" : "user",
                  };
                  // Forçar inserção no banco caso a trigger não exista
                  try {
                    await supabase.from("profiles").upsert({ ...newProf, updated_at: new Date().toISOString() });
                  } catch(e) {}
                  
                  setProfile(newProf as Profile);
                  syncLocalProfile(newProf as Profile);
                }
              } catch (profErr) {
                console.warn("Erro ao buscar perfil em onAuthStateChange:", profErr);
              }
            } else {
              setUser(null);
              setProfile(null);
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

  // (Helper loginWithGoogleData removido, pois usaremos o fluxo padrão do Supabase)

  // 1. Login com E-mail e Senha
  const signInWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      let loggedInWithSupabase = false;
      if (isLiveSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
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
        const isAdmin = isUserAdminEmail(email);
        let role: UserRole = isAdmin ? "admin" : "user";
        let name = email.split("@")[0] || "Usuário";
        if (isAdmin) {
          role = "admin";
          name = email.toLowerCase() === "malacarogeriojr@gmail.com" ? "Rogério Malaquias Jr" : "Administrador SHOP7";
        } else if (email.includes("mod")) {
          role = "moderator";
          name = "Moderador SHOP7";
        }

        const newUser = { id: "user-" + btoa(email).slice(0, 10), email };
        const newProfile: Profile = {
          id: newUser.id,
          email,
          full_name: name,
          avatar_url: null,
          role,
          created_at: new Date().toISOString(),
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
      let registeredWithSupabase = false;
      let newId = "user-" + Date.now();
      
      if (isLiveSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password: password || "123456",
            options: {
              data: { full_name: fullName },
            },
          });
          if (!error && data?.user) {
            registeredWithSupabase = true;
            newId = data.user.id;
          }
        } catch (e) {
          console.warn("Supabase indisponível, cadastrando via sessão local:", e);
        }
      }

      const isAdmin = isUserAdminEmail(email);
      const newProfile: Profile = {
        id: newId,
        email,
        full_name: fullName || (isAdmin ? "Rogério Malaquias Jr" : email.split("@")[0]) || "Usuário SHOP7",
        avatar_url: null,
        role: isAdmin ? "admin" : "user",
        created_at: new Date().toISOString(),
      };
      
      const newUser = { id: newId, email };

      // Se registrou no Supabase, tenta forçar o upsert do perfil caso a trigger SQL falhe
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

  // 3. Login oficial via OAuth do Supabase (para evitar problemas de popup e mismatches de domínio)
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (isLiveSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } else {
        const googleUser = { id: "google-user-777", email: "google.user@gmail.com" };
        const googleProfile: Profile = {
          id: "google-user-777",
          email: "google.user@gmail.com",
          full_name: "Google Member",
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
          role: "user",
          created_at: new Date().toISOString(),
        };
        setUser(googleUser);
        setProfile(googleProfile);
        localStorage.setItem(
          LOCAL_SESSION_KEY,
          JSON.stringify({ user: googleUser, profile: googleProfile })
        );
        syncLocalProfile(googleProfile);
      }
    } catch (err: any) {
      throw new Error(err.message || "Erro ao conectar com Google");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Logout / Sair
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

  // 5. Atualizar perfil
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user || !profile) return;
    const updated = { ...profile, ...data, updated_at: new Date().toISOString() };
    setProfile(updated);

    localStorage.setItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({ user, profile: updated })
    );

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from("profiles").update(data).eq("id", user.id);
      } catch (e) {
        console.warn("Supabase indisponível ao sincronizar perfil:", e);
      }
    }
  };

  // 6. Seletor de Role para Testes & Demonstração de UI
  const switchRoleForDemo = (newRole: UserRole) => {
    if (!profile || !user) return;
    const updated: Profile = { ...profile, role: newRole };
    setProfile(updated);
    if (!isLiveSupabaseConfigured) {
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ user, profile: updated })
      );
    }
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
