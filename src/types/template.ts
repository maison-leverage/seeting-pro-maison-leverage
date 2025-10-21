export type TemplateCategory =
  | "premier_contact"
  | "relance_1"
  | "relance_2"
  | "relance_3"
  | "relance_4"
  | "relance_5"
  | "relance_6"
  | "relance_7"
  | "relance_8"
  | "relance_9"
  | "relance_10"
  | "reponse_tiede"
  | "accelerateur"
  | "bombe_valeur"
  | "closing_rdv"
  | "reactivation";

export type TemplateStatus = "actif" | "en_test" | "archive";

export interface TemplateTargetProfile {
  types: string[]; // CEO/Fondateur, Manager, Opérationnel
  sectors: string[]; // Tech, Immobilier, Conseil, E-commerce, Autre
  sizes: string[]; // TPE (1-10), PME (10-50), ETI (50-250), Grand compte (250+)
}

export interface TemplateMetrics {
  sends: number;
  responses: number;
  calls: number;
  responseRate: number; // calculated
  callRate: number; // calculated
  rating: number; // 1-5 stars
}

export interface TemplateUsage {
  id: string;
  date: string;
  prospectId: string;
  prospectName: string;
  userId: string;
  userName: string;
  hasResponse: boolean;
  hasCall: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  status: TemplateStatus;
  targetProfile: TemplateTargetProfile;
  metrics: TemplateMetrics;
  tags: string[];
  notes: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  usageHistory: TemplateUsage[];
  isAbTestWinner?: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  templateAId: string;
  templateBId: string;
  targetProfile: TemplateTargetProfile;
  targetSends: number;
  primaryMetric: "response" | "call" | "both";
  duration: number; // days
  status: "en_cours" | "termine" | "annule";
  startDate: string;
  endDate?: string;
  currentDay: number;
  createdAt: string;
  results?: {
    winnerId: string;
    responseDiff: number;
    callDiff: number;
  };
}

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; emoji: string }[] = [
  { value: "premier_contact", label: "Premier contact", emoji: "🚀" },
  { value: "relance_1", label: "Relance 1", emoji: "🔄" },
  { value: "relance_2", label: "Relance 2", emoji: "🔄" },
  { value: "relance_3", label: "Relance 3", emoji: "🔄" },
  { value: "relance_4", label: "Relance 4", emoji: "🔄" },
  { value: "relance_5", label: "Relance 5", emoji: "🔄" },
  { value: "relance_6", label: "Relance 6", emoji: "🔄" },
  { value: "relance_7", label: "Relance 7", emoji: "🔄" },
  { value: "relance_8", label: "Relance 8", emoji: "🔄" },
  { value: "relance_9", label: "Relance 9", emoji: "🔄" },
  { value: "relance_10", label: "Relance 10", emoji: "🔄" },
  { value: "reponse_tiede", label: "Réponse tiède", emoji: "💬" },
  { value: "accelerateur", label: "Accélérateur", emoji: "🔥" },
  { value: "bombe_valeur", label: "Bombe de valeur", emoji: "💎" },
  { value: "closing_rdv", label: "Closing RDV", emoji: "📅" },
  { value: "reactivation", label: "Réactivation", emoji: "❄️" },
];

export const TARGET_TYPES = ["CEO/Fondateur", "Manager", "Opérationnel"];
export const TARGET_SECTORS = ["Tech", "Immobilier", "Conseil", "E-commerce", "Autre"];
export const TARGET_SIZES = ["TPE (1-10)", "PME (10-50)", "ETI (50-250)", "Grand compte (250+)"];
