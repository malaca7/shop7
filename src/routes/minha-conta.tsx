import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CreateAdModal } from "@/components/ads/CreateAdModal";
import { AdsService } from "@/lib/ads-service";
import type { Ad } from "@/lib/supabase";
import { formatBRL } from "@/data/catalog";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha Conta — SHOP7" }],
  }),
  component: MinhaContaPage,
});

function MinhaContaPage() {
  const { user, profile, role, signOut, updateProfile, switchRoleForDemo, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"anuncios" | "pedidos" | "perfil">("anuncios");
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [loadingAds, setLoadingAds] = useState(false);

  // Edição de Perfil
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Redireciona para /auth caso não esteja logado
  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, isLoading, navigate]);

  // Carrega anúncios do usuário e contagem de pendentes para mod/admin
  const loadData = async () => {
    if (!user) return;
    setLoadingAds(true);
    try {
      const ads = await AdsService.getMyAds(user.id);
      setMyAds(ads);

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

  useEffect(() => {
    loadData();
    if (profile?.full_name) {
      setEditName(profile.full_name);
    }
  }, [user, role, profile]);

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;
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
      await updateProfile({ full_name: editName.trim() });
      setProfileMsg("Perfil atualizado com sucesso!");
    } catch (err) {
      setProfileMsg("Erro ao atualizar perfil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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
          {/* Header do Usuário / Perfil */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Avatar & Identificação */}
              <div className="flex items-center gap-4">
                <div className="relative grid size-16 sm:size-20 place-items-center rounded-2xl bg-[#15171d] border border-white/[0.08] text-2xl font-bold font-display text-primary">
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
                    <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-purple-600 text-white shadow-md">
                      <Crown className="size-3.5" />
                    </span>
                  )}
                  {role === "moderator" && (
                    <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-black shadow-md">
                      <ShieldCheck className="size-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {profile?.full_name || "Usuário SHOP7"}
                    </h1>
                    {/* Badge de Role */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        role === "admin"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : role === "moderator"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-white/[0.06] text-muted-foreground border border-white/[0.08]"
                      }`}
                    >
                      {role === "admin" && <Crown className="size-3" />}
                      {role === "moderator" && <Shield className="size-3" />}
                      {role === "admin"
                        ? "Administrador"
                        : role === "moderator"
                        ? "Moderador"
                        : "Membro"}
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

            {/* SEÇÃO DINÂMICA: Destaque para Moderador & Admin */}
            {(role === "moderator" || role === "admin") && (
              <div className="mt-6 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.08] via-transparent to-primary/[0.04] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>Central de Moderação & Gestão</span>
                      {pendingCount > 0 && (
                        <span className="gradient-lime rounded-full px-2 py-0.5 text-[10px] font-bold text-black">
                          {pendingCount} {pendingCount === 1 ? "pendente" : "pendentes"}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {role === "admin"
                        ? "Aprove ou rejeite anúncios, gerencie todos os usuários e altere papéis."
                        : "Analise anúncios recém-criados e informe justificativas de rejeição."}
                    </p>
                  </div>
                </div>

                <Link
                  to="/moderacao"
                  className="gradient-lime flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black shadow-md hover:brightness-110 transition-all self-start sm:self-auto"
                >
                  <span>Acessar Moderação</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}

            {/* Widget de Teste de Role (Demo / Dev) */}
            <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="size-3 text-primary" /> Alternar papel para testes na interface:
              </span>
              <div className="flex gap-1.5">
                {(["user", "moderator", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchRoleForDemo(r)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
                      role === r
                        ? "gradient-lime text-black"
                        : "border border-white/[0.08] bg-[#14151a] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r === "user" ? "User" : r === "moderator" ? "Moderador" : "Admin"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navegação por Abas */}
          <div className="mt-8 flex items-center gap-2 border-b border-white/[0.06] pb-3">
            {[
              { id: "anuncios", label: "Meus Anúncios", count: myAds.length, icon: Package },
              { id: "pedidos", label: "Meus Pedidos", icon: ShoppingBag },
              { id: "perfil", label: "Perfil & Segurança", icon: User },
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

          {/* Conteúdo da Aba 1: Meus Anúncios */}
          {activeTab === "anuncios" && (
            <div className="mt-6">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Gerenciar Meus Anúncios</h2>
                  <p className="text-xs text-muted-foreground">
                    Anúncios com status "Pendente" ou "Rejeitado" não aparecem no marketplace público.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAd(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="gradient-lime flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-black"
                >
                  <Plus className="size-3.5" />
                  <span>Novo Anúncio</span>
                </button>
              </div>

              {loadingAds ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Carregando seus anúncios...
                </div>
              ) : myAds.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-12 text-center">
                  <Package className="mx-auto size-10 text-muted-foreground/40" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    Você ainda não possui anúncios
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Comece a vender produtos físicos, chaves digitais, contas ou seus serviços especializados agora mesmo.
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
                  {myAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="group flex flex-col rounded-2xl border border-white/[0.06] bg-[#0e0f13] overflow-hidden transition-all hover:border-white/20"
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
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
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
                              Edite o anúncio para corrigir o item e re-submeter para moderação.
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

          {/* Conteúdo da Aba 2: Meus Pedidos */}
          {activeTab === "pedidos" && (
            <div className="mt-6 rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-8 text-center">
              <ShoppingBag className="mx-auto size-10 text-muted-foreground/40" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Nenhum pedido realizado ainda
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Quando você comprar produtos ou contratar serviços, o status da entrega e intermediação de pagamento aparecerá aqui.
              </p>
              <Link
                to="/"
                className="gradient-lime mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
              >
                <span>Explorar Marketplace</span>
              </Link>
            </div>
          )}

          {/* Conteúdo da Aba 3: Perfil */}
          {activeTab === "perfil" && (
            <div className="mt-6 max-w-xl rounded-3xl border border-white/[0.06] bg-[#0c0d10] p-6 sm:p-8">
              <h2 className="text-base font-bold text-foreground">Editar Dados de Perfil</h2>
              <p className="text-xs text-muted-foreground">
                Mantenha suas informações atualizadas para os compradores do SHOP7.
              </p>

              {profileMsg && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Nome de Exibição</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] px-3.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">E-mail Cadastrado</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.06] bg-[#101115] px-3.5 text-xs text-muted-foreground/60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Nível de Permissão (Role)</label>
                  <div className="mt-1.5">
                    <span className="rounded-lg border border-white/[0.08] bg-[#14151a] px-3 py-2 text-xs font-bold text-primary inline-block">
                      {role === "admin" ? "👑 Administrador" : role === "moderator" ? "🛡️ Moderador" : "👤 Usuário Padrão"}
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
      />
    </div>
  );
}
