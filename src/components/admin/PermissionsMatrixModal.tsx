import { useState } from "react";
import {
  X,
  Shield,
  ShieldCheck,
  Crown,
  User,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  Search,
  Layers,
  Lock,
  Unlock,
} from "lucide-react";
import {
  getPermissionsMatrixFeatures,
  ROLE_DETAILS,
  type PermissionFeature,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/supabase";

interface PermissionsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoleView?: UserRole;
}

export function PermissionsMatrixModal({
  isOpen,
  onClose,
  defaultRoleView,
}: PermissionsMatrixModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRoleView || "user");
  const [viewMode, setViewMode] = useState<"matrix" | "cards">("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  if (!isOpen) return null;

  const categories = ["todos", "Anúncios", "Moderação", "Usuários & Contas", "Painéis & Sistema"];

  const filteredFeatures = getPermissionsMatrixFeatures().filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "todos" || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.08] bg-[#0b0c10] shadow-2xl text-foreground overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101217] px-6 py-5">
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/10">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Hierarquia & Segurança SHOP7
                </span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                  v2.0 ACL
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Matriz Oficial de Permissões e Restrições de Cargos
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-[#161820] text-muted-foreground hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Toolbar / Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0e1014] px-6 py-3.5">
          {/* Alternador de Visualização */}
          <div className="flex items-center rounded-xl border border-white/[0.06] bg-[#14161c] p-1">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "matrix"
                  ? "bg-primary text-black shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Layers className="size-3.5" />
              <span>Tabela Comparativa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-primary text-black shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Shield className="size-3.5" />
              <span>Cards por Cargo</span>
            </button>
          </div>

          {/* Busca e Filtro de Categoria */}
          <div className="flex flex-1 max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar permissão..."
                className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#14161c] pl-8 pr-3 text-xs text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {viewMode === "matrix" ? (
            /* Visualização Tabela Comparativa */
            <div className="space-y-4">
              {/* Category Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      selectedCategory === cat
                        ? "bg-white/[0.12] text-white border border-white/20"
                        : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] border border-white/[0.04]"
                    }`}
                  >
                    {cat === "todos" ? "Todas as Permissões" : cat}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111318]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-[#151820] text-muted-foreground">
                      <th className="py-3.5 pl-4 pr-2 font-semibold">Capacidade / Recurso</th>
                      <th className="py-3.5 px-3 font-semibold text-center w-28">
                        <div className="flex items-center justify-center gap-1 text-zinc-300 font-bold">
                          <User className="size-3.5" />
                          <span>Membro</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-3 font-semibold text-center w-28">
                        <div className="flex items-center justify-center gap-1 text-primary font-bold">
                          <ShieldCheck className="size-3.5" />
                          <span>Moderador</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-3 font-semibold text-center w-28">
                        <div className="flex items-center justify-center gap-1 text-purple-400 font-bold">
                          <Crown className="size-3.5" />
                          <span>Admin</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredFeatures.map((feat) => (
                      <tr
                        key={feat.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 pl-4 pr-3">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{feat.name}</span>
                            <span className="rounded bg-white/[0.05] px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground">
                              {feat.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed">
                            {feat.description}
                          </p>
                        </td>

                        {/* User Status */}
                        <td className="py-3 px-3 text-center align-middle">
                          {feat.user ? (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/15 text-emerald-400">
                              <CheckCircle2 className="size-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-500/10 text-red-400/60">
                              <XCircle className="size-4" />
                            </span>
                          )}
                        </td>

                        {/* Moderator Status */}
                        <td className="py-3 px-3 text-center align-middle">
                          {feat.moderator ? (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/15 text-emerald-400">
                              <CheckCircle2 className="size-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-500/10 text-red-400/60">
                              <XCircle className="size-4" />
                            </span>
                          )}
                        </td>

                        {/* Admin Status */}
                        <td className="py-3 px-3 text-center align-middle">
                          {feat.admin ? (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/15 text-emerald-400">
                              <CheckCircle2 className="size-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-500/10 text-red-400/60">
                              <XCircle className="size-4" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredFeatures.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Nenhum recurso encontrado para a busca especificada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Visualização Detalhada por Cards */
            <div className="space-y-6">
              {/* Role Select Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {(["user", "moderator", "admin"] as UserRole[]).map((r) => {
                  const info = ROLE_DETAILS[r];
                  const isSelected = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                        isSelected
                          ? r === "admin"
                            ? "border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-500/5 ring-2 ring-purple-500/20"
                            : r === "moderator"
                            ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/5 ring-2 ring-primary/20"
                            : "border-white/30 bg-white/[0.07] ring-2 ring-white/10"
                          : "border-white/[0.06] bg-[#12141a] text-muted-foreground hover:border-white/15"
                      }`}
                    >
                      <div className={`grid size-9 place-items-center rounded-xl mb-2 ${
                        r === "admin" ? "bg-purple-500/20 text-purple-300" : r === "moderator" ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
                      }`}>
                        {r === "admin" ? <Crown className="size-4" /> : r === "moderator" ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                      </div>
                      <span className="text-xs font-bold text-white">{info.title}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{info.summary}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Role Detailed Breakdown */}
              {(() => {
                const info = ROLE_DETAILS[selectedRole];
                return (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#111319] p-5 sm:p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${info.badgeBg} ${info.badgeColor} ${info.badgeBorder} border`}>
                            {selectedRole === "admin" ? <Crown className="size-3" /> : selectedRole === "moderator" ? <ShieldCheck className="size-3" /> : <User className="size-3" />}
                            {info.badgeLabel}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">
                          {info.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                          {info.fullDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Permissões Liberadas */}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                          <Unlock className="size-4" />
                          <span>Permissões Liberadas ({info.permissions.length})</span>
                        </div>
                        <ul className="space-y-2 text-xs">
                          {info.permissions.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-zinc-300">
                              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Restrições e Bloqueios */}
                      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                          <Lock className="size-4" />
                          <span>Restrições & Bloqueios ({info.restrictions.length})</span>
                        </div>
                        <ul className="space-y-2 text-xs">
                          {info.restrictions.map((r, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-zinc-300">
                              <XCircle className="size-3.5 text-red-400/80 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#101217] px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Info className="size-3.5 text-primary" />
            <span>As permissões são validadas em tempo real tanto na interface quanto nas APIs de serviço.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="gradient-lime rounded-xl px-5 py-2 text-xs font-bold text-black hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
