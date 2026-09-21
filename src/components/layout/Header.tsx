import { Link } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  Store,
  UserRound,
  ShieldCheck,
  Crown,
  LogOut,
  ChevronDown,
  Clock,
  Plus,
} from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES } from "@/data/catalog";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenCreateAd?: () => void;
}

export function Header({ onSearch, onOpenCreateAd }: HeaderProps) {
  const { user, profile, role, signOut } = useAuth();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#070709]/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 w-[94%] max-w-[1520px] items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-surface text-muted-foreground transition-colors hover:text-foreground md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[82%] max-w-sm border-white/[0.08] bg-[#0c0d10] p-6 text-foreground flex flex-col justify-between">
              <div>
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <Logo size="md" />
                  </SheetTitle>
                </SheetHeader>

                {/* Perfil no Menu Mobile */}
                {user ? (
                  <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#121317] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                        {(profile?.full_name || user.email)?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {profile?.full_name || "Minha Conta"}
                        </p>
                        <span className="text-[10px] text-primary font-medium uppercase tracking-wider">
                          {role === "admin" ? "👑 Admin" : role === "moderator" ? "🛡️ Moderador" : "Membro"}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/minha-conta"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Acessar
                    </Link>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className="gradient-lime mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-black"
                  >
                    <UserRound className="size-4" />
                    <span>Entrar ou Cadastrar</span>
                  </Link>
                )}

                {/* Acesso rápido à Moderação no menu mobile se for moderador/admin */}
                {(role === "moderator" || role === "admin") && (
                  <Link
                    to="/moderacao"
                    className="mt-3 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs font-semibold text-primary"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      <span>Central de Moderação</span>
                    </div>
                    <span className="rounded-full bg-primary text-black px-1.5 py-0.2 text-[10px] font-bold">
                      Acessar
                    </span>
                  </Link>
                )}

                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Navegar por Categorias
                  </p>
                  <nav className="mt-3 flex flex-col gap-1">
                    {CATEGORIES.map((c) => (
                      <a
                        key={c.id}
                        href={`#${c.slug}`}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground/60">{c.items}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                {user ? (
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="size-4" /> Sair da Conta
                  </button>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" aria-label="SHOP7 Início" className="flex items-center">
            <Logo size="md" />
          </Link>
        </div>

        {/* Center: Minimalist Search Pill (Desktop/Tablet) */}
        <form
          role="search"
          onSubmit={handleSearchSubmit}
          className="relative hidden flex-1 max-w-md md:block"
        >
          <label htmlFor="busca-topo" className="sr-only">
            Buscar no SHOP7
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <input
            id="busca-topo"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar contas, itens, produtos ou serviços..."
            className="h-10 w-full rounded-full border border-white/[0.08] bg-[#121316] pl-10 pr-20 text-xs text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-[#15171c] focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
            ⌘K
          </span>
        </form>

        {/* Right: Quick Native App-style Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            aria-label="Favoritos"
            className="hidden sm:grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-surface text-muted-foreground transition-colors hover:border-white/10 hover:text-foreground"
          >
            <Heart className="size-4" />
          </button>

          <button
            type="button"
            aria-label="Notificações"
            className="hidden sm:grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-surface text-muted-foreground transition-colors hover:border-white/10 hover:text-foreground"
          >
            <Bell className="size-4" />
          </button>

          <button
            type="button"
            aria-label="Carrinho de compras"
            className="relative grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-surface text-muted-foreground transition-colors hover:border-white/10 hover:text-foreground"
          >
            <ShoppingCart className="size-4" />
            <span className="gradient-lime absolute -right-1 -top-1 grid size-4 place-items-center rounded-full text-[9px] font-bold text-primary-foreground">
              2
            </span>
          </button>

          {/* Usuário Logado vs Convidado */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-[#121317] px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-white/20 md:inline-flex"
                >
                  <div className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
                    {(profile?.full_name || user.email)?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[90px] truncate font-semibold">
                    {profile?.full_name?.split(" ")[0] || "Conta"}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl border-white/[0.08] bg-[#0e0f13] p-1.5 text-foreground shadow-2xl"
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-bold text-foreground truncate">
                    {profile?.full_name || "Usuário SHOP7"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-primary">
                    {role === "admin" ? "👑 Administrador" : role === "moderator" ? "🛡️ Moderador" : "Membro"}
                  </span>
                </div>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link to="/minha-conta" className="flex items-center gap-2">
                    <UserRound className="size-4 text-muted-foreground" />
                    <span>Minha Conta</span>
                  </Link>
                </DropdownMenuItem>

                {(role === "moderator" || role === "admin") && (
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-primary focus:text-primary">
                    <Link to="/moderacao" className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      <span>Central de Moderação</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="rounded-xl cursor-pointer text-red-400 focus:text-red-400"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="size-4" />
                    <span>Sair</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/10 hover:text-foreground md:inline-flex"
            >
              <UserRound className="size-3.5" />
              <span>Entrar</span>
            </Link>
          )}

          {/* Premium Lime CTA: Vender */}
          {user ? (
            <Link
              to="/minha-conta"
              className="gradient-lime inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.3)] transition-all hover:brightness-110 active:scale-95"
            >
              <Store className="size-3.5" />
              <span>Anunciar</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="gradient-lime inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.3)] transition-all hover:brightness-110 active:scale-95"
            >
              <Store className="size-3.5" />
              <span>Vender</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
