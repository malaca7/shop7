import {
  Home,
  LayoutGrid,
  Plus,
  ShoppingBag,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  cartCount?: number;
}

export function MobileBottomNav({
  activeTab = "home",
  onTabChange,
  cartCount = 2,
}: MobileBottomNavProps) {
  const [current, setCurrent] = useState(activeTab);

  const handleSelect = (tab: string, href?: string) => {
    setCurrent(tab);
    onTabChange?.(tab);
    if (href) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      aria-label="Navegação mobile rápida"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.07] bg-[#09090b]/92 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
    >
      <div className="flex w-full items-center justify-around">
        <button
          type="button"
          onClick={() => handleSelect("home")}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
            current === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Home className="size-5" />
          <span>Início</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("categories", "#categorias")}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
            current === "categories" ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="size-5" />
          <span>Categorias</span>
        </button>

        {/* Central App Action: Anunciar */}
        <button
          type="button"
          onClick={() => handleSelect("sell")}
          className="group relative -top-3 flex flex-col items-center gap-1"
          aria-label="Anunciar produto"
        >
          <div className="gradient-lime grid size-12 place-items-center rounded-full text-primary-foreground shadow-[0_4px_18px_rgba(132,204,22,0.45)] transition-transform group-hover:scale-105 active:scale-95">
            <Plus className="size-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-semibold text-primary">Anunciar</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("cart")}
          className={cn(
            "relative flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
            current === "cart" ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div className="relative">
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="gradient-lime absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full text-[9px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </div>
          <span>Carrinho</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("profile")}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
            current === "profile" ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <User className="size-5" />
          <span>Conta</span>
        </button>
      </div>
    </nav>
  );
}
