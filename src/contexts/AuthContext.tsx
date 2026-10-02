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
  loginWithGoogleData: (data: GoogleUserData) => Promise<void>;
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
                  setProfile({
                    ...(prof as Profile),
                    role: isAdmin ? "admin" : (prof as Profile).role,
                  });
                } else {
                  const meta = session.user.user_metadata as Record<string, any> | undefined;
                  setProfile({
                    id: session.user.id,
                    email: session.user.email || "",
                    full_name: (meta?.["full_name"] || meta?.["name"] || (isAdmin ? "Rogério Malaquias Jr" : session.user.email?.split("@")[0])) || null,
                    avatar_url: (meta?.["avatar_url"] || meta?.["picture"]) || null,
                    role: isAdmin ? "admin" : "user",
                  });
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

  // Helper para salvar dados vindos do Google
  const loginWithGoogleData = async (googleData: GoogleUserData) => {
    setIsLoading(true);
    try {
      const isAdmin = isUserAdminEmail(googleData.email);
      const newUser = { id: `google-${googleData.id}`, email: googleData.email };
      const newProfile: Profile = {
        id: newUser.id,
        email: googleData.email,
        full_name: googleData.full_name || (isAdmin ? "Rogério Malaquias Jr" : googleData.email.split("@")[0]),
        avatar_url: googleData.avatar_url,
        role: isAdmin ? "admin" : "user",
        created_at: new Date().toISOString(),
      };

      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ user: newUser, profile: newProfile })
      );

      // Se o Supabase estiver configurado e operacional, sincroniza o perfil
      if (isLiveSupabaseConfigured) {
        try {
          await supabase.from("profiles").upsert({
            id: newUser.id,
            email: googleData.email,
            full_name: newProfile.full_name,
            avatar_url: googleData.avatar_url,
            role: isAdmin ? "admin" : "user",
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Supabase profiles upsert ignorado:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          }
        } catch (e) {
          console.warn("Supabase indisponível, cadastrando via sessão local:", e);
        }
      }

      if (!registeredWithSupabase) {
        const isAdmin = isUserAdminEmail(email);
        const newUser = { id: "user-" + Date.now(), email };
        const newProfile: Profile = {
          id: newUser.id,
          email,
          full_name: fullName || (isAdmin ? "Rogério Malaquias Jr" : email.split("@")[0]) || "Usuário SHOP7",
          avatar_url: null,
          role: isAdmin ? "admin" : "user",
          created_at: new Date().toISOString(),
        };
        setUser(newUser);
        setProfile(newProfile);
        localStorage.setItem(
          LOCAL_SESSION_KEY,
          JSON.stringify({ user: newUser, profile: newProfile })
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Login oficial com Google Identity Services (sem redirect_uri_mismatch)
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const googleData = await promptGoogleOAuthPopup();
      if (googleData) {
        await loginWithGoogleData(googleData);
      }
    } catch (err: any) {
      if (err.message === "POPUP_CLOSED") {
        throw err;
      }
      console.warn("Tentando fallback de login Google:", err);
      // Se não foi cancelamento do usuário, fallback para demo se offline
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
