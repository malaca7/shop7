import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  UserCheck,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  GOOGLE_CLIENT_ID,
  loadGoogleIdentityScript,
  parseGoogleJwt,
} from "@/lib/google-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar ou Cadastrar via Google — SHOP7" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const {
    user,
    signInWithGoogle,
    loginWithGoogleData,
    isLoading,
  } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Se já logado, redireciona para a central da conta
  useEffect(() => {
    if (user) {
      navigate({ to: "/minha-conta" });
    }
  }, [user, navigate]);

  // Inicializar Google Identity Services (One Tap / ID Token)
  useEffect(() => {
    let isMounted = true;

    async function setupGoogle() {
      try {
        await loadGoogleIdentityScript();
        if (!isMounted || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) return;
            const googleUser = parseGoogleJwt(response.credential);
            if (googleUser) {
              setGoogleLoading(true);
              try {
                await loginWithGoogleData(googleUser);
                navigate({ to: "/minha-conta" });
              } catch (err: any) {
                setError(err?.message || "Falha ao autenticar com o Google.");
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (e) {
        console.warn("Google Identity Services script not available:", e);
      }
    }

    setupGoogle();
    return () => {
      isMounted = false;
    };
  }, [loginWithGoogleData, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate({ to: "/minha-conta" });
    } catch (err: any) {
      if (err?.message === "POPUP_CLOSED") {
        // Usuário fechou o popup do Google voluntariamente
        return;
      }
      setError(err?.message || "Não foi possível conectar com o Google no momento.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#070709] text-foreground flex flex-col justify-between antialiased">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card Principal */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-8 shadow-2xl">
            {/* Glow sutil de fundo */}
            <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-primary/10 blur-3xl" />

            {/* Logo e Cabeçalho */}
            <div className="flex flex-col items-center text-center">
              <Link to="/">
                <Logo size="lg" />
              </Link>
              <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Acesse o SHOP7
              </h1>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Login e cadastro realizados exclusivamente via Google OAuth para máxima segurança.
              </p>
            </div>

            {/* Informações do Fluxo Seguro */}
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#121317] p-4 space-y-2 text-xs">
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <UserCheck className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Verificação automática:</strong> se você já possui conta, o login é efetuado instantaneamente.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero duplicidade:</strong> novos usuários são cadastrados automaticamente mantendo perfil único.
                </span>
              </div>
            </div>

            {/* Mensagem de Erro contextual */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <p>{error}</p>
              </div>
            )}

            {/* Botão Oficial Exclusivo de Login com Google */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.1] bg-[#14151a] py-3.5 px-4 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-[#191b22] hover:shadow-[0_0_20px_-4px_rgba(132,204,22,0.25)] active:scale-[0.98] disabled:opacity-60"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span>Conectando com o Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.9.7 5.5 1.9 7.9l3.7-2.9c-.2-.7-.4-1.5-.4-2.4z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
                      />
                    </svg>
                    <span>Entrar ou Cadastrar com Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Selo de Proteção */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70 border-t border-white/[0.04] pt-4">
              <ShieldCheck className="size-3.5 text-primary/80" />
              <span>Autenticação OAuth 2.0 protegida com criptografia de ponta a ponta</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
