import logoImg from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
}

export function Logo({ className, size = "md", showSubtitle = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 sm:h-9",
    md: "h-10 sm:h-11",
    lg: "h-14 sm:h-16",
    xl: "h-20 sm:h-24",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="relative flex items-center">
        <img
          src={logoImg}
          alt="SHOP7 - Tudo em um só lugar"
          className={cn(
            "w-auto object-contain transition-transform duration-300 hover:scale-[1.03] drop-shadow-[0_4px_16px_rgba(132,204,22,0.3)]",
            sizeClasses[size],
          )}
        />
      </div>
      {showSubtitle && (
        <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline-block font-medium border-l border-border pl-2.5">
          Marketplace
        </span>
      )}
    </div>
  );
}
