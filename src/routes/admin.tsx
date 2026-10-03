import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Users,
  Layers,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  Store,
  Sparkles,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Calendar,
  Package,
  Wrench,
  ChevronDown,
  Info,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  UserPlus,
  UserX,
  BadgeCheck,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RejectModal } from "@/components/ads/RejectModal";
import { AdDetailModal } from "@/components/ads/AdDetailModal";
import { CreateAdModal } from "@/components/ads/CreateAdModal";
import { UserModal } from "@/components/admin/UserModal";
import { AdsService } from "@/lib/ads-service";
import type { Ad, Profile, UserRole, AdType, AdStatus } from "@/lib/supabase";
import { formatBRL, CATEGORIES } from "@/data/catalog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Painel Administrativo — SHOP7" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"pendentes" | "todos-anuncios" | "usuarios" | "historico" | "metricas">("pendentes");
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais de Anúncios
  const [detailAd, setDetailAd] = useState<Ad | null>(null);
  const [rejectingAd, setRejectingAd] = useState<Ad | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  // Modais de Usuários
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Notificações de Ação
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Filtros de Anúncios
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | AdType>("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todas");
  const [filterStatus, setFilterStatus] = useState<"todos" | AdStatus>("todos");
  const [filterDateRange, setFilterDateRange] = useState<"todos" | "hoje" | "7dias" | "30dias">("todos");
  const [sortOrder, setSortOrder] = useState<"recentes" | "antigos" | "maior_preco" | "menor_preco">("recentes");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);

  // Filtros de Usuários
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"todos" | UserRole>("todos");

  // Redireciona caso deslogado
  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, isLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all, userProfiles] = await Promise.all([
        AdsService.getPendingAds(),
        AdsService.getAllAds(),
        AdsService.getAllProfiles(),
      ]);
      setPendingAds(pending);
      setAllAds(all);
      setProfiles(userProfiles);
    } catch (err) {
      console.error("Erro ao carregar dados de moderação:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      loadData();
    }
  }, [role, activeTab]);

  // Mensagem temporária
  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(null), 5000);
    } else {
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }
  };

  // Contadores & Métricas
  const stats = useMemo(() => {
    const total = allAds.length;
    const pending = pendingAds.length;
    const approved = allAds.filter((a) => a.status === "approved").length;
    const rejected = allAds.filter((a) => a.status === "rejected").length;
    const totalValue = allAds
      .filter((a) => a.status === "approved")
      .reduce((sum, a) => sum + (Number(a.price) || 0) * (Number(a.stock) || 1), 0);
    const usersCount = profiles.length;

    return { total, pending, approved, rejected, totalValue, usersCount };
  }, [allAds, pendingAds, profiles]);

  // Formatar tempo decorrido relativo
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Agora mesmo";
      if (diffMins < 60) return `Aguardando há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Aguardando há ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Aguardando há ${diffDays}d`;
    } catch {
      return "Pendente";
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // ==========================================
  // OPERAÇÕES DE ANÚNCIOS (ADMIN & MOD)
  // ==========================================

  // Aprovar Anúncio
  const handleApprove = async (ad: Ad) => {
    if (!user) return;
    try {
      await AdsService.moderateAd(ad.id, "approved", undefined, user.id);
      showFeedback(`Anúncio "${ad.title}" foi APROVADO e já está público no marketplace!`);
      loadData();
    } catch (err) {
      showFeedback("Erro ao aprovar anúncio.", true);
    }
  };

  // Confirmar Rejeição com Motivo
  const handleConfirmReject = async (reason: string) => {
    if (!rejectingAd || !user) return;
    try {
      await AdsService.moderateAd(rejectingAd.id, "rejected", reason, user.id);
      showFeedback(`Anúncio "${rejectingAd.title}" REJEITADO. Motivo registrado: "${reason}".`);
      setRejectingAd(null);
      loadData();
    } catch (err) {
      showFeedback("Erro ao rejeitar anúncio.", true);
    }
  };

  // Mudar Status Direto (Aprovado, Pendente, Rejeitado)
  const handleSetStatus = async (ad: Ad, newStatus: AdStatus) => {
    if (!user) return;
    try {
      if (newStatus === "rejected") {
        setRejectingAd(ad);
        return;
      }
      await AdsService.adminUpdateAd(ad.id, {
        status: newStatus,
        rejection_reason: null,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      });
      showFeedback(`Status do anúncio "${ad.title}" alterado para ${newStatus.toUpperCase()}.`);
      loadData();
    } catch (err) {
      showFeedback("Erro ao alterar status do anúncio.", true);
    }
  };

  // Excluir Anúncio Definitivamente
  const handleDeleteAd = async (ad: Ad) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o anúncio "${ad.title}"?`)) return;
    try {
      await AdsService.deleteAd(ad.id);
      showFeedback(`Anúncio "${ad.title}" excluído com sucesso.`);
      loadData();
    } catch (err) {
      showFeedback("Erro ao excluir anúncio.", true);
    }
  };

  // ==========================================
  // OPERAÇÕES DE USUÁRIOS (ADMIN & MOD)
  // ==========================================

  // Alterar Role do Usuário
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (role !== "admin") {
      showFeedback("Apenas administradores podem alterar papéis de usuários.", true);
      return;
    }
    try {
      const updated = await AdsService.updateUserRole(userId, newRole);
      showFeedback(`Nível de acesso de "${updated.full_name || updated.email}" atualizado para ${newRole.toUpperCase()}.`);
      await loadData();
    } catch (err: any) {
      showFeedback(err?.message || "Erro ao atualizar permissão.", true);
    }
  };

  // Excluir Usuário
  const handleDeleteUser = async (targetUser: Profile) => {
    if (role !== "admin") {
      showFeedback("Apenas administradores podem excluir usuários.", true);
      return;
    }
    const isCurrentActive =
      targetUser.id === user?.id ||
      (user?.email && targetUser.email.toLowerCase().trim() === user.email.toLowerCase().trim());

    if (isCurrentActive) {
      showFeedback("Você não pode excluir sua própria conta de administrador ativa.", true);
      return;
    }
    if (!window.confirm(`Atenção: Excluir o usuário "${targetUser.full_name || targetUser.email}" removerá a conta e seus anúncios associados. Confirmar exclusão?`)) {
      return;
    }
    try {
      await AdsService.deleteProfile(targetUser.id);
      showFeedback(`Usuário "${targetUser.email}" e seus anúncios foram excluídos com sucesso.`);
      await loadData();
    } catch (err: any) {
      showFeedback(err?.message || "Erro ao excluir usuário.", true);
    }
  };

  // Filtrar anúncios por usuário específico
  const handleFilterByUser = (userId: string, userName: string) => {
    setSelectedUserFilter(userId);
    setSearchQuery("");
    setActiveTab("todos-anuncios");
    showFeedback(`Exibindo todos os anúncios de ${userName}.`);
  };

  // ==========================================
  // FILTRAGEM DE ANÚNCIOS
  // ==========================================
  const filteredAdsList = useMemo(() => {
    return allAds
      .filter((ad) => {
        // Filtro por usuário específico
        if (selectedUserFilter && ad.user_id !== selectedUserFilter) {
          return false;
        }

        // Filtro por status
        if (filterStatus !== "todos" && ad.status !== filterStatus) {
          return false;
        }

        // Busca por texto
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = ad.title.toLowerCase().includes(q);
          const matchesDesc = ad.description.toLowerCase().includes(q);
          const matchesSeller = (ad.seller_name || "").toLowerCase().includes(q);
          const matchesCat = ad.category.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesSeller && !matchesCat) return false;
        }

        // Filtro por tipo
        if (filterType !== "todos" && ad.type !== filterType) return false;

        // Filtro por categoria
        if (filterCategory !== "todas" && ad.category !== filterCategory) return false;

        // Filtro por data
        if (filterDateRange !== "todos") {
          const adTime = new Date(ad.created_at).getTime();
          const now = Date.now();
          const hours24 = 24 * 60 * 60 * 1000;
          if (filterDateRange === "hoje" && now - adTime > hours24) return false;
          if (filterDateRange === "7dias" && now - adTime > 7 * hours24) return false;
          if (filterDateRange === "30dias" && now - adTime > 30 * hours24) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "recentes") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === "antigos") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === "maior_preco") return Number(b.price) - Number(a.price);
        if (sortOrder === "menor_preco") return Number(a.price) - Number(b.price);
        return 0;
      });
  }, [allAds, selectedUserFilter, filterStatus, searchQuery, filterType, filterCategory, filterDateRange, sortOrder]);

  // Lista de Usuários Filtrada
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (userRoleFilter !== "todos" && p.role !== userRoleFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const matchesName = (p.full_name || "").toLowerCase().includes(q);
        const matchesEmail = p.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      return true;
    });
  }, [profiles, userRoleFilter, userSearch]);

  // Histórico de Decisões
  const historyAds = useMemo(() => {
    return allAds
      .filter((a) => a.status === "approved" || a.status === "rejected")
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  }, [allAds]);

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[#070709] text-foreground flex items-center justify-center">
        <span className="size-3 rounded-full bg-primary animate-ping" />
      </div>
    );
  }

  // PROTEÇÃO DE ROTA: Bloqueio estrito para qualquer role que não seja admin
  if (role !== "admin") {
    return (
      <div className="dark min-h-screen bg-[#070709] text-foreground flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-[#0e0f13] p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-500/20 text-red-400">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Esta área é restrita a <strong>Administradores</strong> do SHOP7.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/minha-conta"
                className="gradient-lime rounded-xl py-2.5 text-xs font-bold text-black"
              >
                Voltar para Minha Conta
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#070709] text-foreground antialiased flex flex-col justify-between">
      <Header />

      <main className="flex-1 w-full py-8 sm:py-12">
        <div className="mx-auto w-[94%] max-w-[1520px]">
          
          {/* Header Superior com Identificação e Botões de Criação Rápida */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl border border-purple-500/30 bg-purple-500/20 text-purple-300 shadow-[0_0_24px_-4px_rgba(168,85,247,0.35)]">
                {role === "admin" ? <Crown className="size-6" /> : <ShieldCheck className="size-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    Central Administrativa
                  </h1>
                  <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                    ADMIN TOTAL
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Gerencie, aprove, edite, crie ou apague anúncios, dados e usuários em tempo real no SHOP7.
                </p>
              </div>
            </div>

            {/* Ações de Topo: Criar Anúncio Direto & Adicionar Usuário */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingAd(null);
                  setIsAdModalOpen(true);
                }}
                className="gradient-lime flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>+ Novo Anúncio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProfile(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#14151b] px-4 py-2 text-xs font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-all"
              >
                <UserPlus className="size-4" />
                <span>+ Novo Usuário</span>
              </button>

              <button
                type="button"
                onClick={() => loadData()}
                className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-[#121316] text-muted-foreground hover:text-foreground"
                title="Recarregar dados"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
              </button>

              <Link
                to="/minha-conta"
                className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#121316] px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                <span>Voltar à Conta</span>
              </Link>
            </div>
          </div>

          {/* Notificação de Feedback */}
          {actionSuccessMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3.5 text-xs text-primary shadow-lg animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="font-semibold">{actionSuccessMsg}</span>
            </div>
          )}

          {actionErrorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-400 shadow-lg animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="font-semibold">{actionErrorMsg}</span>
            </div>
          )}

          {/* BARRA DE KPIS & MÉTRICAS EM TEMPO REAL */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("pendentes")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                activeTab === "pendentes"
                  ? "border-yellow-500 bg-yellow-500/[0.12] shadow-[0_0_20px_-4px_rgba(234,179,8,0.25)]"
                  : "border-yellow-500/20 bg-yellow-500/[0.04] hover:border-yellow-500/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                  <Clock className="size-3" /> Fila Pendente
                </span>
                {stats.pending > 0 && (
                  <span className="gradient-lime size-2 rounded-full animate-ping" />
                )}
              </div>
              <p className="mt-2 text-2xl font-bold font-display text-yellow-400">
                {stats.pending}
              </p>
              <span className="text-[10px] text-muted-foreground">anúncios aguardando</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("approved");
                setActiveTab("todos-anuncios");
              }}
              className={`rounded-2xl border p-4 text-left transition-all ${
                activeTab === "todos-anuncios" && filterStatus === "approved"
                  ? "border-emerald-500 bg-emerald-500/[0.12] shadow-[0_0_20px_-4px_rgba(16,185,129,0.25)]"
                  : "border-emerald-500/20 bg-emerald-500/[0.04] hover:border-emerald-500/40"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Aprovados (Ativos)
              </span>
              <p className="mt-2 text-2xl font-bold font-display text-emerald-400">
                {stats.approved}
              </p>
              <span className="text-[10px] text-muted-foreground">públicos no marketplace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("rejected");
                setActiveTab("todos-anuncios");
              }}
              className={`rounded-2xl border p-4 text-left transition-all ${
                activeTab === "todos-anuncios" && filterStatus === "rejected"
                  ? "border-red-500 bg-red-500/[0.12]"
                  : "border-red-500/20 bg-red-500/[0.04] hover:border-red-500/40"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                <XCircle className="size-3" /> Rejeitados
              </span>
              <p className="mt-2 text-2xl font-bold font-display text-red-400">
                {stats.rejected}
              </p>
              <span className="text-[10px] text-muted-foreground">recusados com motivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("usuarios")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                activeTab === "usuarios"
                  ? "border-purple-500 bg-purple-500/[0.12] shadow-[0_0_20px_-4px_rgba(168,85,247,0.25)]"
                  : "border-purple-500/20 bg-purple-500/[0.04] hover:border-purple-500/40"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                <Users className="size-3" /> Usuários
              </span>
              <p className="mt-2 text-2xl font-bold font-display text-purple-300">
                {stats.usersCount}
              </p>
              <span className="text-[10px] text-muted-foreground">perfis gerenciáveis</span>
            </button>

            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <TrendingUp className="size-3" /> Volume em Anúncios
              </span>
              <p className="mt-2 text-xl sm:text-2xl font-bold font-display text-foreground">
                {formatBRL(stats.totalValue)}
              </p>
              <span className="text-[10px] text-muted-foreground">em catálogo aprovado</span>
            </div>
          </div>

          {/* NAVEGAÇÃO DE ABAS */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
            {[
              { id: "pendentes", label: "Fila de Moderação", count: stats.pending, icon: Clock, badgeColor: "bg-yellow-500/20 text-yellow-400" },
              { id: "todos-anuncios", label: "Todos os Anúncios", count: stats.total, icon: Package, badgeColor: "bg-white/[0.08] text-muted-foreground" },
              { id: "usuarios", label: "Gestão de Usuários", count: stats.usersCount, icon: Users, badgeColor: "bg-purple-500/20 text-purple-300" },
              { id: "historico", label: "Histórico de Decisões", count: historyAds.length, icon: Calendar, badgeColor: "bg-white/[0.08] text-muted-foreground" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    if (tab.id === "todos-anuncios") {
                      setSelectedUserFilter(null);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#14151b] text-primary border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab.badgeColor}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* ABA 1: FILA DE MODERAÇÃO (PENDENTES) */}
          {/* ========================================================================= */}
          {activeTab === "pendentes" && (
            <div className="mt-6">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>Fila Prioritária de Moderação</span>
                    <span className="rounded-full bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 text-[10px] text-yellow-400 font-bold">
                      {pendingAds.length} aguardando análise
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Avalie itens e serviços antes que fiquem visíveis para todos os clientes da plataforma.
                  </p>
                </div>
              </div>

              {pendingAds.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
                  <h3 className="mt-3 text-base font-bold text-foreground">Fila de moderação zerada!</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Não há anúncios pendentes de avaliação no momento. Todos os itens foram processados.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="group flex flex-col rounded-3xl border border-yellow-500/30 bg-[#0e0f13] overflow-hidden shadow-xl transition-all hover:border-yellow-500/60"
                    >
                      {/* Imagem do Anúncio */}
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

                        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                          <span className="rounded-md border border-yellow-500/40 bg-black/85 px-2 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur-md flex items-center gap-1">
                            <Clock className="size-3" /> {getRelativeTime(ad.created_at)}
                          </span>
                        </div>

                        <span className="absolute right-2.5 top-2.5 rounded-md border border-white/10 bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
                          {ad.type === "item" ? "Item" : "Serviço"}
                        </span>
                      </div>

                      {/* Informações */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="capitalize">{ad.category.replace(/-/g, " ")}</span>
                          <span>Estoque: <strong>{ad.stock}</strong></span>
                        </div>

                        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-foreground">
                          {ad.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {ad.description}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/80 py-1.5 border-y border-white/[0.04]">
                          <span>Anunciante: <strong>{ad.seller_name || "Desconhecido"}</strong></span>
                          <span>Preço: <strong className="text-primary font-display text-xs">{formatBRL(ad.price)}</strong></span>
                        </div>

                        {/* Botões de Ação de Moderação */}
                        <div className="mt-auto pt-3 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(ad)}
                              className="gradient-lime flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 transition-all"
                            >
                              <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                              <span>Aprovar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRejectingAd(ad)}
                              className="flex items-center justify-center gap-1 rounded-xl border border-red-500/40 bg-red-500/10 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                            >
                              <XCircle className="size-3.5" />
                              <span>Rejeitar</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setDetailAd(ad)}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              <Eye className="size-3.5" /> Ver Detalhes
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAd(ad);
                                  setIsAdModalOpen(true);
                                }}
                                className="text-muted-foreground hover:text-primary flex items-center gap-1"
                                title="Editar dados como admin"
                              >
                                <Edit className="size-3" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAd(ad)}
                                className="text-muted-foreground hover:text-red-400 flex items-center gap-1"
                                title="Excluir"
                              >
                                <Trash2 className="size-3" /> Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: TODOS OS ANÚNCIOS (GESTÃO COMPLETA) */}
          {/* ========================================================================= */}
          {activeTab === "todos-anuncios" && (
            <div className="mt-6 space-y-4">
              {/* Barra de Filtros Avançados */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-1 flex-wrap items-center gap-2.5">
                    {/* Busca */}
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por título, vendedor, categoria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                      />
                    </div>

                    {/* Filtro Status */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="h-10 rounded-xl border border-white/[0.08] bg-[#121317] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="approved">Aprovados (Ativos)</option>
                      <option value="pending">Pendentes</option>
                      <option value="rejected">Rejeitados</option>
                    </select>

                    {/* Filtro Categoria */}
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="h-10 rounded-xl border border-white/[0.08] bg-[#121317] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                    >
                      <option value="todas">Todas as Categorias</option>
                      {CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>

                    {/* Filtro Tipo */}
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="h-10 rounded-xl border border-white/[0.08] bg-[#121317] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                    >
                      <option value="todos">Todos os Tipos</option>
                      <option value="item">Itens / Produtos</option>
                      <option value="servico">Serviços</option>
                    </select>

                    {/* Ordenação */}
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="h-10 rounded-xl border border-white/[0.08] bg-[#121317] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                    >
                      <option value="recentes">Mais recentes</option>
                      <option value="antigos">Mais antigos</option>
                      <option value="maior_preco">Maior preço</option>
                      <option value="menor_preco">Menor preço</option>
                    </select>
                  </div>

                  {selectedUserFilter && (
                    <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 text-xs text-purple-300">
                      <span>Filtro de Usuário Ativo</span>
                      <button
                        type="button"
                        onClick={() => setSelectedUserFilter(null)}
                        className="rounded-lg p-0.5 hover:bg-purple-500/20"
                      >
                        <XCircle className="size-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd(null);
                      setIsAdModalOpen(true);
                    }}
                    className="gradient-lime flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black self-start lg:self-auto shrink-0"
                  >
                    <Plus className="size-3.5" />
                    <span>Publicar Novo Anúncio</span>
                  </button>
                </div>
              </div>

              {/* Tabela / Cards de Anúncios */}
              <div className="grid gap-3">
                {filteredAdsList.length === 0 ? (
                  <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center text-xs text-muted-foreground">
                    Nenhum anúncio encontrado para estes filtros.
                  </div>
                ) : (
                  filteredAdsList.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#0c0d10] p-4 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative size-16 shrink-0 rounded-xl overflow-hidden bg-[#15171d] border border-white/10">
                          {ad.images?.[0] ? (
                            <img src={ad.images[0]} alt={ad.title} className="size-full object-cover" />
                          ) : (
                            <Store className="size-6 text-muted-foreground/50 m-auto mt-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {ad.status === "approved" && (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                Aprovado
                              </span>
                            )}
                            {ad.status === "pending" && (
                              <span className="rounded-full bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                                Pendente
                              </span>
                            )}
                            {ad.status === "rejected" && (
                              <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                Rejeitado
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {ad.category.replace(/-/g, " ")} · {ad.type}
                            </span>
                          </div>

                          <h4 className="mt-1 text-sm font-bold text-foreground">{ad.title}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            <span>Vendedor: <strong className="text-foreground">{ad.seller_name || "Vendedor"}</strong></span>
                            <span>·</span>
                            <span>Estoque: <strong>{ad.stock}</strong></span>
                            <span>·</span>
                            <span>Cadastrado em: {formatDate(ad.created_at)}</span>
                          </div>

                          {ad.rejection_reason && (
                            <p className="mt-1 text-[11px] text-red-400">
                              <strong>Motivo:</strong> {ad.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações e Preço */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-white/[0.04] pt-2 sm:pt-0">
                        <span className="text-base font-bold font-display text-primary">
                          {formatBRL(ad.price)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Botões de Alteração Rápida de Status */}
                          {ad.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleSetStatus(ad, "approved")}
                              className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"
                              title="Aprovar Anúncio"
                            >
                              Aprovar
                            </button>
                          )}

                          {ad.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => setRejectingAd(ad)}
                              className="rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/25 transition-all"
                              title="Rejeitar Anúncio"
                            >
                              Rejeitar
                            </button>
                          )}

                          {ad.status !== "pending" && (
                            <button
                              type="button"
                              onClick={() => handleSetStatus(ad, "pending")}
                              className="rounded-lg bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 text-[11px] font-bold text-yellow-400 hover:bg-yellow-500/25 transition-all"
                              title="Mudar para Pendente"
                            >
                              Pendente
                            </button>
                          )}

                          {/* Editar Anúncio */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAd(ad);
                              setIsAdModalOpen(true);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151b] text-muted-foreground hover:text-primary transition-colors"
                            title="Editar Dados Completos do Anúncio"
                          >
                            <Edit className="size-3.5" />
                          </button>

                          {/* Excluir Anúncio */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAd(ad)}
                            className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151b] text-muted-foreground hover:text-red-400 transition-colors"
                            title="Excluir Anúncio Definitivamente"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ===================================================================          {/* ========================================================================= */}
          {/* ABA 3: GESTÃO DE USUÁRIOS (ADMIN & MOD) */}
          {/* ========================================================================= */}
          {activeTab === "usuarios" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2.5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou e-mail de usuário..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="h-10 rounded-xl border border-white/[0.08] bg-[#121317] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                  >
                    <option value="todos">Todos os Papéis</option>
                    <option value="admin">Administradores</option>
                    <option value="moderator">Moderadores</option>
                    <option value="user">Membros (Users)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      loadData();
                      showFeedback("Lista de usuários atualizada.");
                    }}
                    className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-[#121317] text-muted-foreground hover:text-foreground hover:border-white/20 transition-all shrink-0"
                    title="Recarregar membros cadastrados"
                  >
                    <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setIsUserModalOpen(true);
                  }}
                  className="gradient-lime flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black shrink-0 self-start sm:self-auto shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  <UserPlus className="size-3.5 stroke-[2.5]" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>

              {/* Tabela de Usuários */}
              <div className="grid gap-3">
                {filteredProfiles.length === 0 ? (
                  <div className="rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-12 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/20">
                      <Users className="size-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Nenhum membro encontrado</h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                      {userSearch.trim() || userRoleFilter !== "todos"
                        ? "Nenhum usuário corresponde aos filtros de busca aplicados."
                        : "Ainda não há outros membros cadastrados no sistema além dos perfis padrão."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {(userSearch.trim() || userRoleFilter !== "todos") && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearch("");
                            setUserRoleFilter("todos");
                          }}
                          className="rounded-xl border border-white/[0.08] bg-[#14151b] px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          Limpar Filtros
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProfile(null);
                          setIsUserModalOpen(true);
                        }}
                        className="gradient-lime rounded-xl px-4 py-1.5 text-xs font-bold text-black"
                      >
                        + Cadastrar Novo Usuário
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredProfiles.map((p) => {
                    const userAdsCount = allAds.filter((a) => a.user_id === p.id).length;
                    const isCurrentLoggedUser = p.id === user?.id || p.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim();

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#0c0d10] p-4 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="relative size-12 shrink-0 rounded-2xl overflow-hidden bg-[#15171d] border border-white/10 grid place-items-center font-bold text-primary text-base">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.full_name || "Avatar"} className="size-full object-cover" />
                            ) : (
                              ((p.full_name || p.email)?.[0] || "U").toUpperCase()
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {p.full_name || "Sem Nome Cadastrado"}
                              </h4>
                              {isCurrentLoggedUser && (
                                <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.2 text-[9px] font-bold text-primary">
                                  VOCÊ
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  p.role === "admin"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : p.role === "moderator"
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-white/[0.06] text-muted-foreground border border-white/[0.08]"
                                }`}
                              >
                                {p.role === "admin" ? "Admin" : p.role === "moderator" ? "Moderador" : "Membro"}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                              <span>E-mail: <strong className="text-foreground">{p.email}</strong></span>
                              <span>·</span>
                              <span>Anúncios: <strong>{userAdsCount}</strong></span>
                              <span>·</span>
                              <span>Criado em: {formatDate(p.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ações por Usuário */}
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-white/[0.04] pt-2 sm:pt-0">
                          <div className="flex items-center gap-2">
                            {/* Seletor rápido de papel (Apenas Admin) */}
                            {role === "admin" ? (
                              <select
                                value={p.role}
                                onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                                className="h-8 rounded-lg border border-white/[0.08] bg-[#14151b] px-2 text-[11px] font-semibold text-foreground focus:border-primary/50 focus:outline-none"
                              >
                                <option value="user">Membro (User)</option>
                                <option value="moderator">Moderador</option>
                                <option value="admin">Administrador</option>
                              </select>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Papel fixado</span>
                            )}

                            {/* Ver anúncios do usuário */}
                            {userAdsCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleFilterByUser(p.id, p.full_name || p.email)}
                                className="rounded-lg border border-white/[0.08] bg-[#14151b] px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                                title="Ver todos os anúncios deste usuário"
                              >
                                Ver {userAdsCount} anúncios
                              </button>
                            )}

                            {/* Editar Usuário */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfile(p);
                                setIsUserModalOpen(true);
                              }}
                              className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151b] text-muted-foreground hover:text-primary transition-colors"
                              title="Editar Informações do Usuário"
                            >
                              <Edit className="size-3.5" />
                            </button>

                            {/* Excluir Usuário (Apenas Admin) */}
                            {role === "admin" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(p)}
                                disabled={isCurrentLoggedUser}
                                className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-[#14151b] text-muted-foreground hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={isCurrentLoggedUser ? "Você não pode excluir sua própria conta ativa" : "Excluir Usuário"}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: HISTÓRICO DE DECISÕES */}
          {/* ========================================================================= */}
          {activeTab === "historico" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-base font-bold text-foreground">Registro de Auditoria de Moderação</h2>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe todas as decisões de aprovação e rejeição registradas no SHOP7.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {historyAds.length === 0 ? (
                  <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center text-xs text-muted-foreground">
                    Nenhuma decisão registrada no histórico.
                  </div>
                ) : (
                  historyAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0c0d10] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {ad.status === "approved" ? (
                            <CheckCircle2 className="size-5 text-emerald-400" />
                          ) : (
                            <XCircle className="size-5 text-red-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              ad.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            }`}>
                              {ad.status === "approved" ? "APROVADO" : "REJEITADO"}
                            </span>
                            <span className="text-xs font-semibold text-foreground">{ad.title}</span>
                          </div>

                          <div className="mt-1 text-[11px] text-muted-foreground">
                            <span>Vendedor: {ad.seller_name || "Vendedor"} · Preço: {formatBRL(ad.price)}</span>
                          </div>

                          {ad.rejection_reason && (
                            <p className="mt-1.5 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-[11px] text-red-400">
                              <strong>Motivo registrado:</strong> {ad.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-muted-foreground">
                        <span>Atualizado: {formatDate(ad.updated_at || ad.created_at)}</span>
                        <button
                          type="button"
                          onClick={() => setDetailAd(ad)}
                          className="text-primary hover:underline text-xs font-semibold mt-1"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal de Detalhes Completos */}
      <AdDetailModal
        ad={detailAd}
        isOpen={Boolean(detailAd)}
        onClose={() => setDetailAd(null)}
        onApprove={(ad) => {
          handleApprove(ad);
          setDetailAd(null);
        }}
        onReject={(ad) => {
          setDetailAd(null);
          setRejectingAd(ad);
        }}
      />

      {/* Modal de Rejeição com Motivo */}
      <RejectModal
        adTitle={rejectingAd?.title || ""}
        isOpen={Boolean(rejectingAd)}
        onClose={() => setRejectingAd(null)}
        onConfirm={handleConfirmReject}
      />

      {/* Modal de Criação / Edição de Anúncio com Permissões de Admin/Mod */}
      <CreateAdModal
        isOpen={isAdModalOpen}
        onClose={() => {
          setIsAdModalOpen(false);
          setEditingAd(null);
        }}
        onSuccess={() => {
          showFeedback("Anúncio salvo com sucesso pelo painel administrativo!");
          loadData();
        }}
        initialAd={editingAd}
        isAdminMode={true}
      />

      {/* Modal de Criação / Edição de Usuários */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingProfile(null);
        }}
        onSuccess={(p) => {
          showFeedback(`Usuário "${p.full_name || p.email}" salvo com sucesso!`);
          loadData();
        }}
        initialProfile={editingProfile}
      />
    </div>
  );
}
