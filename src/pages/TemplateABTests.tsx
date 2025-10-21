import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Template } from "@/types/template";
import { getTemplateRecommendation, getStatisticalConfidence } from "@/utils/templateUtils";
import { TestTube, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const TemplateABTests = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);

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
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }
  };

  // Grouper les templates par statut
  const champions = templates.filter(t => {
    const rec = getTemplateRecommendation(t);
    return rec.status === "champion";
  });

  const testing = templates.filter(t => {
    const rec = getTemplateRecommendation(t);
    return rec.status === "testing";
  });

  const needsImprovement = templates.filter(t => {
    const rec = getTemplateRecommendation(t);
    return rec.status === "needs_improvement";
  });

  const insufficientData = templates.filter(t => {
    const rec = getTemplateRecommendation(t);
    return rec.status === "insufficient_data";
  });

  const renderTemplateList = (templateList: Template[], title: string, icon: React.ReactNode, emptyMessage: string) => (
    <Card className="p-6 border-border/50 bg-card/50">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="outline" className="ml-auto">
          {templateList.length}
        </Badge>
      </div>

      {templateList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {templateList.map(template => {
            const rec = getTemplateRecommendation(template);
            const confidence = getStatisticalConfidence(template.metrics.sends);
            
            return (
              <Card key={template.id} className="p-4 bg-background/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">Message {template.sequence}</p>
                  </div>
                  <Badge className={rec.color}>{rec.message}</Badge>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Envois</div>
                    <div className="font-semibold">{template.metrics.sends}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Taux réponse</div>
                    <div className="font-semibold text-blue-400">
                      {template.metrics.responseRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Taux call</div>
                    <div className="font-semibold text-green-400">
                      {template.metrics.callRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <Badge variant={confidence.variant} className={confidence.color}>
                      {confidence.label}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              A/B Tests & Recommandations
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyse automatique de la performance de tes templates
            </p>
          </div>

          {/* Vue d'ensemble */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-border/50 bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="text-sm text-muted-foreground">Champions</div>
              </div>
              <div className="text-3xl font-bold text-green-400">{champions.length}</div>
            </Card>

            <Card className="p-4 border-border/50 bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="h-5 w-5 text-blue-500" />
                <div className="text-sm text-muted-foreground">En test</div>
              </div>
              <div className="text-3xl font-bold text-blue-400">{testing.length}</div>
            </Card>

            <Card className="p-4 border-border/50 bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div className="text-sm text-muted-foreground">À améliorer</div>
              </div>
              <div className="text-3xl font-bold text-orange-400">{needsImprovement.length}</div>
            </Card>

            <Card className="p-4 border-border/50 bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <div className="text-sm text-muted-foreground">Données insuffisantes</div>
              </div>
              <div className="text-3xl font-bold text-gray-400">{insufficientData.length}</div>
            </Card>
          </div>

          {/* Champions */}
          {renderTemplateList(
            champions,
            "✨ Templates Champions",
            <CheckCircle className="h-6 w-6 text-green-500" />,
            "Aucun template champion pour le moment. Continue d'envoyer pour identifier les meilleurs !"
          )}

          {/* En test */}
          {renderTemplateList(
            testing,
            "🧪 Templates en phase de test",
            <TestTube className="h-6 w-6 text-blue-500" />,
            "Aucun template en phase de test"
          )}

          {/* À améliorer */}
          {renderTemplateList(
            needsImprovement,
            "⚠️ Templates à améliorer ou supprimer",
            <AlertTriangle className="h-6 w-6 text-orange-500" />,
            "Aucun template sous-performant"
          )}

          {/* Données insuffisantes */}
          {renderTemplateList(
            insufficientData,
            "📊 Templates avec données insuffisantes",
            <TrendingUp className="h-6 w-6 text-gray-500" />,
            "Tous tes templates ont assez de données pour être analysés"
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateABTests;
