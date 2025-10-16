import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { Template, TEMPLATE_CATEGORIES } from "@/types/template";

const TemplateAnalytics = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }
    loadTemplates();
  }, [navigate]);

  const loadTemplates = () => {
    const stored = localStorage.getItem("crm_templates");
    if (stored) {
      setTemplates(JSON.parse(stored));
    }
  };

  const activeTemplates = templates.filter((t) => t.status === "actif");
  const avgResponseRate =
    activeTemplates.length > 0
      ? activeTemplates.reduce((sum, t) => sum + t.metrics.responseRate, 0) / activeTemplates.length
      : 0;
  const avgCallRate =
    activeTemplates.length > 0
      ? activeTemplates.reduce((sum, t) => sum + t.metrics.callRate, 0) / activeTemplates.length
      : 0;

  const topPerformers = [...templates]
    .sort((a, b) => {
      const scoreA = a.metrics.responseRate + a.metrics.callRate;
      const scoreB = b.metrics.responseRate + b.metrics.callRate;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  const needsOptimization = templates.filter((t) => t.metrics.responseRate < 15 && t.metrics.sends > 10);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/templates")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Analytics Templates
              </h1>
              <p className="text-muted-foreground mt-1">Performances globales de vos templates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Templates totaux</div>
              <div className="text-3xl font-bold">{templates.length}</div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Templates actifs</div>
              <div className="text-3xl font-bold text-green-400">{activeTemplates.length}</div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Taux réponse moyen</div>
              <div className="text-3xl font-bold text-blue-400">{avgResponseRate.toFixed(1)}%</div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Taux call moyen</div>
              <div className="text-3xl font-bold text-purple-400">{avgCallRate.toFixed(1)}%</div>
            </Card>
          </div>

          <Card className="p-6 border-border/50 bg-card/50">
            <h2 className="text-xl font-semibold mb-6">🏆 Top 3 Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((template, index) => {
                const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.value === template.category);
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <Card key={template.id} className="p-6 bg-background/50 text-center">
                    <div className="text-4xl mb-2">{medals[index]}</div>
                    <div className="font-semibold mb-1">{template.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {categoryInfo?.emoji} {categoryInfo?.label}
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{template.metrics.responseRate}%</div>
                    <div className="text-xs text-muted-foreground">réponse</div>
                    <div className="text-2xl font-bold text-green-400 mt-2">{template.metrics.callRate}%</div>
                    <div className="text-xs text-muted-foreground">call</div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {needsOptimization.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4">⚠️ Templates à optimiser</h2>
              <p className="text-muted-foreground mb-4">
                Ces templates ont un taux de réponse inférieur à 15%
              </p>
              <div className="space-y-2">
                {needsOptimization.map((template) => {
                  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.value === template.category);
                  return (
                    <Card key={template.id} className="p-4 bg-background/30 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {categoryInfo?.emoji} {categoryInfo?.label} • {template.metrics.sends} envois
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-400">{template.metrics.responseRate}%</div>
                        <div className="text-xs text-muted-foreground">Créer une variation en A/B test</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {templates.length === 0 && (
            <Card className="p-12 text-center border-border/50 bg-card/50">
              <p className="text-muted-foreground">
                Aucune donnée disponible. Créez vos premiers templates pour voir les analytics.
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateAnalytics;
