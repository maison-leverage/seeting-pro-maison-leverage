import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AUDIT_API_URL = "https://maison-leverage-audit-production.up.railway.app";

export const generateAudit = async (prospectId: string, prospect: {
  website_url: string;
  company_name: string;
  first_name: string;
}): Promise<string | null> => {
  // 1. Mark status as "generating"
  await supabase
    .from("prospects")
    .update({ audit_status: "generating" } as any)
    .eq("id", prospectId);

  try {
    // 2. Call the Railway audit API
    const response = await fetch(`${AUDIT_API_URL}/generate-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: prospect.website_url,
        company: prospect.company_name,
        contact: prospect.first_name,
      }),
    });

    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

    const data = await response.json();

    // 3. Build full PDF URL
    const pdfUrl = `${AUDIT_API_URL}${data.pdf_url}`;

    // 4. Save to Supabase
    await supabase
      .from("prospects")
      .update({
        audit_generated: true,
        audit_score: data.global_score,
        audit_sector: data.sector,
        audit_generated_at: data.generated_at,
        audit_pdf_url: pdfUrl,
        audit_status: "done",
      } as any)
      .eq("id", prospectId);

    toast.success(`Audit généré pour ${prospect.company_name} — Score : ${data.global_score}/100`);

    return pdfUrl;
  } catch (error) {
    console.error("Erreur génération audit:", error);

    await supabase
      .from("prospects")
      .update({ audit_status: "error" } as any)
      .eq("id", prospectId);

    toast.error(`Erreur lors de la génération de l'audit pour ${prospect.company_name}`);
    return null;
  }
};
