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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RejectModal } from "@/components/ads/RejectModal";
import { AdDetailModal } from "@/components/ads/AdDetailModal";
import { AdsService } from "@/lib/ads-service";
import type { Ad, Profile, UserRole, AdType, AdStatus } from "@/lib/supabase";
import { formatBRL, CATEGORIES } from "@/data/catalog";

export const Route = createFileRoute("/moderacao")({
  head: () => ({
    meta: [{ title: "Central de Moderação — SHOP7" }],
  }),
  component: ModeracaoPage,
});

function ModeracaoPage() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"pendentes" | "historico" | "usuarios">("pendentes");
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais
  const [detailAd, setDetailAd] = useState<Ad | null>(null);
  const [rejectingAd, setRejectingAd] = useState<Ad | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | AdType>("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todas");
  const [filterDateRange, setFilterDateRange] = useState<"todos" | "hoje" | "7dias" | "30dias">("todos");
  const [sortOrder, setSortOrder] = useState<"recentes" | "antigos">("recentes");
  const [filterDecision, setFilterDecision] = useState<"todos" | "approved" | "rejected">("todos");

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
    if (role === "moderator" || role === "admin") {
      loadData();
    }
  }, [role]);

  // Contadores de métricas no topo
  const pendingCount = pendingAds.length;
  const approvedCount = useMemo(() => allAds.filter((a) => a.status === "approved").length, [allAds]);
  const rejectedCount = useMemo(() => allAds.filter((a) => a.status === "rejected").length, [allAds]);
  const decisionsCount = approvedCount + rejectedCount;

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

  // Helper de filtragem reutilizável
  const applyFilters = (list: Ad[], isDecisionHistory = false) => {
    return list.filter((ad) => {
      // 1. Busca por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ad.title.toLowerCase().includes(query);
        const matchesDesc = ad.description.toLowerCase().includes(query);
        const matchesSeller = (ad.seller_name || "").toLowerCase().includes(query);
        const matchesReason = (ad.rejection_reason || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSeller && !matchesReason) {
          return false;
        }
      }

      // 2. Filtro por Tipo
      if (filterType !== "todos" && ad.type !== filterType) {
        return false;
      }

      // 3. Filtro por Categoria
      if (filterCategory !== "todas" && ad.category !== filterCategory) {
        return false;
      }

      // 4. Filtro por Decisão (apenas no Histórico)
      if (isDecisionHistory && filterDecision !== "todos") {
        if (ad.status !== filterDecision) return false;
      }

      // 5. Filtro por Data
      if (filterDateRange !== "todos") {
        const adTime = new Date(ad.created_at).getTime();
        const now = Date.now();
        const hours24 = 24 * 60 * 60 * 1000;
        if (filterDateRange === "hoje" && now - adTime > hours24) return false;
        if (filterDateRange === "7dias" && now - adTime > 7 * hours24) return false;
        if (filterDateRange === "30dias" && now - adTime > 30 * hours24) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "recentes" ? timeB - timeA : timeA - timeB;
    });
  };

  // Listas filtradas
  const filteredPendingAds = useMemo(() => applyFilters(pendingAds, false), [
    pendingAds,
    searchQuery,
    filterType,
    filterCategory,
    filterDateRange,
    sortOrder,
  ]);

  const historyAds = useMemo(() => {
    const decisions = allAds.filter((a) => a.status === "approved" || a.status === "rejected");
    return applyFilters(decisions, true);
  }, [
    allAds,
    searchQuery,
    filterType,
    filterCategory,
    filterDateRange,
    sortOrder,
    filterDecision,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filterType !== "todos" ||
    filterCategory !== "todas" ||
    filterDateRange !== "todos" ||
    filterDecision !== "todos" ||
    sortOrder !== "recentes";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("todos");
    setFilterCategory("todas");
    setFilterDateRange("todos");
    setFilterDecision("todos");
    setSortOrder("recentes");
  };

  // Ação: Aprovar Anúncio
  const handleApprove = async (ad: Ad) => {
    if (!user) return;
    try {
      await AdsService.moderateAd(ad.id, "approved", undefined, user.id);
      setActionSuccessMsg(`Anúncio "${ad.title}" APROVADO com sucesso! Agora está visível publicamente no marketplace.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      alert("Erro ao aprovar anúncio.");
    }
  };

  // Ação: Confirmar Rejeição com Motivo
  const handleConfirmReject = async (reason: string) => {
    if (!rejectingAd || !user) return;
    await AdsService.moderateAd(rejectingAd.id, "rejected", reason, user.id);
    setActionSuccessMsg(`Anúncio "${rejectingAd.title}" REJEITADO. Motivo registrado: "${reason}".`);
    setRejectingAd(null);
    loadData();
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Ação Admin: Alterar Role do Usuário
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (role !== "admin") {
      alert("Apenas administradores podem alterar papéis.");
      return;
    }
    try {
      await AdsService.updateUserRole(userId, newRole);
      setActionSuccessMsg(`Permissão atualizada com sucesso para ${newRole}.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar permissão.");
    }
  };

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[#070709] text-foreground flex items-center justify-center">
        <span className="size-3 rounded-full bg-primary animate-ping" />
      </div>
    );
  }

  // PROTEÇÃO DE ROTA: Bloqueio estrito para role 'user'
  if (role !== "moderator" && role !== "admin") {
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
              Esta área é restrita a <strong>Moderadores</strong> e <strong>Administradores</strong> do SHOP7. Sua conta atual possui o papel de <strong>Membro (User)</strong>.
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
        <div className="mx-auto w-[94%] max-w-[1440px]">
          {/* Top Bar com Navegação e Badge do Papel */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
            <div>
              <Link
                to="/minha-conta"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pb-2"
              >
                <ArrowLeft className="size-3.5" />
                <span>Voltar para Minha Conta</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    Central de Moderação SHOP7
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Fila de aprovação de anúncios, filtros avançados e histórico completo de decisões.
                  </p>
                </div>
              </div>
            </div>

            {/* Badges do Moderador */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                  role === "admin"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-primary/20 text-primary border border-primary/30"
                }`}
              >
                {role === "admin" ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                {role === "admin" ? "Admin Supremo" : "Moderador Oficial"}
              </span>
            </div>
          </div>

          {/* PAINEL DE MÉTRICAS & CONTADOR DE AGUARDANDO APROVAÇÃO */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Card 1: Contador de Anúncios Aguardando Aprovação (Destaque) */}
            <div
              onClick={() => setActiveTab("pendentes")}
              className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all duration-300 relative overflow-hidden ${
                activeTab === "pendentes"
                  ? "border-yellow-500/50 bg-yellow-500/[0.08] shadow-[0_8px_30px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30"
                  : "border-white/[0.06] bg-[#0e0f13] hover:border-yellow-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="size-3.5 animate-spin-slow" /> Aguardando Aprovação
                </span>
                {pendingCount > 0 && (
                  <span className="size-2 rounded-full bg-yellow-400 animate-ping" />
                )}
              </div>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-yellow-400">
                {pendingCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {pendingCount === 1 ? "1 anúncio requer análise" : `${pendingCount} anúncios na fila ativa`}
              </p>
            </div>

            {/* Card 2: Anúncios Aprovados */}
            <div
              onClick={() => {
                setActiveTab("historico");
                setFilterDecision("approved");
              }}
              className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all duration-300 ${
                activeTab === "historico" && filterDecision === "approved"
                  ? "border-primary/50 bg-primary/[0.08] shadow-[0_8px_30px_rgba(132,204,22,0.15)] ring-1 ring-primary/30"
                  : "border-white/[0.06] bg-[#0e0f13] hover:border-primary/30"
              }`}
            >
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Aprovados
              </span>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-primary">
                {approvedCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Publicados no marketplace
              </p>
            </div>

            {/* Card 3: Anúncios Rejeitados */}
            <div
              onClick={() => {
                setActiveTab("historico");
                setFilterDecision("rejected");
              }}
              className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all duration-300 ${
                activeTab === "historico" && filterDecision === "rejected"
                  ? "border-red-500/50 bg-red-500/[0.08] shadow-[0_8px_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/30"
                  : "border-white/[0.06] bg-[#0e0f13] hover:border-red-500/30"
              }`}
            >
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="size-3.5" /> Rejeitados
              </span>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-red-400">
                {rejectedCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Com motivo registrado
              </p>
            </div>

            {/* Card 4: Total de Decisões */}
            <div
              onClick={() => {
                setActiveTab("historico");
                setFilterDecision("todos");
              }}
              className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all duration-300 ${
                activeTab === "historico" && filterDecision === "todos"
                  ? "border-white/20 bg-white/[0.05]"
                  : "border-white/[0.06] bg-[#0e0f13] hover:border-white/15"
              }`}
            >
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5" /> Total Avaliado
              </span>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                {decisionsCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Histórico de avaliações
              </p>
            </div>
          </div>

          {/* Toast / Alerta de Sucesso */}
          {actionSuccessMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-primary shadow-lg animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="font-semibold">{actionSuccessMsg}</span>
            </div>
          )}

          {/* Abas da Moderação */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("pendentes")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === "pendentes"
                  ? "bg-[#14151b] text-yellow-400 border border-yellow-500/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-4" />
              <span>Fila de Pendentes</span>
              <span className="rounded-full bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("historico")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === "historico"
                  ? "bg-[#14151b] text-primary border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-4" />
              <span>Histórico de Decisões</span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">
                {decisionsCount}
              </span>
            </button>

            {/* Aba exclusiva para ADMIN: Gerenciar Usuários & Roles */}
            {role === "admin" && (
              <button
                type="button"
                onClick={() => setActiveTab("usuarios")}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  activeTab === "usuarios"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Crown className="size-4 text-purple-400" />
                <span>Gestão de Usuários & Roles</span>
                <span className="rounded-full bg-purple-500/30 px-2 py-0.5 text-[10px] text-purple-200 font-bold">
                  Admin
                </span>
              </button>
            )}
          </div>

          {/* BARRA DE FILTROS AVANÇADOS (CATEGORIA / TIPO / DATA / BUSCA) */}
          {(activeTab === "pendentes" || activeTab === "historico") && (
            <div className="mt-6 rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                {/* Linha 1: Campo de Busca e Ordenação */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por título, anunciante, descrição ou motivo..."
                      className="h-10 w-full rounded-2xl border border-white/[0.08] bg-[#14151b] pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                    />
                  </div>

                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#14151b] px-3 py-2 text-xs">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value as any)}
                        className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="todos">Qualquer data</option>
                        <option value="hoje">Hoje (24 horas)</option>
                        <option value="7dias">Últimos 7 dias</option>
                        <option value="30dias">Últimos 30 dias</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#14151b] px-3 py-2 text-xs">
                      <span className="text-muted-foreground text-[11px]">Ordem:</span>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="recentes">Mais recentes</option>
                        <option value="antigos">Mais antigos (Fila FIFO)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Linha 2: Filtros por Tipo, Categoria e Decisão */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                    Filtros:
                  </span>

                  {/* Filtro por Tipo */}
                  <div className="flex rounded-xl border border-white/[0.08] bg-[#14151b] p-0.5">
                    <button
                      type="button"
                      onClick={() => setFilterType("todos")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                        filterType === "todos"
                          ? "bg-primary text-black font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todos os Tipos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("item")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                        filterType === "item"
                          ? "bg-primary text-black font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Itens
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("servico")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                        filterType === "servico"
                          ? "bg-primary text-black font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Serviços
                    </button>
                  </div>

                  {/* Filtro por Categoria */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#14151b] px-3 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none cursor-pointer"
                  >
                    <option value="todas">Todas as Categorias</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Filtro por Decisão (Aparece no Histórico) */}
                  {activeTab === "historico" && (
                    <select
                      value={filterDecision}
                      onChange={(e) => setFilterDecision(e.target.value as any)}
                      className="rounded-xl border border-white/[0.08] bg-[#14151b] px-3 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none cursor-pointer"
                    >
                      <option value="todos">Todas as Decisões</option>
                      <option value="approved">Somente Aprovados</option>
                      <option value="rejected">Somente Rejeitados</option>
                    </select>
                  )}

                  {/* Botão Limpar Filtros */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/[0.1] bg-[#181922] px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                    >
                      <RotateCcw className="size-3" />
                      <span>Limpar Filtros</span>
                    </button>
                  )}

                  {/* Contador de Resultados Filtrados */}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Exibindo{" "}
                    <strong className="text-foreground">
                      {activeTab === "pendentes" ? filteredPendingAds.length : historyAds.length}
                    </strong>{" "}
                    anúncios
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO 1: FILA DE ANÚNCIOS PENDENTES */}
          {activeTab === "pendentes" && (
            <div className="mt-6">
              <div className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-yellow-400" />
                    <span>Fila Operacional de Moderação</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Anúncios que aguardam aprovação para entrar no marketplace. O público não tem acesso a eles enquanto não forem aprovados.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground self-start sm:self-auto">
                  Prioridade por tempo de submissão
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  Carregando fila de moderação...
                </div>
              ) : filteredPendingAds.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-primary/60" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {hasActiveFilters ? "Nenhum anúncio encontrado com os filtros aplicados." : "Fila de moderação limpa!"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hasActiveFilters
                      ? "Tente ajustar ou limpar seus filtros para visualizar mais itens."
                      : "Todos os anúncios submetidos pelos usuários já foram avaliados e respondidos."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 rounded-xl border border-white/[0.1] bg-[#14151b] px-4 py-2 text-xs font-semibold text-foreground hover:border-primary/40"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPendingAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-3xl border border-yellow-500/30 bg-[#0e0f13] p-5 shadow-xl flex flex-col justify-between hover:border-yellow-500/50 transition-all duration-300"
                    >
                      <div>
                        {/* Header do Card da Fila */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                                <Clock className="size-3" /> {getRelativeTime(ad.created_at)}
                              </span>
                              <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {ad.type === "item" ? "Item" : "Serviço"} · {ad.category}
                              </span>
                            </div>
                            <h3 className="mt-2 text-base font-bold text-foreground line-clamp-1">
                              {ad.title}
                            </h3>
                          </div>
                          <span className="font-display text-lg font-bold text-primary shrink-0">
                            {formatBRL(ad.price)}
                          </span>
                        </div>

                        {/* Imagem de Pré-visualização se houver */}
                        {ad.images?.[0] && (
                          <div className="mt-3 relative h-40 w-full overflow-hidden rounded-2xl bg-black/40 border border-white/[0.04]">
                            <img
                              src={ad.images[0]}
                              alt={ad.title}
                              className="size-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setDetailAd(ad)}
                              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md hover:bg-black/90 transition-all"
                            >
                              <Eye className="size-3.5 text-primary" />
                              <span>Ver Completo</span>
                            </button>
                          </div>
                        )}

                        {/* Descrição resumida */}
                        <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          <p className="line-clamp-2">{ad.description}</p>
                          {ad.additional_info && (
                            <div className="mt-2 rounded-xl border border-white/[0.04] bg-[#14151a] p-2.5 text-[11px] text-foreground/80 line-clamp-2">
                              <strong className="text-primary font-medium">Entrega:</strong>{" "}
                              {ad.additional_info}
                            </div>
                          )}
                        </div>

                        {/* Vendedor, Estoque e Data */}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-white/[0.04] pt-2.5">
                          <span>Vendedor: <strong className="text-foreground">{ad.seller_name || "Anunciante"}</strong></span>
                          <span>Estoque: <strong className="text-foreground">{ad.stock}</strong></span>
                          <span className="text-[10px] font-mono">{formatDate(ad.created_at)}</span>
                        </div>
                      </div>

                      {/* Botões de Ação na Fila */}
                      <div className="mt-5 space-y-2 pt-3 border-t border-white/[0.06]">
                        {/* Botão para Visualização Completa */}
                        <button
                          type="button"
                          onClick={() => setDetailAd(ad)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#14151b] py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-all"
                        >
                          <Eye className="size-3.5" />
                          <span>Visualizar Anúncio Completo</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRejectingAd(ad)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle className="size-4" />
                            <span>Rejeitar (motivo)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(ad)}
                            className="gradient-lime flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] hover:brightness-110 active:scale-95 transition-all"
                          >
                            <CheckCircle2 className="size-4" />
                            <span>Aprovar para Loja</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO 2: HISTÓRICO DE DECISÕES */}
          {activeTab === "historico" && (
            <div className="mt-6">
              <div className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span>Histórico de Decisões de Moderação</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Registro detalhado de todos os anúncios aprovados e rejeitados, com exibição obrigatória do motivo da recusa.
                  </p>
                </div>
              </div>

              {historyAds.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                  <Layers className="mx-auto size-12 text-muted-foreground/40" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    Nenhum registro encontrado no histórico.
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hasActiveFilters ? "Tente ajustar os filtros acima." : "As decisões de moderação tomadas aparecerão listadas aqui."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-white/[0.06] bg-[#0c0d10]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/[0.06] bg-[#101115] text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3.5">Anúncio</th>
                        <th className="px-4 py-3.5">Preço</th>
                        <th className="px-4 py-3.5">Vendedor</th>
                        <th className="px-4 py-3.5">Decisão & Motivo</th>
                        <th className="px-4 py-3.5">Data da Decisão</th>
                        <th className="px-4 py-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {historyAds.map((ad) => (
                        <tr key={ad.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Anúncio */}
                          <td className="px-4 py-3.5 font-medium text-foreground max-w-xs">
                            <p className="truncate font-semibold text-foreground">{ad.title}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {ad.type === "item" ? "Item" : "Serviço"} · {ad.category}
                            </span>
                          </td>

                          {/* Preço */}
                          <td className="px-4 py-3.5 font-bold font-display text-primary whitespace-nowrap">
                            {formatBRL(ad.price)}
                          </td>

                          {/* Vendedor */}
                          <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                            {ad.seller_name || "Vendedor"}
                          </td>

                          {/* Decisão & Motivo da Rejeição */}
                          <td className="px-4 py-3.5 max-w-sm">
                            {ad.status === "approved" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                                <CheckCircle2 className="size-3" /> Aprovado (Ativo)
                              </span>
                            )}

                            {ad.status === "rejected" && (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                  <XCircle className="size-3" /> Rejeitado
                                </span>
                                {ad.rejection_reason && (
                                  <div className="mt-1.5 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-[11px] text-red-300">
                                    <strong className="text-red-400 font-semibold block text-[10px] uppercase">
                                      Motivo da Recusa:
                                    </strong>
                                    <span className="line-clamp-2">"{ad.rejection_reason}"</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Data da Moderação */}
                          <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                            {formatDate(ad.moderated_at || ad.updated_at)}
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão Ver Completo */}
                              <button
                                type="button"
                                onClick={() => setDetailAd(ad)}
                                className="rounded-lg border border-white/[0.08] bg-[#14151b] px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all flex items-center gap-1"
                              >
                                <Eye className="size-3" />
                                <span>Ver</span>
                              </button>

                              {/* Alterar Decisão */}
                              {ad.status === "approved" && (
                                <button
                                  type="button"
                                  onClick={() => setRejectingAd(ad)}
                                  className="rounded-lg border border-red-500/30 px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  Revogar
                                </button>
                              )}

                              {ad.status === "rejected" && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(ad)}
                                  className="rounded-lg bg-primary/20 border border-primary/30 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/30 transition-colors"
                                >
                                  Re-aprovar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO 3 (ADMIN): GESTÃO DE USUÁRIOS E ROLES */}
          {activeTab === "usuarios" && role === "admin" && (
            <div className="mt-6">
              <div className="pb-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Crown className="size-4 text-purple-400" />
                  <span>Painel Administrativo: Gestão de Usuários & Roles</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gerencie permissões de membros da plataforma entre <strong>User</strong>, <strong>Moderador</strong> e <strong>Admin</strong>.
                </p>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/[0.06] bg-[#0c0d10]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.06] bg-[#101115] text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3.5">Usuário</th>
                      <th className="px-4 py-3.5">E-mail</th>
                      <th className="px-4 py-3.5">Papel Atual (Role)</th>
                      <th className="px-4 py-3.5 text-right">Alterar Permissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          {p.full_name || "Sem nome"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{p.email}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              p.role === "admin"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : p.role === "moderator"
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-white/[0.06] text-muted-foreground"
                            }`}
                          >
                            {p.role === "admin" && <Crown className="size-3" />}
                            {p.role === "moderator" && <ShieldCheck className="size-3" />}
                            {p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <select
                            value={p.role}
                            onChange={(e) =>
                              handleRoleChange(p.id, e.target.value as UserRole)
                            }
                            className="rounded-xl border border-white/[0.08] bg-[#14151b] px-3 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none cursor-pointer"
                          >
                            <option value="user">User (Membro)</option>
                            <option value="moderator">Moderator (Moderador)</option>
                            <option value="admin">Admin (Administrador)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal de Detalhes Completos do Anúncio */}
      <AdDetailModal
        ad={detailAd}
        isOpen={Boolean(detailAd)}
        onClose={() => setDetailAd(null)}
        onApprove={(ad) => {
          setDetailAd(null);
          handleApprove(ad);
        }}
        onReject={(ad) => {
          setDetailAd(null);
          setRejectingAd(ad);
        }}
      />

      {/* Modal de Rejeição com Motivo */}
      <RejectModal
        isOpen={Boolean(rejectingAd)}
        onClose={() => setRejectingAd(null)}
        onConfirm={handleConfirmReject}
        adTitle={rejectingAd?.title || ""}
      />
    </div>
  );
}
