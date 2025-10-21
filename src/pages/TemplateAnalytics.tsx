import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateSequence } from "@/types/template";
import { BarChart2, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTemplates } from "@/hooks/useTemplates";
import { useProspects } from "@/hooks/useProspects";

const TemplateAnalytics = () => {
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

  const sequencePerformance = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
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
              Analytics Templates
            </h1>
            <p className="text-muted-foreground mt-1">Performance détaillée par séquence</p>
          </div>

          {sequencePerformance.length > 0 ? (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-500" />
                Performance par séquence
              </h2>
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
          ) : (
            <Card className="p-12 text-center border-border/50">
              <p className="text-muted-foreground">
                Aucune donnée disponible. Commencez par envoyer des messages !
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateAnalytics;
