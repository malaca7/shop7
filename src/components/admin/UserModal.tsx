import { useState, useEffect } from "react";
import { X, User, Mail, Shield, Crown, Sparkles, Image, Check, Info } from "lucide-react";
import { AdsService } from "@/lib/ads-service";
import { PermissionsMatrixModal } from "./PermissionsMatrixModal";
import type { Profile, UserRole } from "@/lib/supabase";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
  initialProfile?: Profile | null;
}

const PRESET_AVATARS = [
  { id: "1", label: "Gamer 1", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80" },
  { id: "2", label: "Gamer 2", url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80" },
  { id: "3", label: "Gamer 3", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80" },
  { id: "4", label: "Gamer 4", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80" },
  { id: "5", label: "Gamer 5", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80" },
];

export function UserModal({
  isOpen,
  onClose,
  onSuccess,
  initialProfile,
}: UserModalProps) {
  const [fullName, setFullName] = useState(initialProfile?.full_name || "");
  const [email, setEmail] = useState(initialProfile?.email || "");
  const [role, setRole] = useState<UserRole>(initialProfile?.role || "user");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setFullName(initialProfile.full_name || "");
      setEmail(initialProfile.email || "");
      setRole(initialProfile.role || "user");
      setAvatarUrl(initialProfile.avatar_url || "");
    } else {
      setFullName("");
      setEmail("");
      setRole("user");
      setAvatarUrl(PRESET_AVATARS[0].url);
    }
    setError(null);
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, informe o e-mail do usuário.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (initialProfile) {
        // Edição
        const updated = await AdsService.updateProfileData(initialProfile.id, {
          full_name: fullName.trim() || null,
          email: email.trim(),
          role,
          avatar_url: avatarUrl.trim() || null,
        });
        onSuccess(updated);
      } else {
        // Criação
        const created = await AdsService.createProfile({
          full_name: fullName.trim() || undefined,
          email: email.trim(),
          role,
          avatar_url: avatarUrl.trim() || null,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar usuário no sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop com blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-6 shadow-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className={`grid size-10 place-items-center rounded-2xl ${
              role === "admin"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : role === "moderator"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-white/[0.06] text-muted-foreground border border-white/[0.08]"
            }`}>
              {role === "admin" ? <Crown className="size-5" /> : role === "moderator" ? <Shield className="size-5" /> : <User className="size-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {initialProfile ? "Editar Usuário" : "Novo Usuário"}
              </span>
              <h2 className="text-lg font-bold text-foreground">
                {initialProfile ? "Atualizar Dados do Perfil" : "Cadastrar Usuário no Sistema"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-white/[0.06] bg-[#14151b] text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="text-xs font-semibold text-foreground">Nome Completo</label>
            <div className="relative mt-1.5">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Carlos Eduardo ou Loja Gamer"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] pl-3.5 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="text-xs font-semibold text-foreground">E-mail *</label>
            <div className="relative mt-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] pl-3.5 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Papel / Nível de Acesso */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Papel & Nível de Acesso no Sistema</label>
              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <Info className="size-3" />
                <span>Ver Matriz de Permissões</span>
              </button>
            </div>
            
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: "user" as UserRole, label: "Membro", desc: "Comprar & Vender", icon: User, color: "hover:border-white/20" },
                { id: "moderator" as UserRole, label: "Moderador", desc: "Aprovar anúncios", icon: Shield, color: "hover:border-primary/50" },
                { id: "admin" as UserRole, label: "Admin", desc: "Controle total", icon: Crown, color: "hover:border-purple-500/50" },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                      isSelected
                        ? r.id === "admin"
                          ? "border-purple-500 bg-purple-500/10 text-purple-300 shadow-sm"
                          : r.id === "moderator"
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-white/40 bg-white/10 text-foreground shadow-sm"
                        : "border-white/[0.06] bg-[#121317] text-muted-foreground " + r.color
                    }`}
                  >
                    <Icon className="size-4 mb-1" />
                    <span className="text-xs font-bold leading-tight">{r.label}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">{r.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Resumo dinâmico de escopo de permissões */}
            <div className={`mt-2.5 rounded-xl border p-2.5 text-[11px] leading-relaxed ${
              role === "admin"
                ? "border-purple-500/30 bg-purple-500/10 text-purple-200"
                : role === "moderator"
                ? "border-primary/30 bg-primary/10 text-primary-200"
                : "border-white/[0.08] bg-white/[0.03] text-muted-foreground"
            }`}>
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-white">
                {role === "admin" ? (
                  <>
                    <Crown className="size-3.5 text-purple-400" />
                    <span className="text-purple-400">Poderes Totais de Administrador:</span>
                  </>
                ) : role === "moderator" ? (
                  <>
                    <Shield className="size-3.5 text-primary" />
                    <span className="text-primary">Escopo de Moderação:</span>
                  </>
                ) : (
                  <>
                    <User className="size-3.5 text-zinc-300" />
                    <span className="text-zinc-300">Acesso Padrão de Membro:</span>
                  </>
                )}
              </div>
              <p className="text-[11px] opacity-90">
                {role === "admin"
                  ? "Acesso ilimitado a /admin e /moderacao, edição e exclusão de qualquer usuário e anúncio, controle de métricas e cargos."
                  : role === "moderator"
                  ? "Acesso exclusivo à Central de Moderação (/moderacao) para aprovar e rejeitar novos anúncios com motivo formal. Sem acesso ao /admin."
                  : "Pode comprar produtos e criar anúncios próprios que passam por aprovação prévia. Sem acesso às centrais de moderação ou admin."}
              </p>
            </div>
          </div>

          {/* Avatares Rápidos */}
          <div>
            <label className="text-xs font-semibold text-foreground">Escolher Avatar Rápido</label>
            <div className="mt-2 flex items-center gap-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className={`relative size-10 rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 scale-105"
                        : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="size-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="size-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar URL Customizado */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Ou cole a URL da Foto de Perfil (opcional)</span>
              {avatarUrl && (
                <span className="text-[10px] text-primary">Prévia ativa</span>
              )}
            </label>
            <div className="mt-1.5 flex gap-2 items-center">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... (link direto)"
                className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-[#121317] px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              />
              {avatarUrl && (
                <div className="size-10 shrink-0 rounded-xl overflow-hidden border border-white/20 bg-black">
                  <img
                    src={avatarUrl}
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

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="gradient-lime flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="size-3.5" />
              <span>{isSubmitting ? "Salvando..." : initialProfile ? "Salvar Alterações" : "Criar Usuário"}</span>
            </button>
          </div>
        </form>
      </div>

      {showMatrixModal && (
        <PermissionsMatrixModal
          isOpen={showMatrixModal}
          onClose={() => setShowMatrixModal(false)}
          defaultRoleView={role}
        />
      )}
    </div>
  );
}
