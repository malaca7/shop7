import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  User,
  Plus,
  Package,
  ShoppingBag,
  Shield,
  ShieldCheck,
  Crown,
  LogOut,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Store,
  Layers,
  Sparkles,
  Wallet,
  TrendingUp,
  Receipt,
  FileText,
  BadgeCheck,
  Search,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CreateAdModal } from "@/components/ads/CreateAdModal";
import { PermissionsMatrixModal } from "@/components/admin/PermissionsMatrixModal";
import { ROLE_DETAILS } from "@/lib/permissions";
import { AdsService } from "@/lib/ads-service";
import { OrdersService } from "@/lib/orders-service";
import type { Ad, Order, UserRole } from "@/lib/supabase";
import { formatBRL } from "@/data/catalog";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha Conta & Painel — SHOP7" }],
  }),
  component: MinhaContaPage,
});


function MinhaContaPage() {
  const { user, profile, role, signOut, updateProfile, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"anuncios" | "pedidos" | "perfil">("anuncios");
  const [orderSubTab, setOrderSubTab] = useState<"compras" | "vendas">("compras");
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userSales, setUserSales] = useState<Order[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adFilter, setAdFilter] = useState<"todos" | "approved" | "pending" | "rejected">("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Edição de Perfil
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [editAvatar, setEditAvatar] = useState(profile?.avatar_url || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Redireciona para /auth caso não esteja logado
  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, isLoading, navigate]);

  // Carrega anúncios, compras e vendas do usuário
  const loadData = async () => {
    if (!user) return;
    setLoadingAds(true);
    try {
      const [ads, purchases, sales] = await Promise.all([
        AdsService.getMyAds(user.id),
        OrdersService.getMyPurchases(user.id),
        OrdersService.getMySales(user.id),
      ]);
      setMyAds(ads);
      setUserOrders(purchases);
      setUserSales(sales);

      if (role === "moderator" || role === "admin") {
        const pending = await AdsService.getPendingAds();
        setPendingCount(pending.length);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoadingAds(false);
    }
  };

  const handleUpdateSaleStatus = async (orderId: string, newStatus: any) => {
    try {
      await OrdersService.updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (err) {
      alert("Erro ao atualizar status da venda.");
    }
  };



  useEffect(() => {
    loadData();
    if (profile?.full_name) setEditName(profile.full_name);
    if (profile?.avatar_url) setEditAvatar(profile.avatar_url);
  }, [user, role, profile]);

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este anúncio?")) return;
    try {
      await AdsService.deleteAd(id);
      setMyAds((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Erro ao excluir anúncio.");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({
        full_name: editName.trim(),
        avatar_url: editAvatar.trim() || null,
      });
      setProfileMsg({ type: "success", text: "Perfil atualizado com sucesso!" });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileMsg({ type: "error", text: "Erro ao atualizar dados do perfil." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Métricas do Usuário
  const userStats = useMemo(() => {
    const total = myAds.length;
    const approved = myAds.filter((a) => a.status === "approved").length;
    const pending = myAds.filter((a) => a.status === "pending").length;
    const rejected = myAds.filter((a) => a.status === "rejected").length;
    const totalValue = myAds
      .filter((a) => a.status === "approved")
      .reduce((acc, curr) => acc + (Number(curr.price) || 0) * (Number(curr.stock) || 1), 0);

    return { total, approved, pending, rejected, totalValue };
  }, [myAds]);

  // Anúncios filtrados
  const filteredAds = useMemo(() => {
    return myAds.filter((ad) => {
      if (adFilter !== "todos" && ad.status !== adFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ad.title.toLowerCase().includes(q) ||
          ad.description.toLowerCase().includes(q) ||
          ad.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [myAds, adFilter, searchQuery]);

  if (isLoading || !user) {
    return (
      <div className="dark min-h-screen bg-[#070709] text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span>Carregando sua conta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#070709] text-foreground antialiased flex flex-col justify-between">
      <Header />

      <main className="flex-1 w-full py-8 sm:py-12">
        <div className="mx-auto w-[94%] max-w-[1400px]">
          
          {/* 1. Header do Usuário / Card de Identificação */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-8 shadow-2xl">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Avatar & Identificação */}
              <div className="flex items-center gap-4">
                <div className="relative grid size-16 sm:size-20 place-items-center rounded-2xl bg-[#15171d] border border-white/[0.08] text-2xl font-bold font-display text-primary shadow-inner">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Avatar"}
                      className="size-full rounded-2xl object-cover"
                    />
                  ) : (
                    ((profile?.full_name || user.email)?.[0] || "U").toUpperCase()
                  )}
                  {role === "admin" && (
                    <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-purple-600 text-white shadow-md" title="Administrador">
                      <Crown className="size-3.5" />
                    </span>
                  )}
                  {role === "moderator" && (
                    <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-black shadow-md" title="Moderador">
                      <ShieldCheck className="size-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {profile?.full_name || "Usuário SHOP7"}
                    </h1>
                    {/* Badge de Role com Botão de Permissões */}
                    <button
                      type="button"
                      onClick={() => setIsPermissionsModalOpen(true)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                        role === "admin"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                          : role === "moderator"
                          ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                          : "bg-white/[0.06] text-muted-foreground border border-white/[0.08] hover:bg-white/[0.12]"
                      }`}
                      title="Clique para ver o escopo e restrições do seu cargo"
                    >
                      {role === "admin" && <Crown className="size-3" />}
                      {role === "moderator" && <Shield className="size-3" />}
                      <span>
                        {role === "admin"
                          ? "Administrador"
                          : role === "moderator"
                          ? "Moderador"
                          : "Membro"}
                      </span>
                      <Info className="size-2.5 opacity-70" />
                    </button>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <BadgeCheck className="size-3" /> Conta Verificada
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Ações de Topo: Criar Anúncio & Sair */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAd(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="gradient-lime flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.3)] transition-all hover:brightness-110 active:scale-95"
                >
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Criar Anúncio</span>
                </button>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#121316] px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  <LogOut className="size-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>

            {/* CARDS DE MÉTRICAS DO USUÁRIO */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/[0.05]">
              <div className="rounded-2xl border border-white/[0.05] bg-[#121317] p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Package className="size-3 text-primary" /> Meus Anúncios
                </span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-foreground font-display">
                  {userStats.total}
                </p>
                <span className="text-[10px] text-muted-foreground">criados no catálogo</span>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Aprovados (Ativos)
                </span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-400 font-display">
                  {userStats.approved}
                </p>
                <span className="text-[10px] text-muted-foreground">visíveis no marketplace</span>
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                  <Clock className="size-3" /> Em Análise
                </span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-yellow-400 font-display">
                  {userStats.pending}
                </p>
                <span className="text-[10px] text-muted-foreground">aguardando aprovação</span>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Wallet className="size-3" /> Saldo em Catálogo
                </span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-foreground font-display">
                  {formatBRL(userStats.totalValue)}
                </p>
                <span className="text-[10px] text-muted-foreground">em produtos listados</span>
              </div>
            </div>

            {/* SEÇÃO DINÂMICA: Destaque para Moderador & Admin */}
            {(role === "moderator" || role === "admin") && (
              <div className="mt-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/[0.12] via-primary/[0.05] to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {role === "admin" ? <Crown className="size-6" /> : <ShieldCheck className="size-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>Painel de Gestão & Moderação {role === "admin" ? "Administrativa" : "Oficial"}</span>
                      {pendingCount > 0 ? (
                        <span className="gradient-lime rounded-full px-2 py-0.5 text-[10px] font-bold text-black animate-pulse">
                          {pendingCount} {pendingCount === 1 ? "anúncio pendente" : "anúncios pendentes"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Fila em dia
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {role === "admin"
                        ? "Gerencie, crie, edite ou apague todos os anúncios e usuários da plataforma."
                        : "Analise a fila de moderação, aprove ou rejeite com motivos e gerencie anúncios."}
                    </p>
                  </div>
                </div>

                <Link
                  to={role === "admin" ? "/admin" : "/moderacao"}
                  className="gradient-lime flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black shadow-md hover:brightness-110 transition-all self-start sm:self-auto shrink-0"
                >
                  <span>Abrir Central {role === "admin" ? "Administrativa" : "de Moderação"}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}

          </div>

          {/* 2. Navegação por Abas */}
          <div className="mt-8 flex items-center gap-2 border-b border-white/[0.06] pb-3">
            {[
              { id: "anuncios", label: "Meus Anúncios", count: myAds.length, icon: Package },
              { id: "pedidos", label: "Compras & Vendas", count: userOrders.length + userSales.length, icon: ShoppingBag },
              { id: "perfil", label: "Meu Perfil & Segurança", icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-[#14151b] text-primary border border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.2 text-[10px] text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. Conteúdo da Aba 1: Meus Anúncios */}
          {activeTab === "anuncios" && (
            <div className="mt-6">
              {/* Barra de Filtros e Busca */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar nos meus anúncios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-48 sm:w-64 rounded-xl border border-white/[0.08] bg-[#121317] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                    />
                  </div>

                  {/* Filtro por status */}
                  <div className="flex gap-1">
                    {[
                      { id: "todos", label: "Todos" },
                      { id: "approved", label: "Aprovados" },
                      { id: "pending", label: "Em Análise" },
                      { id: "rejected", label: "Rejeitados" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAdFilter(f.id as typeof adFilter)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          adFilter === f.id
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "border border-white/[0.06] bg-[#14151b] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingAd(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="gradient-lime flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-black self-start sm:self-auto"
                >
                  <Plus className="size-3.5" />
                  <span>Novo Anúncio</span>
                </button>
              </div>

              {loadingAds ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Carregando seus anúncios...
                </div>
              ) : filteredAds.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                  <Package className="mx-auto size-10 text-muted-foreground/40" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {searchQuery || adFilter !== "todos"
                      ? "Nenhum anúncio encontrado para estes filtros"
                      : "Você ainda não possui anúncios"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    {searchQuery || adFilter !== "todos"
                      ? "Tente limpar a busca ou selecionar outro status."
                      : "Comece a vender produtos físicos, chaves digitais, contas ou seus serviços especializados agora mesmo."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="gradient-lime mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                  >
                    <Plus className="size-3.5" />
                    <span>Criar Primeiro Anúncio</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="group flex flex-col rounded-2xl border border-white/[0.06] bg-[#0e0f13] overflow-hidden transition-all hover:border-white/20 hover:shadow-xl"
                    >
                      {/* Thumbnail & Badges */}
                      <div className="relative aspect-[16/10] w-full bg-[#15171d] overflow-hidden">
                        {ad.images?.[0] ? (
                          <img
                            src={ad.images[0]}
                            alt={ad.title}
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-muted-foreground/40">
                            <Store className="size-8" />
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute left-2.5 top-2.5">
                          {ad.status === "approved" && (
                            <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-primary backdrop-blur-md">
                              <CheckCircle2 className="size-3" /> Aprovado (Ativo)
                            </span>
                          )}
                          {ad.status === "pending" && (
                            <span className="flex items-center gap-1 rounded-md border border-yellow-500/30 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur-md">
                              <Clock className="size-3" /> Em Moderação
                            </span>
                          )}
                          {ad.status === "rejected" && (
                            <span className="flex items-center gap-1 rounded-md border border-red-500/30 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-red-400 backdrop-blur-md">
                              <AlertCircle className="size-3" /> Rejeitado
                            </span>
                          )}
                        </div>

                        {/* Tipo Pill */}
                        <span className="absolute right-2.5 top-2.5 rounded-md border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
                          {ad.type === "item" ? "Item" : "Serviço"}
                        </span>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="capitalize">{ad.category.replace(/-/g, " ")}</span>
                          <span>Estoque: {ad.stock}</span>
                        </div>

                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {ad.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {ad.description}
                        </p>

                        {/* Alerta de Rejeição com o Motivo */}
                        {ad.status === "rejected" && ad.rejection_reason && (
                          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-[11px] text-red-400">
                            <strong>Motivo da rejeição:</strong> {ad.rejection_reason}
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Edite o anúncio para corrigir e re-submeter para moderação.
                            </p>
                          </div>
                        )}

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.04]">
                          <div>
                            <span className="text-[10px] text-muted-foreground">Preço</span>
                            <p className="font-display text-base font-bold text-foreground">
                              {formatBRL(ad.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ad.status === "approved" && (
                              <Link
                                to="/"
                                className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151a] text-muted-foreground hover:text-primary"
                                title="Ver no Marketplace"
                              >
                                <ExternalLink className="size-3.5" />
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAd(ad);
                                setIsCreateModalOpen(true);
                              }}
                              className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151a] text-muted-foreground hover:text-foreground"
                              title="Editar anúncio"
                            >
                              <Edit className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAd(ad.id)}
                              className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151a] text-muted-foreground hover:text-red-400"
                              title="Excluir anúncio"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Conteúdo da Aba 2: Compras & Vendas */}
          {activeTab === "pedidos" && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">Histórico de Transações do Marketplace</h2>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe suas compras e os pedidos recebidos pelas suas vendas.
                  </p>
                </div>

                {/* Seletor Sub-aba: Compras vs Vendas */}
                <div className="inline-flex rounded-xl border border-white/[0.08] bg-[#121317] p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setOrderSubTab("compras")}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      orderSubTab === "compras"
                        ? "bg-[#1c1e25] text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>Minhas Compras ({userOrders.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSubTab("vendas")}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      orderSubTab === "vendas"
                        ? "bg-[#1c1e25] text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Store className="size-3.5" />
                    <span>Minhas Vendas ({userSales.length})</span>
                  </button>
                </div>
              </div>

              {/* Sub-aba 1: MINHAS COMPRAS */}
              {orderSubTab === "compras" && (
                <div>
                  {userOrders.length === 0 ? (
                    <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                      <ShoppingBag className="mx-auto size-10 text-muted-foreground/40" />
                      <h3 className="mt-3 text-sm font-semibold text-foreground">Você ainda não realizou nenhuma compra</h3>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                        Navegue pelo nosso marketplace para encontrar produtos digitais, itens físicos, contas e serviços.
                      </p>
                      <Link
                        to="/"
                        className="gradient-lime mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                      >
                        <span>Explorar Marketplace</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {userOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#0c0d10] p-4 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <ShoppingBag className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-primary">{ord.id}</span>
                                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                  {ord.status === "completed" ? "Entregue / Concluído" : ord.status}
                                </span>
                              </div>
                              <h4 className="mt-1 text-sm font-semibold text-foreground">{ord.title}</h4>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                <span>Vendedor: <strong>{ord.seller_name || "Vendedor SHOP7"}</strong></span>
                                <span>·</span>
                                <span>Data: {new Date(ord.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>

                              {ord.activation_code && (
                                <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#14151b] px-3 py-1 text-xs">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Chave de Ativação:</span>
                                  <code className="text-primary font-mono font-bold select-all">{ord.activation_code}</code>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-white/[0.04] pt-2 sm:pt-0">
                            <span className="text-base font-bold font-display text-foreground">
                              {formatBRL(ord.total_price || ord.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => alert(`Recibo oficial SHOP7 para o pedido ${ord.id}.\nProduto: ${ord.title}\nValor: R$ ${(ord.total_price || ord.price).toFixed(2)}\nVendedor: ${ord.seller_name || "Vendedor"}`)}
                              className="rounded-lg border border-white/[0.08] bg-[#14151b] px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                            >
                              Ver Recibo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-aba 2: MINHAS VENDAS */}
              {orderSubTab === "vendas" && (
                <div>
                  {userSales.length === 0 ? (
                    <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                      <Store className="mx-auto size-10 text-muted-foreground/40" />
                      <h3 className="mt-3 text-sm font-semibold text-foreground">Nenhuma venda registrada ainda</h3>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                        Quando outros usuários comprarem seus produtos ou contratarem seus serviços, as vendas e o status aparecerão aqui.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd(null);
                          setIsCreateModalOpen(true);
                        }}
                        className="gradient-lime mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                      >
                        <Plus className="size-3.5" />
                        <span>Criar Anúncio</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {userSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#0c0d10] p-4 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Store className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-primary">{sale.id}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  sale.status === "completed"
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                    : sale.status === "pending"
                                    ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                                    : "bg-red-500/15 border-red-500/30 text-red-400"
                                }`}>
                                  {sale.status === "completed" ? "Concluído" : sale.status === "pending" ? "Pendente / Em Processamento" : sale.status}
                                </span>
                              </div>
                              <h4 className="mt-1 text-sm font-semibold text-foreground">{sale.title}</h4>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                <span>Comprador: <strong>{sale.buyer_name || "Cliente SHOP7"}</strong></span>
                                <span>·</span>
                                <span>Data: {new Date(sale.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-white/[0.04] pt-2 sm:pt-0">
                            <span className="text-base font-bold font-display text-emerald-400">
                              +{formatBRL(sale.total_price || sale.price)}
                            </span>

                            {/* Ações do Vendedor: Atualizar Status */}
                            <div className="flex items-center gap-1.5">
                              {sale.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSaleStatus(sale.id, "completed")}
                                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20"
                                >
                                  Marcar Entregue
                                </button>
                              )}
                              {sale.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSaleStatus(sale.id, "cancelled")}
                                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/20"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}



          {/* 5. Conteúdo da Aba 3: Perfil & Segurança */}
          {activeTab === "perfil" && (
            <div className="mt-6 max-w-2xl rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-6 sm:p-8">
              <h2 className="text-base font-bold text-foreground">Editar Dados de Perfil</h2>
              <p className="text-xs text-muted-foreground">
                Personalize seu nome de exibição e foto para os clientes e compradores no SHOP7.
              </p>

              {profileMsg && (
                <div
                  className={`mt-4 rounded-xl border p-3 text-xs ${
                    profileMsg.type === "success"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="mt-5 space-y-4">
                {/* Nome de Exibição */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Nome de Exibição *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Seu nome ou nome da sua loja"
                    className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] px-3.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="text-xs font-semibold text-foreground">E-mail Cadastrado</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.06] bg-[#101115] px-3.5 text-xs text-muted-foreground/60 cursor-not-allowed"
                  />
                </div>

                {/* Foto / Avatar URL */}
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>URL da Foto de Perfil (Avatar)</span>
                    {editAvatar && <span className="text-[10px] text-primary">Prévia ativa</span>}
                  </label>
                  <div className="mt-1.5 flex gap-2 items-center">
                    <input
                      type="url"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://exemplo.com/sua-foto.jpg"
                      className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-[#14151a] px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                    />
                    {editAvatar && (
                      <div className="size-10 shrink-0 rounded-xl overflow-hidden border border-white/20 bg-black">
                        <img
                          src={editAvatar}
                          alt="Prévia"
                          className="size-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Nível de Acesso */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Nível de Permissão na Plataforma</label>
                    <button
                      type="button"
                      onClick={() => setIsPermissionsModalOpen(true)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Info className="size-3" />
                      <span>Ver Regras & Restrições do Cargo</span>
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <span className="rounded-xl border border-white/[0.08] bg-[#14151a] px-3.5 py-2 text-xs font-bold text-primary inline-flex items-center gap-1.5">
                      {role === "admin" ? <Crown className="size-4 text-purple-400" /> : role === "moderator" ? <ShieldCheck className="size-4 text-primary" /> : <User className="size-4" />}
                      {role === "admin" ? "Administrador SHOP7 (Acesso Total)" : role === "moderator" ? "Moderador Oficial (Aprovação de Anúncios)" : "Membro Verificado"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="gradient-lime rounded-xl px-5 py-2 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {isUpdatingProfile ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Modal de Criação / Edição de Anúncio */}
      <CreateAdModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAd(null);
        }}
        onSuccess={() => {
          loadData();
        }}
        initialAd={editingAd}
        isAdminMode={false}
      />

      {/* Modal de Regras & Permissões do Usuário */}
      {isPermissionsModalOpen && (
        <PermissionsMatrixModal
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          defaultRoleView={role}
        />
      )}
    </div>
  );
}
