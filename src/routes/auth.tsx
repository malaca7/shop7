import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar ou Cadastrar — SHOP7" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Se já logado, vai para minha conta
  if (user) {
    navigate({ to: "/minha-conta" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      navigate({ to: "/minha-conta" });
    } catch (err: any) {
      setError(err.message || "Erro na autenticação. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      navigate({ to: "/minha-conta" });
    } catch (err: any) {
      setError(err.message || "Falha ao autenticar com o Google.");
    }
  };

  // Atalhos rápidos para testar papéis instantaneamente
  const handleQuickDemo = async (role: "user" | "mod" | "admin") => {
    if (role === "user") {
      await signInWithEmail("usuario@shop7.com", "123456");
    } else if (role === "mod") {
      await signInWithEmail("moderador@shop7.com", "123456");
    } else {
      await signInWithEmail("admin@shop7.com", "123456");
    }
    navigate({ to: "/minha-conta" });
  };

  return (
    <div className="dark min-h-screen bg-[#070709] text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card Principal */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-8 shadow-2xl">
            {/* Glow verde limão sutil de fundo */}
            <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-primary/10 blur-3xl" />

            {/* Logo e Cabeçalho */}
            <div className="flex flex-col items-center text-center">
              <Link to="/">
                <Logo size="lg" />
              </Link>
              <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta SHOP7"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "login"
                  ? "Acesse seus anúncios, pedidos e reputação"
                  : "Compre e venda itens e serviços com pagamento protegido"}
              </p>
            </div>

            {/* Tabs de Modo: Entrar / Cadastrar */}
            <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-[#121317] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  mode === "login"
                    ? "bg-[#1b1d24] text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-[#1b1d24] text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Criar Conta
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Botão de Login com Google */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#14151a] py-2.5 text-xs font-semibold text-foreground transition-all hover:border-white/20 hover:bg-[#181a20]"
              >
                <svg className="size-4" viewBox="0 0 24 24">
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
                <span>Continuar com o Google</span>
              </button>
            </div>

            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-white/[0.06]" />
              <span className="absolute bg-[#0c0d10] px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                ou com e-mail
              </span>
            </div>

            {/* Formulário de E-mail e Senha */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div>
                  <label className="text-xs font-semibold text-foreground">Nome Completo</label>
                  <div className="relative mt-1">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome ou nome da loja"
                      className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground">E-mail</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Senha</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isLoading}
                className="gradient-lime mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? "Processando..." : mode === "login" ? "Entrar na Conta" : "Criar Minha Conta"}</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            {/* Acesso Rápido de Testes de Roles */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="size-3 text-primary" /> Testar Funções (Modo de Demonstração):
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("user")}
                  className="rounded-lg border border-white/[0.06] bg-[#14151a] px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-white/20"
                >
                  👤 Usuário
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("mod")}
                  className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/20"
                >
                  🛡️ Moderador
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin")}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-medium text-purple-300 hover:bg-purple-500/20"
                >
                  👑 Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
