import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuditButtonProps {
  prospectId: string;
  prospectName: string;
  company: string;
  websiteUrl?: string;
  auditStatus?: string | null;
  onAuditGenerated?: () => void;
}

const AuditButton = ({ prospectId, prospectName, company, websiteUrl, auditStatus, onAuditGenerated }: AuditButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // No website URL = no audit button
  if (!websiteUrl) return null;

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_reports")
        .select("html_content, generated_at")
        .eq("prospect_id", prospectId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error("Audit introuvable");
        return;
      }

      // Download as HTML file
      const blob = new Blob([data.html_content], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Audit-SEO-GEO-${company.replace(/\s+/g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Audit téléchargé !");
    } catch (e) {
      console.error("Download error:", e);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handlePreview = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_reports")
        .select("html_content")
        .eq("prospect_id", prospectId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error("Audit introuvable");
        return;
      }

      setPreviewHtml(data.html_content);
      setPreviewOpen(true);
    } catch (e) {
      console.error("Preview error:", e);
      toast.error("Erreur lors de la prévisualisation");
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("generate-audit", {
        body: {
          prospect_id: prospectId,
          website_url: websiteUrl,
          prenom: prospectName.split(" ")[0],
          company,
        },
      });

      if (error) {
        toast.error("Erreur lors de la régénération");
        console.error("Regenerate error:", error);
      } else {
        toast.success("Audit régénéré !");
        onAuditGenerated?.();
      }
    } catch (e) {
      console.error("Regenerate error:", e);
      toast.error("Erreur lors de la régénération");
    } finally {
      setLoading(false);
    }
  };

  // Generating state
  if (auditStatus === "pending" || auditStatus === "generating") {
    return (
      <Button size="sm" variant="outline" disabled className="text-xs gap-1 border-orange-500/50 text-orange-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Audit en cours...
      </Button>
    );
  }

  // Error state
  if (auditStatus === "error") {
    return (
      <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={loading} className="text-xs gap-1 border-red-500/50 text-red-400 hover:text-red-300">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
        Relancer l'audit
      </Button>
    );
  }

  // Ready state - audit available
  if (auditStatus === "ready") {
    return (
      <>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={handlePreview} className="text-xs gap-1 border-emerald-500/50 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
            <FileText className="h-3 w-3" />
            Voir l'audit
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs gap-1 border-primary/50 text-primary hover:text-primary/80 hover:bg-primary/10">
            <Download className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRegenerate} disabled={loading} className="text-xs gap-1 text-muted-foreground hover:text-foreground px-2">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>

        {/* Audit Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Audit SEO & IA — {company}</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              <iframe
                srcDoc={previewHtml}
                title={`Audit ${company}`}
                className="w-full border rounded-lg"
                style={{ height: "75vh" }}
                sandbox="allow-same-origin"
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default: no audit yet but has URL — show generate button
  return (
    <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={loading} className="text-xs gap-1 border-primary/50 text-primary hover:text-primary/80 hover:bg-primary/10">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
      Générer l'audit
    </Button>
  );
};

export default AuditButton;
