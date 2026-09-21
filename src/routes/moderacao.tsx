import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RejectModal } from "@/components/ads/RejectModal";
import { AdsService } from "@/lib/ads-service";
import type { Ad, Profile, UserRole } from "@/lib/supabase";
import { formatBRL } from "@/data/catalog";

export const Route = createFileRoute("/moderacao")({
  head: () => ({
    meta: [{ title: "Central de Moderação — SHOP7" }],
  }),
  component: ModeracaoPage,
});

function ModeracaoPage() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"pendentes" | "todos" | "usuarios">("pendentes");
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de Rejeição
  const [rejectingAd, setRejectingAd] = useState<Ad | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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

  // Ação: Aprovar Anúncio
  const handleApprove = async (ad: Ad) => {
    if (!user) return;
    try {
      await AdsService.moderateAd(ad.id, "approved", undefined, user.id);
      setActionSuccessMsg(`Anúncio "${ad.title}" aprovado com sucesso! Agora está visível publicamente no marketplace.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      alert("Erro ao aprovar anúncio.");
    }
  };

  // Ação: Confirmar Rejeição
  const handleConfirmReject = async (reason: string) => {
    if (!rejectingAd || !user) return;
    await AdsService.moderateAd(rejectingAd.id, "rejected", reason, user.id);
    setActionSuccessMsg(`Anúncio "${rejectingAd.title}" rejeitado. O vendedor foi informado do motivo.`);
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
        <span className="size-2 rounded-full bg-primary animate-ping" />
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
              Esta área é exclusiva para <strong>Moderadores</strong> e <strong>Administradores</strong> do SHOP7. Sua conta atual possui o papel de <strong>Membro (User)</strong>.
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
          {/* Top Bar com Navegação */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
            <div>
              <Link
                to="/minha-conta"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pb-2"
              >
                <ArrowLeft className="size-3.5" />
                <span>Voltar para Minha Conta</span>
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    Central de Moderação SHOP7
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Aprovação de anúncios, cumprimento de políticas e integridade da plataforma.
                  </p>
                </div>
              </div>
            </div>

            {/* Badge do Papel do Moderador */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  role === "admin"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-primary/20 text-primary border border-primary/30"
                }`}
              >
                {role === "admin" ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                {role === "admin" ? "Painel Admin" : "Painel Moderador"}
              </span>
            </div>
          </div>

          {/* Toast / Alerta de Sucesso */}
          {actionSuccessMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary shadow-lg">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Abas da Moderação */}
          <div className="mt-6 flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("pendentes")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "pendentes"
                  ? "bg-[#14151b] text-primary border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-4" />
              <span>Anúncios Pendentes</span>
              <span className="gradient-lime rounded-full px-2 py-0.2 text-[10px] font-bold text-black">
                {pendingAds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("todos")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "todos"
                  ? "bg-[#14151b] text-primary border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-4" />
              <span>Histórico de Anúncios</span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.2 text-[10px] text-muted-foreground">
                {allAds.length}
              </span>
            </button>

            {/* Aba exclusiva para ADMIN: Gerenciar Usuários & Roles */}
            {role === "admin" && (
              <button
                type="button"
                onClick={() => setActiveTab("usuarios")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "usuarios"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Crown className="size-4 text-purple-400" />
                <span>Gestão de Usuários & Roles</span>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.2 text-[10px] text-purple-300 font-bold">
                  Admin
                </span>
              </button>
            )}
          </div>

          {/* CONTEÚDO 1: ANÚNCIOS PENDENTES */}
          {activeTab === "pendentes" && (
            <div className="mt-6">
              <div className="pb-4">
                <h2 className="text-base font-bold text-foreground">
                  Fila de Aprovação Obrigatória
                </h2>
                <p className="text-xs text-muted-foreground">
                  Nenhum anúncio desta lista é visível publicamente no marketplace até que você o aprove.
                </p>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Carregando fila de moderação...
                </div>
              ) : pendingAds.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-primary/60" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    Fila de moderação limpa!
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Todos os anúncios criados ou editados já foram analisados e revisados.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-3xl border border-primary/25 bg-[#0e0f13] p-5 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Header do Card */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                              <Clock className="size-3" /> Aguardando Moderação
                            </span>
                            <span className="ml-2 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {ad.type === "item" ? "Item" : "Serviço"} · {ad.category}
                            </span>
                            <h3 className="mt-2 text-base font-bold text-foreground">
                              {ad.title}
                            </h3>
                          </div>
                          <span className="font-display text-lg font-bold text-primary shrink-0">
                            {formatBRL(ad.price)}
                          </span>
                        </div>

                        {/* Imagem de Pré-visualização se houver */}
                        {ad.images?.[0] && (
                          <div className="mt-3 h-40 w-full overflow-hidden rounded-2xl bg-black/40">
                            <img
                              src={ad.images[0]}
                              alt={ad.title}
                              className="size-full object-cover"
                            />
                          </div>
                        )}

                        {/* Descrição & Dados */}
                        <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          <p className="line-clamp-3">{ad.description}</p>
                          {ad.additional_info && (
                            <div className="mt-2 rounded-xl border border-white/[0.04] bg-[#14151a] p-2.5 text-[11px]">
                              <strong className="text-foreground">Informações adicionais:</strong>{" "}
                              {ad.additional_info}
                            </div>
                          )}
                        </div>

                        {/* Vendedor & Estoque */}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/80 border-t border-white/[0.04] pt-2.5">
                          <span>Anunciante: <strong className="text-foreground">{ad.seller_name || "Vendedor"}</strong></span>
                          <span>Estoque/Vagas: <strong className="text-foreground">{ad.stock}</strong></span>
                        </div>
                      </div>

                      {/* Botões de Ação da Moderação */}
                      <div className="mt-5 grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setRejectingAd(ad)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle className="size-4" />
                          <span>Rejeitar (com motivo)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(ad)}
                          className="gradient-lime flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] hover:brightness-110 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>Aprovar para Marketplace</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO 2: HISTÓRICO DE ANÚNCIOS */}
          {activeTab === "todos" && (
            <div className="mt-6">
              <div className="pb-4">
                <h2 className="text-base font-bold text-foreground">
                  Todos os Anúncios Registrados
                </h2>
                <p className="text-xs text-muted-foreground">
                  Visão geral de anúncios aprovados, pendentes e rejeitados no banco de dados.
                </p>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/[0.06] bg-[#0c0d10]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.06] bg-[#101115] text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3.5">Título & Tipo</th>
                      <th className="px-4 py-3.5">Preço</th>
                      <th className="px-4 py-3.5">Vendedor</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {allAds.map((ad) => (
                      <tr key={ad.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-medium text-foreground max-w-xs">
                          <p className="truncate font-semibold">{ad.title}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {ad.type} · {ad.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold font-display text-foreground">
                          {formatBRL(ad.price)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {ad.seller_name || "Vendedor"}
                        </td>
                        <td className="px-4 py-3.5">
                          {ad.status === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                              <CheckCircle2 className="size-3" /> Aprovado
                            </span>
                          )}
                          {ad.status === "pending" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                              <Clock className="size-3" /> Pendente
                            </span>
                          )}
                          {ad.status === "rejected" && (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                <XCircle className="size-3" /> Rejeitado
                              </span>
                              {ad.rejection_reason && (
                                <p className="mt-1 text-[10px] text-muted-foreground truncate max-w-xs">
                                  {ad.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {ad.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleApprove(ad)}
                              className="rounded-lg bg-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/30 mr-1.5"
                            >
                              Aprovar
                            </button>
                          )}
                          {ad.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => setRejectingAd(ad)}
                              className="rounded-lg border border-red-500/30 px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/10"
                            >
                              Revogar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  Promova ou rebaixe papéis de usuários entre <strong>User</strong>, <strong>Moderador</strong> e <strong>Admin</strong>.
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
                            className="rounded-xl border border-white/[0.08] bg-[#14151b] px-3 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none"
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

      {/* Modal de Rejeição */}
      <RejectModal
        isOpen={Boolean(rejectingAd)}
        onClose={() => setRejectingAd(null)}
        onConfirm={handleConfirmReject}
        adTitle={rejectingAd?.title || ""}
      />
    </div>
  );
}
