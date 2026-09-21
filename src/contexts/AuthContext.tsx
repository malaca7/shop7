import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isLiveSupabaseConfigured, type Profile, type UserRole } from "@/lib/supabase";

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
            setUser({ id: session.user.id, email: session.user.email || "" });
            // Buscar perfil no PostgreSQL
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (prof) {
              setProfile(prof as Profile);
            } else {
              const meta = session.user.user_metadata as Record<string, any> | undefined;
              setProfile({
                id: session.user.id,
                email: session.user.email || "",
                full_name: (meta?.["full_name"] as string | undefined) || null,
                avatar_url: (meta?.["avatar_url"] as string | undefined) || null,
                role: "user",
              });
            }
          }
        } catch (err) {
          console.error("Erro ao inicializar sessão do Supabase:", err);
        }
      } else {
        // Modo Demonstração Local Persistente
        const saved = localStorage.getItem(LOCAL_SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
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
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || "" });
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            if (prof) setProfile(prof as Profile);
          } else {
            setUser(null);
            setProfile(null);
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
      if (isLiveSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || "123456",
        });
        if (error) throw error;
      } else {
        // Simulação Demo
        let role: UserRole = "user";
        let name = email.split("@")[0] || "Usuário";
        if (email.includes("admin")) {
          role = "admin";
          name = "Administrador SHOP7";
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
      if (isLiveSupabaseConfigured) {
        const { error } = await supabase.auth.signUp({
          email,
          password: password || "123456",
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      } else {
        const newUser = { id: "user-" + Date.now(), email };
        const newProfile: Profile = {
          id: newUser.id,
          email,
          full_name: fullName || email.split("@")[0] || null,
          avatar_url: null,
          role: "user",
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

  // 3. Login com Google OAuth
  const signInWithGoogle = async () => {
    if (isLiveSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/minha-conta",
        },
      });
      if (error) throw error;
    } else {
      // Demo Google Auth
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
    }
  };

  // 4. Logout / Sair
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isLiveSupabaseConfigured) {
        await supabase.auth.signOut();
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

    if (isLiveSupabaseConfigured) {
      await supabase.from("profiles").update(data).eq("id", user.id);
    } else {
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ user, profile: updated })
      );
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
