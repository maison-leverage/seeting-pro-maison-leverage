export type TemplateSequence = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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
  sequence: TemplateSequence;
  content: string;
  targetProfile: TemplateTargetProfile;
  metrics: TemplateMetrics;
  tags: string[];
  notes: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  usageHistory: TemplateUsage[];
}

export const TEMPLATE_SEQUENCES: { value: TemplateSequence; label: string }[] = [
  { value: 1, label: "1er message" },
  { value: 2, label: "2e relance" },
  { value: 3, label: "3e relance" },
  { value: 4, label: "4e relance" },
  { value: 5, label: "5e relance" },
  { value: 6, label: "6e relance" },
  { value: 7, label: "7e relance" },
  { value: 8, label: "8e relance" },
  { value: 9, label: "9e relance" },
  { value: 10, label: "10e relance" },
];

export const TARGET_TYPES = ["CEO/Fondateur", "Manager", "Opérationnel"];
export const TARGET_SECTORS = ["Tech", "Immobilier", "Conseil", "E-commerce", "Autre"];
export const TARGET_SIZES = ["TPE (1-10)", "PME (10-50)", "ETI (50-250)", "Grand compte (250+)"];
