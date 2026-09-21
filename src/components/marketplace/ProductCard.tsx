import { Heart, ShieldCheck, Star, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PRODUCT_TYPE_LABEL, formatBRL, type Product } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const price = product.salePrice ?? product.price;
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0e0f13] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_36px_-12px_rgba(132,204,22,0.22)]">
      {/* Thumbnail Area with Subtle Gradient */}
      <div className={cn("relative aspect-[16/11] w-full overflow-hidden bg-gradient-to-br", product.accent)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_65%)]" />
        
        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
            {PRODUCT_TYPE_LABEL[product.productType]}
          </span>
          {discount > 0 && (
            <span className="gradient-lime rounded-md px-1.5 py-0.5 text-[10px] font-bold text-black shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Favorite Action */}
        <button
          type="button"
          aria-label={`Favoritar ${product.title}`}
          className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-lg border border-white/10 bg-black/40 text-muted-foreground backdrop-blur-md transition-colors hover:text-primary active:scale-95"
        >
          <Heart className="size-3.5" />
        </button>

        {/* Delivery pill */}
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-md">
          <Zap className="size-2.5 text-primary" />
          {product.deliveryLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {product.title}
        </h3>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="size-3 fill-primary text-primary" />
            <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground/60">({product.reviews})</span>
          </div>
          <span className="text-muted-foreground/70">{product.sales} vendas</span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/80">
          {product.sellerVerified && <ShieldCheck className="size-3 text-primary shrink-0" />}
          <span className="truncate">{product.seller}</span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-white/[0.04] pt-2.5">
          <div>
            {product.salePrice && (
              <p className="text-[10px] text-muted-foreground/60 line-through">
                {formatBRL(product.price)}
              </p>
            )}
            <p className="font-display text-sm sm:text-base font-bold text-foreground">
              {formatBRL(price)}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border border-white/[0.08] bg-[#17181e] px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary hover:text-black"
          >
            Comprar
          </button>
        </div>
      </div>
    </article>
  );
}
