import { useState, useEffect } from "react";
import { X, ShieldAlert, Sparkles, ImagePlus, UploadCloud, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { AdsService } from "@/lib/ads-service";
import { useAuth } from "@/contexts/AuthContext";
import type { Ad, AdType, AdStatus } from "@/lib/supabase";

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ad: Ad) => void;
  initialAd?: Ad | null;
  isAdminMode?: boolean;
}

export function CreateAdModal({
  isOpen,
  onClose,
  onSuccess,
  initialAd,
  isAdminMode = false,
}: CreateAdModalProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState(initialAd?.title || "");
  const [description, setDescription] = useState(initialAd?.description || "");
  const [category, setCategory] = useState(initialAd?.category || "produtos-digitais");
  const [type, setType] = useState<AdType>(initialAd?.type || "item");
  const [price, setPrice] = useState<string>(initialAd ? String(initialAd.price) : "");
  const [stock, setStock] = useState<string>(initialAd ? String(initialAd.stock) : "1");
  const [imageUrl, setImageUrl] = useState<string>(initialAd?.images?.[0] || "");
  const [additionalInfo, setAdditionalInfo] = useState(initialAd?.additional_info || "");
  
  // Campos administrativos
  const [status, setStatus] = useState<AdStatus>(initialAd?.status || (isAdminMode ? "approved" : "pending"));
  const [sellerName, setSellerName] = useState(initialAd?.seller_name || profile?.full_name || "Vendedor SHOP7");
  const [rejectionReason, setRejectionReason] = useState(initialAd?.rejection_reason || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAd) {
      setTitle(initialAd.title);
      setDescription(initialAd.description);
      setCategory(initialAd.category);
      setType(initialAd.type);
      setPrice(String(initialAd.price));
      setStock(String(initialAd.stock));
      setImageUrl(initialAd.images?.[0] || "");
      setAdditionalInfo(initialAd.additional_info || "");
      setStatus(initialAd.status);
      setSellerName(initialAd.seller_name || profile?.full_name || "Vendedor SHOP7");
      setRejectionReason(initialAd.rejection_reason || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("produtos-digitais");
      setType("item");
      setPrice("");
      setStock("1");
      setImageUrl("");
      setAdditionalInfo("");
      setStatus(isAdminMode ? "approved" : "pending");
      setSellerName(profile?.full_name || user?.email?.split("@")[0] || "Vendedor SHOP7");
      setRejectionReason("");
    }
    setError(null);
  }, [initialAd, isOpen, isAdminMode, profile, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Você precisa estar autenticado para anunciar.");
      return;
    }
    if (!title.trim() || !description.trim() || !price) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    const numPrice = parseFloat(price.replace(",", "."));
    if (isNaN(numPrice) || numPrice <= 0) {
      setError("Informe um preço válido.");
      return;
    }

    const numStock = parseInt(stock) || 1;

    setIsSubmitting(true);
    setError(null);

    try {
      const defaultImg =
        imageUrl.trim() ||
        (type === "servico"
          ? "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60"
          : "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=60");

      if (isAdminMode) {
        // Fluxo com permissão de Moderador / Admin
        if (initialAd) {
          const updated = await AdsService.adminUpdateAd(initialAd.id, {
            title: title.trim(),
            description: description.trim(),
            category,
            type,
            price: numPrice,
            stock: numStock,
            images: [defaultImg],
            additional_info: additionalInfo.trim() || null,
            status,
            rejection_reason: status === "rejected" ? rejectionReason.trim() || "Não especificado" : null,
            seller_name: sellerName.trim() || "Vendedor SHOP7",
          });
          onSuccess(updated);
        } else {
          const created = await AdsService.adminCreateAd({
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            category,
            type,
            price: numPrice,
            stock: numStock,
            images: [defaultImg],
            additional_info: additionalInfo.trim() || null,
            seller_name: sellerName.trim() || profile?.full_name || "Vendedor Verificado",
            status,
            rejection_reason: status === "rejected" ? rejectionReason.trim() || null : null,
          });
          onSuccess(created);
        }
      } else {
        // Fluxo padrão de Usuário (Moderação Forçada)
        if (initialAd) {
          const updated = await AdsService.updateAd(initialAd.id, {
            title: title.trim(),
            description: description.trim(),
            category,
            type,
            price: numPrice,
            stock: numStock,
            images: [defaultImg],
            additional_info: additionalInfo.trim() || null,
          });
          onSuccess(updated);
        } else {
          const created = await AdsService.createAd({
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            category,
            type,
            price: numPrice,
            stock: numStock,
            images: [defaultImg],
            additional_info: additionalInfo.trim() || null,
            seller_name: profile?.full_name || user.email.split("@")[0] || "Vendedor",
          });
          onSuccess(created);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar anúncio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop escuro com blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-5 sm:p-7 shadow-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {isAdminMode ? "Painel de Gestão · Admin & Mod" : initialAd ? "Editar Anúncio" : "Novo Anúncio"}
              </span>
              {isAdminMode && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/30">
                  Controle Total
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {isAdminMode
                ? initialAd
                  ? `Gerenciar Anúncio: ${initialAd.title.slice(0, 30)}...`
                  : "Criar Anúncio Direto (Admin / Mod)"
                : initialAd
                ? "Atualizar detalhes do anúncio"
                : "Publicar item ou serviço no SHOP7"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-white/[0.06] bg-[#14151b] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Alerta de Modo */}
        {isAdminMode ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/[0.08] p-3.5 text-xs text-purple-200">
            <ShieldCheck className="size-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-purple-300 font-semibold">Modo de Gestão Administrativa:</strong>{" "}
              Como Moderador/Admin, você pode editar qualquer dado, alterar o vendedor e definir o status diretamente (Aprovado imediatamente, Pendente ou Rejeitado com justificativa).
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-3.5 text-xs text-muted-foreground">
            <ShieldAlert className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-primary font-semibold">Moderação Obrigatória:</strong>{" "}
              Todo anúncio novo ou editado por usuários inicia como{" "}
              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-bold text-primary">Pendente</span>{" "}
              e só aparecerá publicamente após ser avaliado pela moderação.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Se for Admin Mode: Status & Vendedor */}
          {isAdminMode && (
            <div className="grid sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-[#121318]">
              {/* Status do Anúncio */}
              <div>
                <label className="text-xs font-semibold text-foreground">Status do Anúncio</label>
                <div className="mt-1.5 flex gap-1.5">
                  {[
                    { id: "approved" as AdStatus, label: "Aprovado", icon: CheckCircle2, color: "text-primary border-primary/40 bg-primary/10" },
                    { id: "pending" as AdStatus, label: "Pendente", icon: Clock, color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" },
                    { id: "rejected" as AdStatus, label: "Rejeitado", icon: AlertTriangle, color: "text-red-400 border-red-500/40 bg-red-500/10" },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStatus(s.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                          isSelected ? s.color : "border-white/[0.06] bg-[#16171d] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nome do Vendedor / Anunciante */}
              <div>
                <label className="text-xs font-semibold text-foreground">Nome do Vendedor / Loja</label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Nome exibido no card do marketplace"
                  className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#16171d] px-3.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>

              {/* Justificativa caso rejeitado */}
              {status === "rejected" && (
                <div className="sm:col-span-2 mt-1">
                  <label className="text-xs font-semibold text-red-400">Motivo da Rejeição (visível para o anunciante)</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Preço inconsistente, imagens inadequadas, falta de detalhes"
                    className="mt-1.5 h-10 w-full rounded-xl border border-red-500/30 bg-[#16171d] px-3.5 text-xs text-foreground focus:border-red-500/60 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tipo: Item ou Serviço */}
          <div>
            <label className="text-xs font-semibold text-foreground">Tipo de Anúncio *</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("item")}
                className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                  type === "item"
                    ? "gradient-lime text-black border-transparent shadow-[0_2px_12px_rgba(132,204,22,0.3)]"
                    : "border-white/[0.08] bg-[#121317] text-muted-foreground hover:text-foreground"
                }`}
              >
                Item / Produto Físico ou Digital
              </button>
              <button
                type="button"
                onClick={() => setType("servico")}
                className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                  type === "servico"
                    ? "gradient-lime text-black border-transparent shadow-[0_2px_12px_rgba(132,204,22,0.3)]"
                    : "border-white/[0.08] bg-[#121317] text-muted-foreground hover:text-foreground"
                }`}
              >
                Serviço Sob Demanda
              </button>
            </div>
          </div>

          {/* Título */}
          <div>
            <label htmlFor="ad-title" className="text-xs font-semibold text-foreground">
              Título do Anúncio *
            </label>
            <input
              id="ad-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Conta Valorant Imortal 3 · Vandal Vingança de Gaia"
              className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] px-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="ad-cat" className="text-xs font-semibold text-foreground">
              Categoria *
            </label>
            <select
              id="ad-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              {CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                <option key={c.slug} value={c.slug} className="bg-[#121317] text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preço e Estoque */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ad-price" className="text-xs font-semibold text-foreground">
                Preço em R$ *
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  R$
                </span>
                <input
                  id="ad-price"
                  type="text"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ad-stock" className="text-xs font-semibold text-foreground">
                Quantidade / Estoque *
              </label>
              <input
                id="ad-stock"
                type="number"
                min="1"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#121317] px-3.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* URL da Imagem */}
          <div>
            <label htmlFor="ad-image" className="text-xs font-semibold text-foreground">
              Link da Imagem / Foto do Anúncio
            </label>
            <div className="mt-1.5 flex gap-2 items-center">
              <input
                id="ad-image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg (opcional - capa automática se vazio)"
                className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-[#121317] px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              />
              {imageUrl && (
                <div className="size-10 shrink-0 rounded-xl overflow-hidden border border-white/20 bg-black">
                  <img
                    src={imageUrl}
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

          {/* Descrição */}
          <div>
            <label htmlFor="ad-desc" className="text-xs font-semibold text-foreground">
              Descrição Completa *
            </label>
            <textarea
              id="ad-desc"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes do produto, condições, especificações ou metodologia do serviço."
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#121317] p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Informações adicionais */}
          <div>
            <label htmlFor="ad-info" className="text-xs font-semibold text-foreground">
              Informações Adicionais / Pós-compra (opcional)
            </label>
            <textarea
              id="ad-info"
              rows={2}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Ex: Como será realizada a entrega, prazos combinados, requisitos para execução."
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#121317] p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Botões de Ação */}
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
              className="gradient-lime flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="size-3.5" />
              <span>
                {isSubmitting
                  ? "Salvando..."
                  : isAdminMode
                  ? initialAd
                    ? "Salvar Modificações (Admin)"
                    : "Publicar Anúncio (Admin)"
                  : initialAd
                  ? "Salvar & Re-submeter"
                  : "Enviar para Aprovação"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
