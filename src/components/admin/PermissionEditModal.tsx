import { useState, useEffect } from "react";
import { X, Save, Layers, CheckCircle2 } from "lucide-react";
import type { PermissionFeature } from "@/lib/permissions";

interface PermissionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feature: PermissionFeature) => void;
  editingFeature: PermissionFeature | null;
}

export function PermissionEditModal({
  isOpen,
  onClose,
  onSave,
  editingFeature,
}: PermissionEditModalProps) {
  const [formData, setFormData] = useState<PermissionFeature>({
    id: "",
    name: "",
    description: "",
    category: "Painéis & Sistema",
    user: false,
    moderator: false,
    admin: true,
  });

  useEffect(() => {
    if (editingFeature) {
      setFormData(editingFeature);
    } else {
      setFormData({
        id: "perm_" + Date.now().toString(36),
        name: "",
        description: "",
        category: "Painéis & Sistema",
        user: false,
        moderator: false,
        admin: true,
      });
    }
  }, [editingFeature, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;
    onSave({
      ...formData,
      id: formData.id || "perm_" + Date.now().toString(36)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0c0d10] shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {editingFeature ? "Editar Permissão" : "Nova Permissão"}
              </h2>
              <p className="text-xs text-muted-foreground">Configuração de privilégio de sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-white/[0.08] hover:bg-white/[0.04]">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">Nome da Permissão</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
              placeholder="Ex: Criar Cupons de Desconto"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Descrição</label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#14151a] p-3 text-xs text-foreground focus:border-primary/50 focus:outline-none resize-none"
              placeholder="Descreva o que esta permissão autoriza a fazer."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-[#14151a] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="Anúncios">Anúncios</option>
              <option value="Moderação">Moderação</option>
              <option value="Usuários & Contas">Usuários & Contas</option>
              <option value="Painéis & Sistema">Painéis & Sistema</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="text-xs font-semibold text-foreground block mb-2">Pode ser executada pelos papéis:</label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${formData.user ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/[0.08] bg-[#14151a]"}`}>
                <span className="text-xs font-bold">Membro</span>
                <input
                  type="checkbox"
                  checked={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.checked })}
                  className="hidden"
                />
                {formData.user && <CheckCircle2 className="size-4 text-emerald-400" />}
              </label>

              <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${formData.moderator ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/[0.08] bg-[#14151a]"}`}>
                <span className="text-xs font-bold text-primary">Moderador</span>
                <input
                  type="checkbox"
                  checked={formData.moderator}
                  onChange={(e) => setFormData({ ...formData, moderator: e.target.checked })}
                  className="hidden"
                />
                {formData.moderator && <CheckCircle2 className="size-4 text-emerald-400" />}
              </label>

              <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${formData.admin ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/[0.08] bg-[#14151a]"}`}>
                <span className="text-xs font-bold text-purple-400">Admin</span>
                <input
                  type="checkbox"
                  checked={formData.admin}
                  onChange={(e) => setFormData({ ...formData, admin: e.target.checked })}
                  className="hidden"
                />
                {formData.admin && <CheckCircle2 className="size-4 text-emerald-400" />}
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="gradient-lime flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
            >
              <Save className="size-3.5" />
              <span>Salvar Permissão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
