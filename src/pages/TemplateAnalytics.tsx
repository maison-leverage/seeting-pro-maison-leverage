import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Phone, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TemplateWithR1 {
  id: string;
  name: string;
  r1Count: number;
  totalMessages: number;
  conversionRate: number;
}

const TemplateAnalytics = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateWithR1[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadAnalytics();
    });
  }, [navigate]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    // Récupérer tous les templates
    const { data: templatesData } = await supabase
      .from('templates')
      .select('id, name');

    // Récupérer tous les prospects avec R1 programmé
    const { data: r1Prospects } = await supabase
      .from('prospects')
      .select('id')
      .eq('status', 'r1_programme');

    if (!templatesData || !r1Prospects) {
      setLoading(false);
      return;
    }

    const r1ProspectIds = r1Prospects.map(p => p.id);

    // Récupérer tous les messages
    const { data: allMessages } = await supabase
      .from('prospect_messages')
      .select('prospect_id, template_id');

    if (!allMessages) {
      setLoading(false);
      return;
    }

    // Calculer les stats par template
    const templateStats = templatesData.map(template => {
      // Messages envoyés avec ce template
      const messagesWithTemplate = allMessages.filter(m => m.template_id === template.id);
      const totalMessages = messagesWithTemplate.length;

      // Prospects uniques qui ont reçu ce template
      const uniqueProspects = new Set(messagesWithTemplate.map(m => m.prospect_id));
      
      // Prospects avec ce template qui ont obtenu un R1
      const r1WithTemplate = messagesWithTemplate.filter(m => 
        r1ProspectIds.includes(m.prospect_id)
      );
      
      // Compter les prospects uniques avec R1
      const uniqueR1Prospects = new Set(r1WithTemplate.map(m => m.prospect_id));
      const r1Count = uniqueR1Prospects.size;

      // Taux de conversion = (prospects uniques avec R1 / prospects uniques contactés) * 100
      const conversionRate = uniqueProspects.size > 0 
        ? (r1Count / uniqueProspects.size) * 100 
        : 0;

      return {
        id: template.id,
        name: template.name,
        r1Count,
        totalMessages,
        conversionRate
      };
    });

    // Trier par nombre de R1 générés
    const sortedTemplates = templateStats
      .filter(t => t.totalMessages > 0)
      .sort((a, b) => b.r1Count - a.r1Count);

    setTemplates(sortedTemplates);
    setLoading(false);
  };

  // Top 3 templates par R1 générés
  const topByR1 = templates.slice(0, 3);

  // Top 3 templates par taux de conversion (minimum 5 messages)
  const topByConversion = [...templates]
    .filter(t => t.totalMessages >= 5)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 3);

  // Stats globales
  const totalR1 = templates.reduce((sum, t) => sum + t.r1Count, 0);
  const totalMessages = templates.reduce((sum, t) => sum + t.totalMessages, 0);
  const avgConversion = templates.length > 0
    ? templates.reduce((sum, t) => sum + t.conversionRate, 0) / templates.length
    : 0;

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
              <p className="text-muted-foreground mt-1">Performance des templates pour générer des R1</p>
            </div>
          </div>

          {/* Métriques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Templates utilisés</div>
              <div className="text-3xl font-bold">{templates.length}</div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Messages envoyés</div>
              <div className="text-3xl font-bold text-blue-400">{totalMessages}</div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">R1 générés</div>
              <div className="text-3xl font-bold text-green-400">{totalR1}</div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Conversion moyenne</div>
              <div className="text-3xl font-bold text-purple-400">{avgConversion.toFixed(1)}%</div>
            </Card>
          </div>

          {/* Top 3 par R1 générés */}
          {topByR1.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 3 Templates - R1 Générés
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Templates qui ont généré le plus de rendez-vous
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topByR1.map((template, index) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <Card key={template.id} className="p-6 bg-background/50">
                      <div className="text-4xl mb-2 text-center">{medals[index]}</div>
                      <div className="font-semibold mb-2 text-center line-clamp-2">{template.name}</div>
                      <div className="text-xs text-muted-foreground mb-3 text-center">
                        {template.totalMessages} messages envoyés
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <div className="text-2xl font-bold text-green-400">
                          {template.r1Count}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        R1 programmés
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-muted-foreground text-center">
                          Taux de conversion : <span className="text-purple-400 font-semibold">{template.conversionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Top 3 par taux de conversion */}
          {topByConversion.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Top 3 Templates - Taux de Conversion
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Templates avec le meilleur ratio R1/Messages (minimum 5 messages)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topByConversion.map((template, index) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <Card key={template.id} className="p-6 bg-background/50">
                      <div className="text-4xl mb-2 text-center">{medals[index]}</div>
                      <div className="font-semibold mb-2 text-center line-clamp-2">{template.name}</div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <div className="text-2xl font-bold text-purple-400">
                          {template.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        de conversion
                      </div>
                      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground text-center">
                        {template.r1Count} R1 sur {template.totalMessages} messages
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Liste complète des templates */}
          <Card className="p-6 border-border/50 bg-card/50">
            <h2 className="text-xl font-semibold mb-4">Tous les Templates</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des analytics...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun template utilisé pour le moment
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4 bg-background/30 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.totalMessages} messages • {template.r1Count} R1 générés
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-400">{template.conversionRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">conversion</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default TemplateAnalytics;
