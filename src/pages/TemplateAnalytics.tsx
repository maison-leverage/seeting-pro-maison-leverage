import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Template, TemplateSequence } from "@/types/template";
import { Prospect } from "@/types/prospect";
import { BarChart2, Target, TrendingUp } from "lucide-react";

const TemplateAnalytics = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = () => {
    const storedTemplates = localStorage.getItem("crm_templates");
    const storedProspects = localStorage.getItem("crm_prospects");
    
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }
    if (storedProspects) {
      setProspects(JSON.parse(storedProspects));
    }
  };

  // Performance par séquence
  const sequencePerformance = Array.from({ length: 10 }, (_, i) => {
    const sequence = (i + 1) as TemplateSequence;
    const templatesInSequence = templates.filter((t) => t.sequence === sequence);
    
    const totalSends = templatesInSequence.reduce((sum, t) => sum + t.metrics.sends, 0);
    const totalResponses = templatesInSequence.reduce((sum, t) => sum + t.metrics.responses, 0);
    const totalCalls = templatesInSequence.reduce((sum, t) => sum + t.metrics.calls, 0);
    
    return {
      sequence,
      sends: totalSends,
      responseRate: totalSends > 0 ? (totalResponses / totalSends) * 100 : 0,
      callRate: totalSends > 0 ? (totalCalls / totalSends) * 100 : 0,
      responses: totalResponses,
      calls: totalCalls,
    };
  }).filter((s) => s.sends > 0);

  // Attribution des R1 par message
  const r1Attribution = prospects
    .filter((p) => p.status === "r1_programme" && p.templateUsage && p.templateUsage.length > 0)
    .map((p) => {
      const lastTemplate = p.templateUsage[p.templateUsage.length - 1];
      const template = templates.find((t) => t.id === lastTemplate.templateId);
      return {
        prospectName: p.fullName,
        sequence: template?.sequence || 0,
        templateName: template?.name || "Template supprimé",
        date: lastTemplate.sentAt,
      };
    });

  const r1BySequence = Array.from({ length: 10 }, (_, i) => {
    const sequence = (i + 1) as TemplateSequence;
    return {
      sequence,
      count: r1Attribution.filter((r) => r.sequence === sequence).length,
    };
  }).filter((s) => s.count > 0);

  // Stats globales
  const totalSends = templates.reduce((sum, t) => sum + t.metrics.sends, 0);
  const totalResponses = templates.reduce((sum, t) => sum + t.metrics.responses, 0);
  const totalCalls = templates.reduce((sum, t) => sum + t.metrics.calls, 0);
  const avgResponseRate = totalSends > 0 ? (totalResponses / totalSends) * 100 : 0;
  const avgCallRate = totalSends > 0 ? (totalCalls / totalSends) * 100 : 0;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Analytics des Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Performance détaillée par séquence de messages
            </p>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-2">Envois totaux</div>
              <div className="text-4xl font-bold text-purple-400">{totalSends}</div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-2">Réponses totales</div>
              <div className="text-4xl font-bold text-blue-400">{totalResponses}</div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-2">Taux réponse moyen</div>
              <div className="text-4xl font-bold text-blue-400">{avgResponseRate.toFixed(1)}%</div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-2">Taux call moyen</div>
              <div className="text-4xl font-bold text-green-400">{avgCallRate.toFixed(1)}%</div>
            </Card>
          </div>

          {/* Performance par séquence */}
          {sequencePerformance.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-500" />
                Performance par séquence
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Analyse des performances par numéro de message
              </p>
              <div className="space-y-3">
                {sequencePerformance.map((seq) => (
                  <div
                    key={seq.sequence}
                    className="flex items-center gap-4 p-3 border rounded bg-card/30"
                  >
                    <div className="flex-shrink-0 w-24">
                      <Badge variant="outline" className="text-sm">
                        Message {seq.sequence}
                      </Badge>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Envois</div>
                        <div className="font-semibold">{seq.sends}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Réponses</div>
                        <div className="font-semibold">{seq.responses}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Taux réponse</div>
                        <div className="font-semibold text-blue-400">
                          {seq.responseRate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Taux call</div>
                        <div className="font-semibold text-green-400">
                          {seq.callRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Attribution R1 par message */}
          {r1BySequence.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Attribution des R1 par message
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Quel message a généré les R1 ?
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {r1BySequence.map((seq) => {
                  const percentage = r1Attribution.length > 0
                    ? ((seq.count / r1Attribution.length) * 100).toFixed(0)
                    : 0;
                  return (
                    <Card key={seq.sequence} className="p-4 bg-background/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Message {seq.sequence}
                      </div>
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {seq.count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}% des R1
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Détail des R1 */}
          {r1Attribution.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Détail des R1 générés
              </h2>
              <div className="space-y-2">
                {r1Attribution.map((r1, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded bg-card/30 text-sm">
                    <Badge variant="outline">Message {r1.sequence}</Badge>
                    <div className="flex-1">
                      <div className="font-semibold">{r1.prospectName}</div>
                      <div className="text-xs text-muted-foreground">{r1.templateName}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r1.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {sequencePerformance.length === 0 && r1BySequence.length === 0 && (
            <Card className="p-12 text-center border-border/50 bg-card/50">
              <p className="text-muted-foreground">
                Aucune donnée disponible. Commence à envoyer des messages pour voir les analytics !
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateAnalytics;
