/**
 * Mock catalog data for SHOP7 (Etapa 1).
 * Clearly structured placeholder data — replaced by Lovable Cloud tables later.
 */

export type ProductType = "fisico" | "digital" | "item_jogo" | "conta" | "servico";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  items: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
  productType: ProductType;
  price: number;
  salePrice?: number;
  rating: number;
  reviews: number;
  sales: number;
  stock: number;
  seller: string;
  sellerVerified: boolean;
  deliveryLabel: string;
  accent: string;
};

export type Seller = {
  id: string;
  storeName: string;
  initials: string;
  rating: number;
  sales: number;
  since: string;
  badge: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "Produtos Físicos",
    slug: "produtos-fisicos",
    description: "Periféricos, hardware e acessórios com envio rastreado",
    icon: "Package",
    items: 1284,
  },
  {
    id: "c2",
    name: "Produtos Digitais",
    slug: "produtos-digitais",
    description: "Licenças, e-books, presets e arquivos com entrega imediata",
    icon: "CloudDownload",
    items: 2431,
  },
  {
    id: "c3",
    name: "Games",
    slug: "games",
    description: "Jogos, DLCs e chaves para todas as plataformas",
    icon: "Gamepad2",
    items: 1876,
  },
  {
    id: "c4",
    name: "Contas",
    slug: "contas",
    description: "Contas verificadas com transferência acompanhada",
    icon: "UserRound",
    items: 943,
  },
  {
    id: "c5",
    name: "Skins e Itens",
    slug: "skins-e-itens",
    description: "Itens raros e cosméticos negociados com segurança",
    icon: "Sparkles",
    items: 3120,
  },
  {
    id: "c6",
    name: "Gift Cards",
    slug: "gift-cards",
    description: "Créditos e recargas para as principais lojas",
    icon: "CreditCard",
    items: 612,
  },
  {
    id: "c7",
    name: "Serviços",
    slug: "servicos",
    description: "Boosting, coaching, design e consultoria sob demanda",
    icon: "Wrench",
    items: 807,
  },
  {
    id: "c8",
    name: "Software",
    slug: "software",
    description: "Ferramentas, plugins e assinaturas profissionais",
    icon: "AppWindow",
    items: 528,
  },
  {
    id: "c9",
    name: "Outros",
    slug: "outros",
    description: "Tudo o que não se encaixa nas demais categorias",
    icon: "Shapes",
    items: 240,
  },
];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  fisico: "Físico",
  digital: "Digital",
  item_jogo: "Item de jogo",
  conta: "Conta",
  servico: "Serviço",
};

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Teclado mecânico low-profile 75% hot-swap",
    slug: "teclado-mecanico-75",
    categorySlug: "produtos-fisicos",
    productType: "fisico",
    price: 899.9,
    salePrice: 729.9,
    rating: 4.9,
    reviews: 218,
    sales: 640,
    stock: 12,
    seller: "NorthPeak Store",
    sellerVerified: true,
    deliveryLabel: "Envio em 24h",
    accent: "from-[oklch(0.35_0.05_150)] to-[oklch(0.2_0.02_150)]",
  },
  {
    id: "p2",
    title: "Pacote de 240 presets cinematográficos 4K",
    slug: "presets-cinematograficos",
    categorySlug: "produtos-digitais",
    productType: "digital",
    price: 189,
    salePrice: 119,
    rating: 4.8,
    reviews: 512,
    sales: 2130,
    stock: 999,
    seller: "Studio Lumen",
    sellerVerified: true,
    deliveryLabel: "Entrega imediata",
    accent: "from-[oklch(0.34_0.07_290)] to-[oklch(0.2_0.02_290)]",
  },
  {
    id: "p3",
    title: "Conta competitiva nível alto — full acesso",
    slug: "conta-competitiva-full",
    categorySlug: "contas",
    productType: "conta",
    price: 1450,
    rating: 4.7,
    reviews: 96,
    sales: 148,
    stock: 3,
    seller: "ProAccounts BR",
    sellerVerified: true,
    deliveryLabel: "Transferência mediada",
    accent: "from-[oklch(0.33_0.08_60)] to-[oklch(0.2_0.02_60)]",
  },
  {
    id: "p4",
    title: "Skin rara colecionável — float baixo",
    slug: "skin-rara-float-baixo",
    categorySlug: "skins-e-itens",
    productType: "item_jogo",
    price: 3290,
    salePrice: 2990,
    rating: 5,
    reviews: 41,
    sales: 62,
    stock: 1,
    seller: "VaultMarket",
    sellerVerified: true,
    deliveryLabel: "Entrega em até 2h",
    accent: "from-[oklch(0.34_0.09_200)] to-[oklch(0.2_0.02_200)]",
  },
  {
    id: "p5",
    title: "Gift card de créditos — 100 BRL",
    slug: "gift-card-100",
    categorySlug: "gift-cards",
    productType: "digital",
    price: 100,
    salePrice: 94.5,
    rating: 4.9,
    reviews: 1840,
    sales: 9120,
    stock: 500,
    seller: "KeyDrop Oficial",
    sellerVerified: true,
    deliveryLabel: "Código automático",
    accent: "from-[oklch(0.33_0.06_120)] to-[oklch(0.2_0.02_120)]",
  },
  {
    id: "p6",
    title: "Headset sem fio com áudio espacial",
    slug: "headset-audio-espacial",
    categorySlug: "produtos-fisicos",
    productType: "fisico",
    price: 1299,
    salePrice: 999,
    rating: 4.6,
    reviews: 143,
    sales: 380,
    stock: 8,
    seller: "NorthPeak Store",
    sellerVerified: true,
    deliveryLabel: "Frete grátis",
    accent: "from-[oklch(0.32_0.05_20)] to-[oklch(0.2_0.02_20)]",
  },
  {
    id: "p7",
    title: "Licença anual de suíte criativa",
    slug: "licenca-suite-criativa",
    categorySlug: "software",
    productType: "digital",
    price: 749,
    rating: 4.8,
    reviews: 267,
    sales: 720,
    stock: 120,
    seller: "SoftHub",
    sellerVerified: false,
    deliveryLabel: "Chave por e-mail",
    accent: "from-[oklch(0.33_0.07_255)] to-[oklch(0.2_0.02_255)]",
  },
  {
    id: "p8",
    title: "Controle pro com gatilhos ajustáveis",
    slug: "controle-pro-gatilhos",
    categorySlug: "produtos-fisicos",
    productType: "fisico",
    price: 689,
    salePrice: 579,
    rating: 4.7,
    reviews: 88,
    sales: 210,
    stock: 15,
    seller: "GearLab",
    sellerVerified: true,
    deliveryLabel: "Envio em 48h",
    accent: "from-[oklch(0.32_0.06_330)] to-[oklch(0.2_0.02_330)]",
  },
];

export const BEST_SELLERS: Product[] = [
  FEATURED_PRODUCTS[4]!,
  FEATURED_PRODUCTS[1]!,
  FEATURED_PRODUCTS[0]!,
  FEATURED_PRODUCTS[6]!,
];

export const SERVICES: Product[] = [
  {
    id: "s1",
    title: "Coaching competitivo 1:1 — 5 sessões",
    slug: "coaching-competitivo",
    categorySlug: "servicos",
    productType: "servico",
    price: 480,
    salePrice: 399,
    rating: 4.9,
    reviews: 132,
    sales: 310,
    stock: 20,
    seller: "Academia Nova",
    sellerVerified: true,
    deliveryLabel: "Agendamento flexível",
    accent: "from-[oklch(0.33_0.07_150)] to-[oklch(0.2_0.02_150)]",
  },
  {
    id: "s2",
    title: "Identidade visual completa para loja",
    slug: "identidade-visual-loja",
    categorySlug: "servicos",
    productType: "servico",
    price: 2400,
    rating: 5,
    reviews: 47,
    sales: 61,
    stock: 5,
    seller: "Studio Lumen",
    sellerVerified: true,
    deliveryLabel: "Entrega em 7 dias",
    accent: "from-[oklch(0.33_0.06_60)] to-[oklch(0.2_0.02_60)]",
  },
  {
    id: "s3",
    title: "Configuração e otimização de setup",
    slug: "otimizacao-de-setup",
    categorySlug: "servicos",
    productType: "servico",
    price: 220,
    salePrice: 179,
    rating: 4.8,
    reviews: 205,
    sales: 540,
    stock: 30,
    seller: "GearLab",
    sellerVerified: false,
    deliveryLabel: "Remoto, mesmo dia",
    accent: "from-[oklch(0.32_0.06_240)] to-[oklch(0.2_0.02_240)]",
  },
  {
    id: "s4",
    title: "Consultoria de vendas para marketplaces",
    slug: "consultoria-vendas",
    categorySlug: "servicos",
    productType: "servico",
    price: 890,
    rating: 4.7,
    reviews: 38,
    sales: 74,
    stock: 10,
    seller: "ProAccounts BR",
    sellerVerified: true,
    deliveryLabel: "2 encontros online",
    accent: "from-[oklch(0.32_0.06_300)] to-[oklch(0.2_0.02_300)]",
  },
];

export const TOP_SELLERS: Seller[] = [
  {
    id: "v1",
    storeName: "NorthPeak Store",
    initials: "NP",
    rating: 4.9,
    sales: 4820,
    since: "2021",
    badge: "Verificado",
  },
  {
    id: "v2",
    storeName: "Studio Lumen",
    initials: "SL",
    rating: 4.9,
    sales: 3110,
    since: "2022",
    badge: "Elite",
  },
  {
    id: "v3",
    storeName: "VaultMarket",
    initials: "VM",
    rating: 4.8,
    sales: 2740,
    since: "2020",
    badge: "Verificado",
  },
  {
    id: "v4",
    storeName: "KeyDrop Oficial",
    initials: "KD",
    rating: 4.8,
    sales: 9210,
    since: "2019",
    badge: "Parceiro",
  },
];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
