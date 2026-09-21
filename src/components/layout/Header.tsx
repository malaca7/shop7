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
import { CATEGORIES } from "@/data/catalog";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
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
            <SheetContent side="left" className="w-[82%] max-w-sm border-white/[0.08] bg-[#0c0d10] p-6 text-foreground">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo size="md" />
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                <ShieldCheck className="size-4 shrink-0" />
                <span>Intermediação segura SHOP7 ativa</span>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Navegar por Categorias
                </p>
                <nav className="mt-3 flex flex-col gap-1">
                  {CATEGORIES.map((c) => (
                    <a
                      key={c.id}
                      href={`#${c.slug}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-muted-foreground/60">{c.items}</span>
                    </a>
                  ))}
                </nav>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  className="gradient-lime flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_16px_rgba(132,204,22,0.35)]"
                >
                  <Store className="size-4" /> Começar a Vender
                </button>
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

          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/10 hover:text-foreground md:inline-flex"
          >
            <UserRound className="size-3.5" />
            <span>Entrar</span>
          </button>

          {/* Premium Lime CTA: Vender */}
          <Button
            variant="hero"
            size="sm"
            className="rounded-full px-4 text-xs font-bold shadow-[0_4px_16px_rgba(132,204,22,0.3)]"
          >
            <Store className="size-3.5" />
            <span>Vender</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
