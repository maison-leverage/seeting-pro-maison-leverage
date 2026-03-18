import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Download, Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { generateAudit } from "@/utils/auditUtils";
import { supabase } from "@/integrations/supabase/client";

interface AuditButtonProps {
  prospectId: string;
  prospectName: string;
  company: string;
  websiteUrl?: string;
  auditStatus?: string | null;
  auditScore?: number | null;
  auditPdfUrl?: string | null;
  onAuditGenerated?: () => void;
}

const AuditButton = ({ prospectId, prospectName, company, websiteUrl, auditStatus, auditScore, auditPdfUrl, onAuditGenerated }: AuditButtonProps) => {
  const [loading, setLoading] = useState(false);

  if (!websiteUrl) return null;

  const handleGenerate = async () => {
    setLoading(true);
    const pdfUrl = await generateAudit(prospectId, {
      website_url: websiteUrl,
      company_name: company,
      first_name: prospectName.split(" ")[0],
    });
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
      onAuditGenerated?.();
    }
    setLoading(false);
  };

  const handleViewPdf = () => {
    if (auditPdfUrl) {
      window.open(auditPdfUrl, "_blank");
    }
  };

  // Generating state
  if (auditStatus === "generating") {
    return (
      <Button size="sm" variant="outline" disabled className="text-xs gap-1 border-blue-500/50 text-blue-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Audit en cours...
      </Button>
    );
  }

  // Error state
  if (auditStatus === "error") {
    return (
      <Button size="sm" onClick={handleGenerate} disabled={loading} className="text-xs gap-1 bg-[#111111] hover:bg-[#333333] text-white">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
        {loading ? "Génération en cours..." : "⚠ Réessayer l'audit"}
      </Button>
    );
  }

  // Done state - audit available
  if (auditStatus === "done" && auditPdfUrl) {
    return (
      <div className="flex gap-1 items-center">
        <Button size="sm" onClick={handleViewPdf} className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white">
          <ExternalLink className="h-3 w-3" />
          ✓ Voir l'audit {auditScore ? `(${auditScore}/100)` : ""}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={loading} className="text-xs gap-1 text-muted-foreground hover:text-foreground px-2">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  // Default: no audit yet — show generate button
  return (
    <Button size="sm" onClick={handleGenerate} disabled={loading} className="text-xs gap-1 bg-[#111111] hover:bg-[#333333] text-white">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
      {loading ? "Génération en cours..." : "Générer l'audit"}
    </Button>
  );
};

export default AuditButton;
