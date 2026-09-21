import { createFileRoute } from "@tanstack/react-router";
import {
  AppWindow,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudDownload,
  CreditCard,
  Flame,
  Gamepad2,
  Lock,
  Package,
  Search,
  Shapes,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  UserRound,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useMemo } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ProductCard } from "@/components/marketplace/ProductCard";
import {
  BEST_SELLERS,
  CATEGORIES,
  FEATURED_PRODUCTS,
  SERVICES,
  TOP_SELLERS,
  type Product,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SHOP7 — Tudo em um só lugar | Marketplace Oficial" },
      {
        name: "description",
        content:
          "Marketplace minimalista e protegido de produtos físicos, itens digitais, games, contas e serviços.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Package,
  CloudDownload,
  Gamepad2,
  UserRound,
  Sparkles,
  CreditCard,
  Wrench,
  AppWindow,
  Shapes,
};

function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"featured" | "bestsellers" | "services">("featured");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Filter products by selected category and search query
  const displayedProducts = useMemo(() => {
    let list: Product[] = [];
    if (activeTab === "featured") list = FEATURED_PRODUCTS;
    else if (activeTab === "bestsellers") list = BEST_SELLERS;
    else if (activeTab === "services") list = SERVICES;

    return list.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.categorySlug === selectedCategory;
      const matchesSearch =
        !searchFilter ||
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.seller.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeTab, selectedCategory, searchFilter]);

  return (
    <div className="dark min-h-screen bg-[#070709] text-foreground antialiased">
      {/* Top App Header */}
      <Header onSearch={(q) => setSearchFilter(q)} />

      <main className="w-full">
        {/* 1. Minimalist Hero (Native App Look) */}
        <section className="relative w-full overflow-hidden border-b border-white/[0.05] py-8 sm:py-12 lg:py-16">
          {/* Subtle Ambient Lime Backlight */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/[0.08] blur-[120px]" />
          
          <div className="mx-auto w-[94%] max-w-[1520px]">
            <div className="flex flex-col items-center text-center">
              
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3.5 py-1 text-xs font-medium text-primary shadow-[0_0_16px_-4px_rgba(132,204,22,0.3)]">
                <ShieldCheck className="size-3.5" />
                <span>Intermediação segura · Saldo protegido</span>
              </div>

              {/* Punchy Concise Headline */}
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                O marketplace onde tudo é{" "}
                <span className="text-gradient-lime">rápido e seguro</span>.
              </h1>

              {/* Minimalist Subtitle */}
              <p className="mt-3 max-w-xl text-xs sm:text-sm text-muted-foreground">
                Produtos físicos, itens digitais, contas, chaves e serviços sob demanda. O valor só é liberado ao vendedor após você confirmar o recebimento.
              </p>

              {/* Quick Search Input (Mobile + Desktop integrated) */}
              <div className="mt-6 w-full max-w-xl">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="O que você está procurando hoje?"
                    className="h-12 w-full rounded-full border border-white/[0.08] bg-[#111216] pl-11 pr-28 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-[#15171d] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {searchFilter ? (
                    <button
                      type="button"
                      onClick={() => setSearchFilter("")}
                      className="absolute right-24 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Limpar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="gradient-lime absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1 rounded-full px-4 text-xs font-bold text-black shadow-md transition-all hover:brightness-110 active:scale-95"
                  >
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              {/* Compact Metrics Bar */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-[#0d0e12] px-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  <span><strong className="text-foreground">12.000+</strong> anúncios</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-[#0d0e12] px-3 py-1.5">
                  <Star className="size-3.5 fill-primary text-primary" />
                  <span><strong className="text-foreground">4.9/5</strong> de satisfação</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-[#0d0e12] px-3 py-1.5">
                  <Zap className="size-3.5 text-primary" />
                  <span><strong className="text-foreground">&lt; 2 min</strong> entrega digital</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Horizontal Category Rails (Native App Chips) */}
        <section id="categorias" className="sticky top-16 z-30 w-full border-b border-white/[0.05] bg-[#070709]/90 py-3 backdrop-blur-md">
          <div className="mx-auto w-[94%] max-w-[1520px]">
            <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  selectedCategory === "all"
                    ? "gradient-lime text-black font-semibold shadow-[0_2px_12px_rgba(132,204,22,0.35)]"
                    : "border border-white/[0.06] bg-[#101115] text-muted-foreground hover:border-white/15 hover:text-foreground",
                )}
              >
                <Flame className="size-3.5" />
                <span>Todos</span>
              </button>

              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.icon] ?? Shapes;
                const isSelected = selectedCategory === c.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? "all" : c.slug)}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                      isSelected
                        ? "gradient-lime text-black font-semibold shadow-[0_2px_12px_rgba(132,204,22,0.35)]"
                        : "border border-white/[0.06] bg-[#101115] text-muted-foreground hover:border-white/15 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Catalog Showcase & Tabs */}
        <section className="w-full py-8 sm:py-12">
          <div className="mx-auto w-[94%] max-w-[1520px]">
            
            {/* Section Header with Minimalist Tab Pills */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl text-foreground">
                  Catálogo Disponível
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {displayedProducts.length} itens encontrados {selectedCategory !== "all" && `em "${selectedCategory}"`}
                </p>
              </div>

              {/* Tabs Switcher */}
              <div className="inline-flex rounded-xl border border-white/[0.06] bg-[#0e0f13] p-1 self-start sm:self-auto">
                {[
                  { id: "featured", label: "Destaques" },
                  { id: "bestsellers", label: "Mais Vendidos" },
                  { id: "services", label: "Serviços" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      activeTab === t.id
                        ? "bg-[#181a20] text-primary shadow-sm border border-white/[0.05]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Products Grid with Fluid Proportions (%) */}
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 w-full">
                {displayedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0c0d10] py-16 text-center">
                <Search className="size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-semibold text-foreground">Nenhum produto encontrado</p>
                <p className="mt-1 text-xs text-muted-foreground">Tente limpar sua busca ou escolher outra categoria.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchFilter("");
                  }}
                  className="mt-4 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  Ver todos os produtos
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 4. Minimalist Flash Promo Card */}
        <section className="w-full py-6">
          <div className="mx-auto w-[94%] max-w-[1520px]">
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-[#0d0e12] via-[#101317] to-[#0d0e12] p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-primary/10 blur-3xl" />
              
              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    <Zap className="size-3" /> OFERTA RELÂMPAGO
                  </span>
                  <h3 className="mt-3 text-xl font-bold sm:text-2xl text-foreground">
                    Até 40% OFF em entregas imediatas
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-lg">
                    Chaves digitais, gift cards e contas com liberação instantânea no checkout.
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {["02", "45", "18"].map((val, idx) => (
                      <div
                        key={val}
                        className="rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2 text-center"
                      >
                        <p className="font-display text-lg font-bold text-primary">{val}</p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {["h", "m", "s"][idx]}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="gradient-lime ml-2 flex items-center gap-1 rounded-xl px-4 py-3 text-xs font-bold text-black shadow-md transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
                  >
                    <span>Aproveitar</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Vendedores em Destaque (Compact) */}
        <section className="w-full py-8 sm:py-12">
          <div className="mx-auto w-[94%] max-w-[1520px]">
            <div className="flex items-center justify-between pb-6">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl text-foreground">
                  Vendedores Verificados
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lojas com avaliação máxima e histórico comprovado
                </p>
              </div>
              <a
                href="#"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <span>Ver ranking</span>
                <ChevronRight className="size-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 w-full">
              {TOP_SELLERS.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0d10] p-3.5 transition-colors hover:border-primary/30"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                    {s.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-xs font-semibold text-foreground">
                      {s.storeName}
                      <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Star className="size-3 fill-primary text-primary" />
                      {s.rating.toFixed(1)} · {s.sales} vendas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Compra Protegida SHOP7 (Concise Summary) */}
        <section id="protecao" className="w-full py-8 sm:py-12 border-t border-white/[0.05]">
          <div className="mx-auto w-[94%] max-w-[1520px]">
            <div className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Garantia SHOP7
                </span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl text-foreground">
                  Você recebe o que comprou, ou seu dinheiro de volta.
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  Todas as transações utilizam nossa carteira de custódia integrada. O vendedor só recebe após sua validação.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  [Lock, "Saldo Retido", "Liberado só após confirmação do comprador"],
                  [ShieldCheck, "Lojas Verificadas", "Identidade e histórico checados"],
                  [Timer, "Envio Monitorado", "Prazos automáticos e garantia de entrega"],
                  [Wallet, "Reembolso Fácil", "Disputa simples com mediação justa"],
                ].map(([Icon, title, desc]) => {
                  const I = Icon as typeof Lock;
                  return (
                    <div
                      key={title as string}
                      className="rounded-xl border border-white/[0.05] bg-[#0d0e12] p-3.5 transition-colors hover:border-primary/25"
                    >
                      <I className="size-4 text-primary" />
                      <p className="mt-2 text-xs font-semibold text-foreground">{title as string}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-tight">{desc as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Native App Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
