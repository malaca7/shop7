import { useState } from "react";
import {
  X,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Store,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatBRL, type Product } from "@/data/catalog";
import { useAuth } from "@/contexts/AuthContext";
import { OrdersService } from "@/lib/orders-service";
import { useNavigate } from "@tanstack/react-router";

interface CheckoutModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CheckoutModal({ product, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  if (!isOpen || !product) return null;

  const handleConfirmPurchase = async () => {
    if (!user) {
      onClose();
      navigate({ to: "/auth" });
      return;
    }

    setIsProcessing(true);
    try {
      const order = await OrdersService.createOrder({
        ad_id: product.id,
        buyer_id: user.id,
        seller_id: (product as any).user_id || null,
        title: product.title,
        price: product.price,
        quantity: 1,
        seller_name: product.seller,
        buyer_name: profile?.full_name || user.email.split("@")[0],
      });

      setSuccessOrder(order);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Erro ao processar compra. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={handleClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      <div className="relative z-10 my-auto w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0e0f13] p-6 shadow-2xl text-foreground">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-xl border border-white/[0.06] bg-[#181920] text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {!successOrder ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <ShoppingBag className="size-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Checkout Seguro SHOP7
                </span>
                <h2 className="text-base font-bold text-foreground">Confirmar Pedido</h2>
              </div>
            </div>

            {/* Detalhes do Produto */}
            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#14151b] p-4 flex gap-3 items-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="size-16 rounded-xl object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="grid size-16 place-items-center rounded-xl bg-black/50 border border-white/10 shrink-0 text-muted-foreground">
                  <Store className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2">
                  {product.title}
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Vendedor: <strong className="text-foreground">{product.seller}</strong>
                </p>
                <p className="mt-0.5 text-xs font-bold text-primary font-display">
                  {formatBRL(product.price)}
                </p>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="mt-4 rounded-2xl border border-white/[0.04] bg-[#111216] p-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBRL(product.price)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de Intermediação SHOP7</span>
                <span className="text-emerald-400 font-semibold">Grátis (Garantido)</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-2 text-sm font-bold text-foreground">
                <span>Total a Pagar</span>
                <span className="text-primary font-display">{formatBRL(product.price)}</span>
              </div>
            </div>

            {/* Garantia */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>O valor permanece retido em custódia até você confirmar a entrega.</span>
            </div>

            {/* Botão de Confirmação */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPurchase}
              className="gradient-lime mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-black shadow-[0_4px_16px_rgba(132,204,22,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black" />
                  <span>Processando Compra...</span>
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  <span>Confirmar e Finalizar Compra</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-foreground">Compra Concluída com Sucesso!</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Seu pedido <strong className="text-primary font-mono">{successOrder.id}</strong> foi registrado e está salvo no seu histórico.
            </p>

            {successOrder.activation_code && (
              <div className="mt-4 rounded-xl border border-white/10 bg-[#14151b] p-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Sua Chave / Código de Ativação:
                </span>
                <code className="text-primary font-mono font-bold text-sm select-all block mt-1">
                  {successOrder.activation_code}
                </code>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate({ to: "/minha-conta" });
                }}
                className="gradient-lime flex-1 rounded-xl py-2.5 text-xs font-bold text-black shadow-md"
              >
                Ver Meus Pedidos
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-white/[0.08] bg-[#14151b] px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
