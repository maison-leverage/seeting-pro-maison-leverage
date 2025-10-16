export type ProspectStatus =
  | "nouveau"
  | "contacte"
  | "discussion"
  | "qualifie"
  | "gagne"
  | "perdu";

export type ProspectPriority = "urgent" | "haute" | "moyenne" | "faible";

export type ProspectQualification =
  | "qualifie"
  | "non_qualifie"
  | "a_evaluer"
  | "opportunites";

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
  tags: ProspectTag[];
  notes: ProspectNote[];
  history: ProspectHistory[];
  reminderDate?: string;
  assignedTo: string; // user id
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  score: number; // calculated score
  followUpCount: number; // nombre de relances
}
