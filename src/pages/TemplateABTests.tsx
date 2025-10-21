import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTemplateRecommendation, getStatisticalConfidence } from "@/utils/templateUtils";
import { TestTube, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTemplates } from "@/hooks/useTemplates";
import { useProspects } from "@/hooks/useProspects";

const TemplateABTests = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { templates, isLoading: templatesLoading } = useTemplates();
  const { prospects, isLoading: prospectsLoading } = useProspects();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prospects.filter((p) => {
      if (!p.reminderDate) return false;
      const reminder = new Date(p.reminderDate);
      reminder.setHours(0, 0, 0, 0);
      return reminder <= today;
    }).length;
  }, [prospects]);

  const { champions, testing, needsImprovement, insufficientData } = useMemo(() => {
    return {
      champions: templates.filter(t => getTemplateRecommendation(t).status === "champion"),
      testing: templates.filter(t => getTemplateRecommendation(t).status === "testing"),
      needsImprovement: templates.filter(t => getTemplateRecommendation(t).status === "needs_improvement"),
      insufficientData: templates.filter(t => getTemplateRecommendation(t).status === "insufficient_data"),
    };
  }, [templates]);

  if (authLoading || templatesLoading || prospectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header notificationCount={todayCount} />
        <main className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              A/B Tests Templates
            </h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble des tests et recommandations</p>
          </div>

          {/* Champions */}
          {champions.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Champions ({champions.length})
              </h2>
              <div className="grid gap-4">
                {champions.map((t) => {
                  const rec = getTemplateRecommendation(t);
                  return (
                    <div key={t.id} className="p-4 border rounded bg-card/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{t.name}</h3>
                          <p className="text-sm text-muted-foreground">{rec.message}</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          {t.metrics.callRate.toFixed(1)}% call rate
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Testing */}
          {testing.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-500" />
                En test ({testing.length})
              </h2>
              <div className="grid gap-4">
                {testing.map((t) => {
                  const rec = getTemplateRecommendation(t);
                  return (
                    <div key={t.id} className="p-4 border rounded bg-card/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{t.name}</h3>
                          <p className="text-sm text-muted-foreground">{rec.message}</p>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {t.metrics.sends} envois
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Needs Improvement */}
          {needsImprovement.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                À améliorer ({needsImprovement.length})
              </h2>
              <div className="grid gap-4">
                {needsImprovement.map((t) => {
                  const rec = getTemplateRecommendation(t);
                  return (
                    <div key={t.id} className="p-4 border rounded bg-card/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{t.name}</h3>
                          <p className="text-sm text-muted-foreground">{rec.message}</p>
                        </div>
                        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                          {t.metrics.callRate.toFixed(1)}% call rate
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Insufficient Data */}
          {insufficientData.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                Données insuffisantes ({insufficientData.length})
              </h2>
              <div className="grid gap-4">
                {insufficientData.map((t) => {
                  const rec = getTemplateRecommendation(t);
                  return (
                    <div key={t.id} className="p-4 border rounded bg-card/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{t.name}</h3>
                          <p className="text-sm text-muted-foreground">{rec.message}</p>
                        </div>
                        <Badge variant="outline">
                          {t.metrics.sends} envois
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {templates.length === 0 && (
            <Card className="p-12 text-center border-border/50">
              <p className="text-muted-foreground">
                Aucun template créé. Commencez par en créer un !
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateABTests;
