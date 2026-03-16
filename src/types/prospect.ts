/** Pipeline stages for LinkedIn CRM prospects */
export type ProspectStatus =
  | "nouveau"
  | "premier_dm"
  | "relance"
  | "reponse"
  | "discussion"
  | "demande_dispos"
  | "r1_booke"
  | "r1_fait"
  | "r2_booke"
  | "signe"
  | "perdu";

export type ProspectSource =
  | "inbound"
  | "visiteur_profil"
  | "relation_dormante"
  | "outbound";

export type ProspectQualification =
  | "rien"
  | "loom"
  | "video_youtube"
  | "presentation_genspark"
  | "magnus_opus";

export type ProspectHype = "rien" | "froid" | "tiede" | "chaud";

export interface ProspectTag { id: string; label: string; color: string; }
export interface ProspectNote { id: string; content: string; createdAt: string; createdBy: string; }
export interface ProspectHistory { id: string; action: string; details: string; createdAt: string; createdBy: string; }

export interface Prospect {
  id: string;
  fullName: string;
  company: string;
  position: string;
  linkedinUrl: string;
  status: ProspectStatus;
  source: ProspectSource;
  qualification: ProspectQualification;
  hype: ProspectHype;
  tags: ProspectTag[];
  notes: ProspectNote[];
  history: ProspectHistory[];
  reminderDate?: string;
  firstMessageDate?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  followUpCount: number;
  email?: string;
  r1_date?: string;
  r2_date?: string;
  lost_reason?: string;
  proposed_slots?: string;
  no_show?: boolean;
  proposal_sent?: boolean;
  r2_scheduled?: boolean;
  no_follow_up?: boolean;
  websiteUrl?: string;
  audit_status?: string | null;
}
