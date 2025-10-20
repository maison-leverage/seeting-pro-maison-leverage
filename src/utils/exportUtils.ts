import { Prospect } from "@/types/prospect";
import { Template } from "@/types/template";

export const exportProspectsToCSV = (prospects: Prospect[]) => {
  const headers = [
    "Nom complet",
    "Entreprise",
    "Poste",
    "LinkedIn",
    "Statut",
    "Priorité",
    "Qualification",
    "Hype",
    "Date de rappel",
    "Date création",
  ];
  
  const rows = prospects.map((p) => [
    p.fullName,
    p.company,
    p.position,
    p.linkedinUrl,
    p.status,
    p.priority,
    p.qualification,
    p.hype,
    p.reminderDate || "",
    new Date(p.createdAt).toLocaleDateString("fr-FR"),
  ]);
  
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `prospects_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};

export const exportTemplatesToCSV = (templates: Template[]) => {
  const headers = [
    "Nom",
    "Séquence",
    "Contenu",
    "Envois",
    "Réponses",
    "Calls",
    "Taux réponse (%)",
    "Taux call (%)",
    "Rating",
  ];
  
  const rows = templates.map((t) => [
    t.name,
    `Message ${t.sequence}`,
    t.content.replace(/\n/g, " ").replace(/"/g, '""'),
    t.metrics.sends,
    t.metrics.responses,
    t.metrics.calls,
    t.metrics.responseRate.toFixed(1),
    t.metrics.callRate.toFixed(1),
    t.metrics.rating,
  ]);
  
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `templates_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};
