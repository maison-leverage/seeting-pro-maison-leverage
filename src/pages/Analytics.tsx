import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Prospect } from "@/types/prospect";
import { Template } from "@/types/template";
import { CalendarIcon, TrendingUp, Users, Phone, Flame, Award, MessageSquare, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay,
  isWithinInterval,
  format,
  subMonths
} from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const Analytics = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = () => {
    const storedProspects = localStorage.getItem("crm_prospects");
    const storedTemplates = localStorage.getItem("crm_templates");
    
    if (storedProspects) {
      setProspects(JSON.parse(storedProspects));
    }
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }
  };

  // Formater la période sélectionnée
  const getDateRangeLabel = () => {
    if (!dateRange?.from) return "Sélectionner une période";
    if (!dateRange.to) return format(dateRange.from, "d MMM yyyy", { locale: fr });
    return `${format(dateRange.from, "d MMM yyyy", { locale: fr })} - ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`;
  };

  // NOUVELLES CONVERSATIONS = prospects créés dans la période
  const newConversations = prospects.filter((p) => {
    if (!dateRange?.from) return false;
    const createdDate = new Date(p.createdAt);
    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    return isWithinInterval(createdDate, { start, end });
  });

  // R1 BOOKÉS issus de ces nouvelles conversations
  const r1FromNewConversations = newConversations.filter(
    (p) => p.status === "r1_programme"
  );

  // Taux de conversion réel : nouvelles conversations → R1
  const realConversionRate = newConversations.length > 0 
    ? (r1FromNewConversations.length / newConversations.length) * 100
    : 0;

  // Projection : doubler les conversations
  const projectedConversations = newConversations.length * 2;
  const projectedR1 = Math.round(projectedConversations * (realConversionRate / 100));

  // Pour la compatibilité avec le reste du code (répartition hype)
  const filteredProspects = newConversations;

  // Statistiques par hype
  const byHype = {
    froid: filteredProspects.filter((p) => p.hype === "froid").length,
    tiede: filteredProspects.filter((p) => p.hype === "tiede").length,
    chaud: filteredProspects.filter((p) => p.hype === "chaud").length,
  };

  // Filtrer les templates utilisés dans la période
  const templatesWithActivity = templates.map((t) => {
    const usageInPeriod = t.usageHistory?.filter((u) => {
      if (!dateRange?.from) return false;
      const usageDate = new Date(u.date);
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      return isWithinInterval(usageDate, { start, end });
    }) || [];

    const sendsInPeriod = usageInPeriod.length;
    const callsInPeriod = usageInPeriod.filter((u) => u.hasCall).length;

    return {
      ...t,
      sendsInPeriod,
      callsInPeriod,
      callRateInPeriod: sendsInPeriod > 0 ? (callsInPeriod / sendsInPeriod) * 100 : 0,
    };
  }).filter((t) => t.sendsInPeriod > 0);

  // Top 3 templates du mois
  const topTemplates = [...templatesWithActivity]
    .filter((t) => t.sendsInPeriod >= 5) // Minimum 5 envois pour être pertinent
    .sort((a, b) => {
      // Score: 70% call rate + 30% volume normalisé
      const scoreA = a.callRateInPeriod * 0.7 + Math.min(a.sendsInPeriod / 10, 10) * 3;
      const scoreB = b.callRateInPeriod * 0.7 + Math.min(b.sendsInPeriod / 10, 10) * 3;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  const hypeConfig = {
    froid: { label: "Froid", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
    tiede: { label: "Tiède", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    chaud: { label: "Chaud", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Analytics CRM
              </h1>
              <p className="text-muted-foreground mt-1">Vue d'ensemble de vos performances</p>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDateRangeLabel()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Card className="p-4 border-border/50 bg-card/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>Période : {getDateRangeLabel()}</span>
            </div>
          </Card>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-sm text-muted-foreground">Nouvelles conversations</div>
              </div>
              <div className="text-4xl font-bold text-purple-400">{newConversations.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                premiers messages envoyés
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Phone className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-sm text-muted-foreground">R1 Bookés</div>
              </div>
              <div className="text-4xl font-bold text-green-400">{r1FromNewConversations.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                issus de ces conversations
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-sm text-muted-foreground">Taux de conversion</div>
              </div>
              <div className="text-4xl font-bold text-blue-400">{realConversionRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                conversations → R1
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-sm text-muted-foreground">Prospects chauds</div>
              </div>
              <div className="text-4xl font-bold text-orange-400">{byHype.chaud}</div>
              <div className="text-xs text-muted-foreground mt-1">
                niveau hype max
              </div>
            </Card>
          </div>

          {/* Projection de performance */}
          {newConversations.length > 0 && (
            <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Projection de performance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Performance actuelle</div>
                    <div className="text-2xl font-bold">
                      {newConversations.length} conversations → {r1FromNewConversations.length} R1
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Soit {realConversionRate.toFixed(1)}% de taux de conversion
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">📈 Si vous doublez vos conversations</div>
                    <div className="text-2xl font-bold text-primary">
                      {projectedConversations} conversations → ~{projectedR1} R1
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Projection basée sur votre taux actuel
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <div className="text-sm font-medium mb-2">💡 Pour améliorer vos résultats :</div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Augmentez le nombre de conversations (premiers messages)</li>
                    <li>• Optimisez vos templates dans la section Templates</li>
                    <li>• Analysez vos meilleurs messages ci-dessous</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Répartition par hype */}
          <Card className="p-6 border-border/50 bg-card/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Répartition par niveau de hype
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-cyan-500/5 border-cyan-500/20">
                <div className="text-sm text-muted-foreground mb-1">❄️ Froid</div>
                <div className="text-3xl font-bold text-cyan-400">{byHype.froid}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {filteredProspects.length > 0 
                    ? ((byHype.froid / filteredProspects.length) * 100).toFixed(0)
                    : 0}% du total
                </div>
              </Card>
              <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
                <div className="text-sm text-muted-foreground mb-1">🌡️ Tiède</div>
                <div className="text-3xl font-bold text-yellow-400">{byHype.tiede}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {filteredProspects.length > 0 
                    ? ((byHype.tiede / filteredProspects.length) * 100).toFixed(0)
                    : 0}% du total
                </div>
              </Card>
              <Card className="p-4 bg-red-500/5 border-red-500/20">
                <div className="text-sm text-muted-foreground mb-1">🔥 Chaud</div>
                <div className="text-3xl font-bold text-red-400">{byHype.chaud}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {filteredProspects.length > 0 
                    ? ((byHype.chaud / filteredProspects.length) * 100).toFixed(0)
                    : 0}% du total
                </div>
              </Card>
            </div>
          </Card>

          {/* Top templates du mois */}
          {topTemplates.length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top 3 Messages de la période
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Les templates qui ont généré le plus d'appels
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topTemplates.map((template, index) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <Card key={template.id} className="p-6 bg-background/50 text-center">
                      <div className="text-4xl mb-2">{medals[index]}</div>
                      <div className="font-semibold mb-2 line-clamp-2">{template.name}</div>
                      <div className="text-xs text-muted-foreground mb-3">
                        {template.sendsInPeriod} envois
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <div className="text-2xl font-bold text-green-400">
                          {template.callRateInPeriod.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {template.callsInPeriod} appels générés
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {filteredProspects.length === 0 && (
            <Card className="p-12 text-center border-border/50 bg-card/50">
              <p className="text-muted-foreground">
                Aucune donnée disponible pour cette période.
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analytics;
