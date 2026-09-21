import { Logo } from "@/components/brand/Logo";
import { ShieldCheck, Zap, Lock, Headphones } from "lucide-react";

const ESSENTIAL_LINKS = [
  {
    title: "Marketplace",
    links: [
      { label: "Produtos Físicos", href: "#produtos-fisicos" },
      { label: "Itens Digitais", href: "#produtos-digitais" },
      { label: "Games & Contas", href: "#games" },
      { label: "Serviços", href: "#servicos" },
    ],
  },
  {
    title: "Vendedores",
    links: [
      { label: "Como Vender", href: "#" },
      { label: "Taxas e Prazos", href: "#" },
      { label: "Segurança de Saldo", href: "#" },
      { label: "Painel do Vendedor", href: "#" },
    ],
  },
  {
    title: "Ajuda & Termos",
    links: [
      { label: "Compra Protegida", href: "#protecao" },
      { label: "Central de Suporte", href: "#" },
      { label: "Termos de Uso", href: "#" },
      { label: "Privacidade", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#060608] pb-24 pt-12 md:pb-12">
      <div className="mx-auto w-[94%] max-w-[1520px]">
        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 gap-3 pb-10 sm:grid-cols-4 md:gap-4 border-b border-white/[0.05]">
          {[
            [ShieldCheck, "Intermediação Segura", "Saldo retido até a entrega"],
            [Zap, "Entrega Instantânea", "Automática para itens digitais"],
            [Lock, "Dados Protegidos", "Criptografia de ponta a ponta"],
            [Headphones, "Suporte Rápido", "Mediação ágil de disputas"],
          ].map(([Icon, title, subtitle]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={title as string} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#0c0d10] p-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <I className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{title as string}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{subtitle as string}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Footer Links */}
        <div className="grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo size="md" showSubtitle />
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Marketplace premium de produtos físicos, itens digitais, contas e serviços. Segurança total com pagamento retido até confirmação.
            </p>
          </div>

          {ESSENTIAL_LINKS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 text-[11px] text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} SHOP7. Tudo em um só lugar.</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Plataforma operando normalmente
          </span>
        </div>
      </div>
    </footer>
  );
}
