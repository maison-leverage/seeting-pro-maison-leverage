export type ProspectStatus =
  | "rien"
  | "premier_message"
  | "discussion"
  | "r1_programme";

export type ProspectPriority = "rien" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

export type ProspectQualification =
  | "rien"
  | "loom"
  | "video_youtube"
  | "presentation_genspark"
  | "magnus_opus";

export type ProspectHype = "rien" | "froid" | "tiede" | "chaud";

export interface ProspectTag {
  id: string;
  label: string;
  color: string;
}

export interface ProspectNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface ProspectHistory {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  createdBy: string;
}

export interface Prospect {
  id: string;
  fullName: string;
  company: string;
  position: string;
  linkedinUrl: string;
  status: ProspectStatus;
  priority: ProspectPriority;
  qualification: ProspectQualification;
  hype: ProspectHype;
  tags: ProspectTag[];
  notes: ProspectNote[];
  history: ProspectHistory[];
  reminderDate?: string;
  firstMessageDate?: string; // Date de prise de contact
  assignedTo: string; // user id
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  followUpCount: number; // nombre de relances
  no_show?: boolean; // Si la personne a fait un no show au R1
  proposal_sent?: boolean; // Si une proposition a été envoyée
  r2_scheduled?: boolean; // Si un R2 a été programmé
  no_follow_up?: boolean; // Si le prospect n'a pas de suite
}
