import { Template, TemplateMetrics } from "@/types/template";

export const calculateTemplateMetrics = (template: Template): TemplateMetrics => {
  const { sends, responses, calls } = template.metrics;
  const responseRate = sends > 0 ? (responses / sends) * 100 : 0;
  const callRate = responses > 0 ? (calls / responses) * 100 : 0;
  
  // Calcul du score de performance brut
  let performanceScore = 1;
  if (responseRate > 35 && callRate > 15) performanceScore = 5;
  else if (responseRate > 25 || callRate > 12) performanceScore = 4;
  else if (responseRate > 15 || callRate > 8) performanceScore = 3;
  else if (responseRate > 10 || callRate > 5) performanceScore = 2;

  // Pondération par le volume (facteur de confiance statistique)
  let volumeMultiplier = 1.0;
  if (sends < 10) volumeMultiplier = 0.4;        // -60% de fiabilité
  else if (sends < 30) volumeMultiplier = 0.7;   // -30% de fiabilité
  else if (sends < 100) volumeMultiplier = 0.9;  // -10% de fiabilité
  else volumeMultiplier = 1.0;                    // Pleine confiance
  
  // Rating final = performance × volume
  const finalRating = Math.max(1, Math.round(performanceScore * volumeMultiplier));

  return {
    sends,
    responses,
    calls,
    responseRate: Math.round(responseRate * 10) / 10,
    callRate: Math.round(callRate * 10) / 10,
    rating: finalRating,
  };
};

export const updateTemplateMetrics = (template: Template): Template => {
  return {
    ...template,
    metrics: calculateTemplateMetrics(template),
    updatedAt: new Date().toISOString(),
  };
};

export const replaceVariables = (
  content: string,
  variables: { prenom?: string; nom?: string; entreprise?: string; poste?: string }
): string => {
  let result = content;
  if (variables.prenom) result = result.replace(/\{prenom\}/g, variables.prenom);
  if (variables.nom) result = result.replace(/\{nom\}/g, variables.nom);
  if (variables.entreprise) result = result.replace(/\{entreprise\}/g, variables.entreprise);
  if (variables.poste) result = result.replace(/\{poste\}/g, variables.poste);
  return result;
};

export const getTemplatePreview = (content: string, maxLines: number = 2): string => {
  const lines = content.split("\n").filter((line) => line.trim());
  return lines.slice(0, maxLines).join("\n") + (lines.length > maxLines ? "..." : "");
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    premier_contact: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    relance_1: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_2: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_3: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_4: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_5: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_6: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_7: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_8: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_9: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    relance_10: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    reponse_tiede: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    accelerateur: "bg-red-500/10 text-red-400 border-red-500/20",
    bombe_valeur: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    closing_rdv: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    reactivation: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };
  return colors[category] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
};

export const getStatisticalConfidence = (sends: number): { label: string; color: string; variant: "default" | "secondary" | "outline" | "destructive" } => {
  if (sends >= 100) return { label: "✅ Fiable", color: "bg-green-500/10 text-green-400 border-green-500/20", variant: "default" };
  if (sends >= 30) return { label: "🟡 À confirmer", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", variant: "secondary" };
  if (sends >= 10) return { label: "🟠 Test en cours", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", variant: "outline" };
  return { label: "⚠️ Données insuffisantes", color: "bg-red-500/10 text-red-400 border-red-500/20", variant: "destructive" };
};
