import { useState } from "react";
import { X, AlertTriangle, Sparkles } from "lucide-react";

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  adTitle: string;
}

const QUICK_REJECTION_PRESETS = [
  "Dados de contato externo proibidos (telefone, links, discord ou redes sociais)",
  "Imagens de baixa qualidade, impróprias ou com marcas d'água de terceiros",
  "Preço ou especificação flagrantemente incorretos",
  "Item ou serviço proibido pelas Diretrizes de Moderação do SHOP7",
  "Descrição vaga ou insuficiente sobre o item / termos de entrega",
  "Suspeita de violação de direitos autorais ou uso indevido de marca",
];

export function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  adTitle,
}: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: string) => {
    setReason(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Por favor, informe a justificativa da rejeição para orientar o anunciante.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao rejeitar anúncio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-red-500/30 bg-[#0e0f13] p-6 shadow-2xl text-foreground">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5 text-red-400">
            <AlertTriangle className="size-5" />
            <h3 className="text-base font-bold text-foreground">Rejeitar Anúncio</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-white/[0.06] bg-surface text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Você está rejeitando o anúncio: <strong className="text-foreground font-semibold">"{adTitle}"</strong>.
        </p>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Motivos Rápidos Pré-configurados */}
        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Motivos frequentes (clique para preencher):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REJECTION_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-left rounded-lg border px-2.5 py-1 text-[11px] transition-all ${
                  reason === preset
                    ? "border-red-500/50 bg-red-500/20 text-red-300 font-medium"
                    : "border-white/[0.06] bg-[#14151a] text-muted-foreground hover:border-white/15 hover:text-foreground"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="reject-reason" className="text-xs font-semibold text-foreground">
              Justificativa Detalhada da Rejeição * (visível para o anunciante)
            </label>
            <textarea
              id="reject-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva claramente o motivo da recusa para que o vendedor possa corrigir o anúncio..."
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#14151a] p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-red-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Gravando decisão..." : "Confirmar Rejeição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

