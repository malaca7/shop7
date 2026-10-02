import { useState, useEffect } from "react";
import { X, User, Mail, Shield, Crown, Sparkles, Image, Trash2 } from "lucide-react";
import { AdsService } from "@/lib/ads-service";
import type { Profile, UserRole } from "@/lib/supabase";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
  initialProfile?: Profile | null;
}

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
      setAvatarUrl("");
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
      setError(err?.message || "Erro ao salvar usuário.");
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
                placeholder="Ex: Carlos Eduardo ou Empresa LTDA"
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
            <label className="text-xs font-semibold text-foreground">Papel & Permissões no Sistema</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[
                { id: "user" as UserRole, label: "Membro (User)", desc: "Comprar & Vender", icon: User, color: "hover:border-white/20" },
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
          </div>

          {/* Avatar URL */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>URL da Foto de Perfil / Avatar (opcional)</span>
              {avatarUrl && (
                <span className="text-[10px] text-primary">Prévia disponível</span>
              )}
            </label>
            <div className="mt-1.5 flex gap-2 items-center">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... (link de imagem)"
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
    </div>
  );
}
