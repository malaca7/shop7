import type { Profile, UserRole } from "./supabase";

export type PermissionAction =
  // Anúncios
  | "ads:create"
  | "ads:create_direct_approved"
  | "ads:edit_own"
  | "ads:edit_any"
  | "ads:delete_own"
  | "ads:delete_any"
  | "ads:moderate"
  | "ads:view_pending"
  // Usuários
  | "users:list"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "users:change_role"
  // Acessos aos Painéis
  | "access:user_panel"
  | "access:moderation_panel"
  | "access:admin_panel"
  // Métricas e Sistema
  | "metrics:view"
  | "system:audit";

export interface PermissionFeature {
  id: string;
  name: string;
  description: string;
  category: "Anúncios" | "Moderação" | "Usuários & Contas" | "Painéis & Sistema";
  user: boolean;
  moderator: boolean;
  admin: boolean;
}

const DEFAULT_PERMISSIONS_MATRIX_FEATURES: PermissionFeature[] = [
  // Anúncios
  {
    id: "ads_browse_buy",
    name: "Comprar e Visualizar Catálogo",
    description: "Navegar por ofertas aprovadas e realizar compras na plataforma.",
    category: "Anúncios",
    user: true,
    moderator: true,
    admin: true,
  },
  {
    id: "ads_create_pending",
    name: "Criar Anúncios Próprios",
    description: "Publicar novos anúncios (enviados para moderação obrigatória).",
    category: "Anúncios",
    user: true,
    moderator: true,
    admin: true,
  },
  {
    id: "ads_create_direct",
    name: "Publicar Anúncios Aprovados Diretos",
    description: "Criar anúncios que vão direto ao ar sem fila de espera.",
    category: "Anúncios",
    user: false,
    moderator: false,
    admin: true,
  },
  {
    id: "ads_edit_delete_own",
    name: "Editar e Excluir Anúncios Próprios",
    description: "Alterar ou remover os próprios anúncios cadastrados na conta.",
    category: "Anúncios",
    user: true,
    moderator: true,
    admin: true,
  },
  {
    id: "ads_edit_delete_any",
    name: "Editar e Excluir Qualquer Anúncio",
    description: "Modificar título, preço, fotos ou apagar anúncios de qualquer membro.",
    category: "Anúncios",
    user: false,
    moderator: false,
    admin: true,
  },

  // Moderação
  {
    id: "mod_view_queue",
    name: "Acessar Fila de Moderação em Tempo Real",
    description: "Visualizar anúncios aguardando análise de conformidade e regras.",
    category: "Moderação",
    user: false,
    moderator: true,
    admin: true,
  },
  {
    id: "mod_approve_reject",
    name: "Aprovar e Rejeitar Anúncios com Motivo",
    description: "Dar parecer sobre produtos/serviços e justificar recusas.",
    category: "Moderação",
    user: false,
    moderator: true,
    admin: true,
  },
  {
    id: "mod_history",
    name: "Visualizar Histórico de Moderações",
    description: "Consultar quem aprovou/recusou e quando foi tomada a decisão.",
    category: "Moderação",
    user: false,
    moderator: true,
    admin: true,
  },

  // Usuários & Contas
  {
    id: "user_edit_own_profile",
    name: "Editar Próprio Perfil",
    description: "Atualizar seu próprio nome, avatar e dados de contato.",
    category: "Usuários & Contas",
    user: true,
    moderator: true,
    admin: true,
  },
  {
    id: "user_list_all",
    name: "Listar Todos os Membros Cadastrados",
    description: "Ver a base de usuários registrados na plataforma.",
    category: "Usuários & Contas",
    user: false,
    moderator: false,
    admin: true,
  },
  {
    id: "user_create_manual",
    name: "Cadastrar Novos Usuários Manualmente",
    description: "Criar contas com e-mail, senha e cargo predefinido.",
    category: "Usuários & Contas",
    user: false,
    moderator: false,
    admin: true,
  },
  {
    id: "user_edit_any",
    name: "Editar Dados de Qualquer Usuário",
    description: "Modificar nomes, avatares e informações de terceiros.",
    category: "Usuários & Contas",
    user: false,
    moderator: false,
    admin: true,
  },
  {
    id: "user_change_role",
    name: "Alterar Cargos (Promover/Rebaixar)",
    description: "Definir se um usuário é Membro, Moderador ou Administrador.",
    category: "Usuários & Contas",
    user: false,
    moderator: false,
    admin: true,
  },
  {
    id: "user_delete",
    name: "Excluir Contas de Usuários",
    description: "Remover membros e banir contas permanentemente.",
    category: "Usuários & Contas",
    user: false,
    moderator: false,
    admin: true,
  },

  // Painéis & Sistema
  {
    id: "access_user_area",
    name: "Acesso à Área 'Minha Conta'",
    description: "Painel pessoal com anúncios, compras e configurações.",
    category: "Painéis & Sistema",
    user: true,
    moderator: true,
    admin: true,
  },
  {
    id: "access_mod_panel",
    name: "Acesso à Central de Moderação (/moderacao)",
    description: "Painel otimizado para triagem rápida de novos anúncios.",
    category: "Painéis & Sistema",
    user: false,
    moderator: true,
    admin: true,
  },
  {
    id: "access_admin_panel",
    name: "Acesso à Central Administrativa (/admin)",
    description: "Painel supremo com controle de usuários, dados e finanças.",
    category: "Painéis & Sistema",
    user: false,
    moderator: false,
    admin: true,
  },
  {
    id: "metrics_view",
    name: "Visualizar Métricas & Volume Financeiro",
    description: "Acompanhar estatísticas de faturamento, novos membros e taxas.",
    category: "Painéis & Sistema",
    user: false,
    moderator: false,
    admin: true,
  },
];

export function getPermissionsMatrixFeatures(): PermissionFeature[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("shop7_permissions_matrix_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }
  return DEFAULT_PERMISSIONS_MATRIX_FEATURES;
}

export function savePermissionsMatrixFeatures(features: PermissionFeature[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("shop7_permissions_matrix_v1", JSON.stringify(features));
  }
}

export interface RoleInfo {
  role: UserRole;
  title: string;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  summary: string;
  fullDescription: string;
  permissions: string[];
  restrictions: string[];
}

export const ROLE_DETAILS: Record<UserRole, RoleInfo> = {
  user: {
    role: "user",
    title: "Membro Comum",
    badgeLabel: "Membro",
    badgeColor: "text-zinc-300",
    badgeBg: "bg-zinc-800/80",
    badgeBorder: "border-zinc-700/60",
    icon: "User",
    summary: "Usuário padrão para compra e venda de itens e serviços no marketplace.",
    fullDescription: "Pode navegar, comprar, publicar e gerenciar seus próprios anúncios. Todos os anúncios criados ou editados passam por moderação obrigatória.",
    permissions: [
      "Comprar itens e contratar serviços no catálogo",
      "Criar anúncios próprios (submetidos para análise)",
      "Editar e excluir seus próprios anúncios",
      "Editar dados do próprio perfil (nome, avatar)",
      "Acompanhar status de pedidos e vendas",
    ],
    restrictions: [
      "Sem acesso à Central de Moderação (/moderacao)",
      "Sem acesso à Central Administrativa (/admin)",
      "Não pode aprovar ou rejeitar anúncios de outros usuários",
      "Não pode criar anúncios diretamente aprovados sem fila",
      "Não pode visualizar, editar ou excluir contas de outros membros",
      "Não pode alterar cargos ou permissões de nenhum usuário",
    ],
  },
  moderator: {
    role: "moderator",
    title: "Moderador da Comunidade",
    badgeLabel: "Moderador",
    badgeColor: "text-primary",
    badgeBg: "bg-primary/10",
    badgeBorder: "border-primary/30",
    icon: "ShieldCheck",
    summary: "Responsável pela conformidade e triagem de segurança dos anúncios da plataforma.",
    fullDescription: "Possui acesso exclusivo à Central de Moderação para inspecionar, aprovar e recusar anúncios enviados por membros, com justificativas formais.",
    permissions: [
      "Todas as permissões do cargo Membro Comum",
      "Acesso completo à Central de Moderação (/moderacao)",
      "Visualizar a fila de anúncios pendentes em tempo real",
      "Aprovar anúncios com carimbo oficial de moderação",
      "Rejeitar anúncios especificando o motivo da recusa",
      "Consultar histórico recente de decisões de moderação",
    ],
    restrictions: [
      "Sem acesso à Central Administrativa (/admin)",
      "Não pode listar, criar, editar ou excluir usuários da plataforma",
      "Não pode alterar cargos ou promover/rebaixar contas",
      "Não pode alterar anúncios aprovados fora da fila de triagem",
      "Não pode acessar métricas de receita financeira geral da plataforma",
    ],
  },
  admin: {
    role: "admin",
    title: "Administrador Geral",
    badgeLabel: "Administrador",
    badgeColor: "text-purple-400",
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-500/35",
    icon: "Crown",
    summary: "Controle absoluto e irrestrito sobre todos os módulos, dados e usuários do SHOP7.",
    fullDescription: "Superusuário com autoridade total para gerenciar anúncios, usuários, permissões, parâmetros do sistema e métricas de desempenho.",
    permissions: [
      "Acesso irrestrito a todos os painéis (/admin, /moderacao, /minha-conta)",
      "Gestão total de usuários (listar, cadastrar, editar, excluir)",
      "Alterar cargos de qualquer membro (promover a Moderador/Admin)",
      "Gestão total de anúncios (editar qualquer campo, alterar status, excluir)",
      "Publicar anúncios já aprovados diretamente sem passar por fila",
      "Aprovar, rejeitar ou reverter status de qualquer anúncio",
      "Visualizar métricas financeiras completas, relatórios e auditoria",
    ],
    restrictions: [
      "Não pode excluir a própria conta de administrador ativa (proteção de segurança)",
    ],
  },
};

/**
 * Verifica se um cargo possui uma permissão específica
 */
export function hasPermission(
  role: UserRole | undefined | null,
  action: PermissionAction
): boolean {
  if (!role) return false;

  switch (action) {
    // Anúncios
    case "ads:create":
    case "ads:edit_own":
    case "ads:delete_own":
      return true; // Todos os logados podem gerenciar seus próprios anúncios

    case "ads:create_direct_approved":
    case "ads:edit_any":
    case "ads:delete_any":
      return role === "admin";

    case "ads:moderate":
    case "ads:view_pending":
      return role === "moderator" || role === "admin";

    // Usuários
    case "users:list":
    case "users:create":
    case "users:edit":
    case "users:delete":
    case "users:change_role":
      return role === "admin";

    // Acessos aos Painéis
    case "access:user_panel":
      return true;

    case "access:moderation_panel":
      return role === "moderator" || role === "admin";

    case "access:admin_panel":
      return role === "admin";

    // Métricas
    case "metrics:view":
    case "system:audit":
      return role === "admin";

    default:
      return false;
  }
}

/**
 * Validação de acesso a rotas
 */
export function canAccessRoute(
  role: UserRole | undefined | null,
  pathname: string
): { allowed: boolean; redirect?: string; reason?: string } {
  if (!role) {
    return {
      allowed: false,
      redirect: "/auth",
      reason: "Você precisa entrar em uma conta para acessar esta página.",
    };
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return {
        allowed: false,
        redirect: role === "moderator" ? "/moderacao" : "/minha-conta",
        reason: "A Central Administrativa é restrita a Administradores do SHOP7.",
      };
    }
  }

  if (pathname.startsWith("/moderacao")) {
    if (role !== "moderator" && role !== "admin") {
      return {
        allowed: false,
        redirect: "/minha-conta",
        reason: "A Central de Moderação é restrita a Moderadores e Administradores.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Retorna metadados de estilo para exibição de badge de cargo
 */
export function getRoleBadgeInfo(role?: UserRole | null) {
  const currentRole: UserRole = role || "user";
  return ROLE_DETAILS[currentRole] || ROLE_DETAILS.user;
}

/**
 * Valida se um usuário pode executar uma ação sobre outro perfil
 */
export function canPerformUserAction(
  actorRole: UserRole,
  actorId: string,
  targetProfile: Profile,
  action: "edit" | "delete" | "change_role"
): { allowed: boolean; reason?: string } {
  if (actorRole !== "admin") {
    return {
      allowed: false,
      reason: "Apenas Administradores podem gerenciar outros usuários.",
    };
  }

  if (action === "delete") {
    // Não pode excluir a própria conta
    if (actorId === targetProfile.id) {
      return {
        allowed: false,
        reason: "Você não pode excluir sua própria conta de administrador em uso.",
      };
    }

    // Não pode excluir o administrador mestre
    const email = (targetProfile.email || "").toLowerCase().trim();
    if (
      email === "malacarogeriojr@gmail.com" ||
      email === "admin@shop7.com"
    ) {
      return {
        allowed: false,
        reason: "Esta conta é um Administrador Mestre do SHOP7 e não pode ser excluída.",
      };
    }
  }

  return { allowed: true };
}
