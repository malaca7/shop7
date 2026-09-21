import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Store,
  Calendar,
  Layers,
  Sparkles,
  Package,
  Wrench,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import type { Ad } from "@/lib/supabase";
import { formatBRL, CATEGORIES } from "@/data/catalog";

interface AdDetailModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (ad: Ad) => void;
  onReject?: (ad: Ad) => void;
}

export function AdDetailModal({
  ad,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: AdDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!isOpen || !ad) return null;

  const images = ad.images && ad.images.length > 0 ? ad.images : [];
  const currentImage = images[selectedImageIndex] || images[0] || null;

  const categoryObj = CATEGORIES.find(
    (c) => c.slug === ad.category || c.id === ad.category
  );
  const categoryLabel = categoryObj?.name || ad.category;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Não informado";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative z-10 my-auto w-full max-w-3xl rounded-3xl border border-white/[0.08] bg-[#0e0f13] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden text-foreground">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#121318] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Inspeção de Anúncio
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  ID: {ad.id}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                {ad.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de Status */}
            {ad.status === "approved" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
                <CheckCircle2 className="size-3.5" /> Aprovado
              </span>
            )}
            {ad.status === "pending" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 text-xs font-bold text-yellow-400">
                <Clock className="size-3.5" /> Aguardando Moderação
              </span>
            )}
            {ad.status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1 text-xs font-bold text-red-400">
                <XCircle className="size-3.5" /> Rejeitado
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-[#181920] text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Seção de Mídia e Imagens */}
          {images.length > 0 && (
            <div className="space-y-2.5">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black/50">
                <img
                  src={currentImage || ""}
                  alt={ad.title}
                  className="size-full object-contain"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="rounded-md border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                    {ad.type === "item" ? "Item (Produto)" : "Serviço"}
                  </span>
                  <span className="rounded-md border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-md">
                    {categoryLabel}
                  </span>
                </div>
              </div>

              {/* Miniaturas caso haja mais de uma imagem */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative size-16 shrink-0 overflow-hidden rounded-xl border transition-all ${
                        selectedImageIndex === idx
                          ? "border-primary ring-2 ring-primary/40 scale-105"
                          : "border-white/[0.08] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Destaques Principais: Preço, Estoque, Tipo e Categoria */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.06] bg-[#14151b] p-3.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Valor Cobrado
              </span>
              <p className="mt-1 font-display text-lg sm:text-xl font-bold text-primary">
                {formatBRL(ad.price)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#14151b] p-3.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Tipo de Anúncio
              </span>
              <p className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
                {ad.type === "item" ? (
                  <>
                    <Package className="size-4 text-primary" /> Item / Produto
                  </>
                ) : (
                  <>
                    <Wrench className="size-4 text-primary" /> Serviço Sob Demanda
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#14151b] p-3.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Categoria
              </span>
              <p className="mt-1 font-semibold text-foreground text-sm truncate">
                {categoryLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#14151b] p-3.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Estoque / Vagas
              </span>
              <p className="mt-1 font-semibold text-foreground text-sm">
                {ad.stock} {ad.type === "servico" ? "vaga(s)" : "unidade(s)"}
              </p>
            </div>
          </div>

          {/* ALERTA DE REJEIÇÃO (Se o anúncio foi rejeitado) */}
          {ad.status === "rejected" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-foreground">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Anúncio Rejeitado na Moderação</span>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-muted-foreground">Motivo registrado: </span>
                <strong className="text-red-300 font-semibold">
                  "{ad.rejection_reason || "Motivo não especificado"}"
                </strong>
              </div>
              {ad.moderated_at && (
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                  Decisão tomada em: {formatDate(ad.moderated_at)}
                </p>
              )}
            </div>
          )}

          {/* STATUS DE APROVAÇÃO (Se o anúncio foi aprovado) */}
          {ad.status === "approved" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-foreground">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Anúncio Aprovado e Ativo Publicamente no Marketplace</span>
              </div>
              {ad.moderated_at && (
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                  Aprovado em: {formatDate(ad.moderated_at)}
                  {ad.moderated_by ? ` · Moderador ID: ${ad.moderated_by}` : ""}
                </p>
              )}
            </div>
          )}

          {/* Descrição Completa do Anúncio */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#14151b] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              Descrição do Anúncio
            </h3>
            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {ad.description}
            </div>
          </div>

          {/* Informações Adicionais / Entrega */}
          {ad.additional_info && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#14151b] p-4 sm:p-5">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="size-3.5" /> Informações Adicionais de Entrega
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {ad.additional_info}
              </p>
            </div>
          )}

          {/* Metadados: Vendedor e Datas */}
          <div className="rounded-2xl border border-white/[0.04] bg-[#111216] p-4">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Dados do Anunciante & Submissão
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Vendedor:
                </span>
                <span className="font-semibold text-foreground">
                  {ad.seller_name || "Anunciante"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Data de Criação:
                </span>
                <span className="font-mono text-muted-foreground">
                  {formatDate(ad.created_at)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Última Atualização:
                </span>
                <span className="font-mono text-muted-foreground">
                  {formatDate(ad.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações de Moderação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.06] bg-[#121318] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-white/[0.08] bg-[#181920] px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Fechar Visualização
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2.5">
            {/* Ações para anúncio Pendente */}
            {ad.status === "pending" && (
              <>
                {onReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReject(ad);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="size-4" />
                    <span>Rejeitar Anúncio</span>
                  </button>
                )}

                {onApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApprove(ad);
                    }}
                    className="flex-1 sm:flex-none gradient-lime flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] hover:brightness-110 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Aprovar para Marketplace</span>
                  </button>
                )}
              </>
            )}

            {/* Ações para anúncio já Aprovado */}
            {ad.status === "approved" && onReject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReject(ad);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="size-4" />
                <span>Revogar Aprovação (Rejeitar)</span>
              </button>
            )}

            {/* Ações para anúncio Rejeitado */}
            {ad.status === "rejected" && onApprove && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(ad);
                }}
                className="flex-1 sm:flex-none gradient-lime flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] hover:brightness-110 active:scale-95 transition-all"
              >
                <CheckCircle2 className="size-4" />
                <span>Reavaliar & Aprovar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
