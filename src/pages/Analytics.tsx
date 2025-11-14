import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prospect } from "@/types/prospect";
import { Template } from "@/types/template";
import { CalendarIcon, Users, Phone, Award, X, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { ProspectMessageManager } from "@/components/prospects/ProspectMessageManager";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type DateFilter = "thisMonth" | "lastMonth" | "all" | "custom";

const Analytics = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [expandedProspectId, setExpandedProspectId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadData();
    });
  }, [navigate]);

  const loadData = async () => {
    const { data: prospectsData } = await supabase.from('prospects').select('*');
    const { data: templatesData } = await supabase.from('templates').select('*');
    
    if (prospectsData) {
      const loadedProspects: Prospect[] = prospectsData.map((p: any) => ({
        id: p.id,
        fullName: p.full_name,
        company: p.company,
        position: p.position || "",
        linkedinUrl: p.linkedin_url || "",
        status: p.status,
        priority: p.priority,
        qualification: p.qualification,
        hype: p.hype,
        tags: p.tags || [],
        notes: [],
        history: [],
        reminderDate: p.reminder_date,
        firstMessageDate: p.first_message_date,
        assignedTo: p.assigned_to || "",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        lastContact: p.last_contact,
        followUpCount: p.follow_up_count || 0,
        no_show: p.no_show || false,
        proposal_sent: p.proposal_sent || false,
        r2_scheduled: p.r2_scheduled || false,
        no_follow_up: p.no_follow_up || false,
      }));
      setProspects(loadedProspects);
    }

    if (templatesData) {
      const loadedTemplates: Template[] = templatesData.map((t: any) => ({
        id: t.id,
        name: t.name,
        category: "premier_contact",
        content: t.content,
        status: "actif",
        targetProfile: {
          types: t.target_types || [],
          sectors: t.target_sectors || [],
          sizes: t.target_sizes || []
        },
        metrics: {
          sends: t.sent_count || 0,
          responses: t.response_count || 0,
          calls: 0,
          responseRate: 0,
          callRate: 0,
          rating: 1
        },
        tags: t.tags || [],
        notes: t.notes || "",
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        usageHistory: [],
      }));
      setTemplates(loadedTemplates);
    }
  };

  // Calculer les dates de filtrage
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "thisMonth":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, "MMMM yyyy", { locale: fr })
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
          label: format(lastMonth, "MMMM yyyy", { locale: fr })
        };
      case "all":
        return {
          start: new Date(0),
          end: new Date(),
          label: "Toutes les données"
        };
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            start: startOfDay(customStartDate),
            end: endOfDay(customEndDate),
            label: `${format(customStartDate, "dd MMM yyyy", { locale: fr })} - ${format(customEndDate, "dd MMM yyyy", { locale: fr })}`
          };
        }
        // Par défaut si les dates ne sont pas définies
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: "Sélectionner une période"
        };
    }
  };

  const dateRange = getDateRange();

  // Filtrer les prospects par date
  const filteredProspects = prospects.filter((p) => {
    if (dateFilter === "all") return true;
    const prospectDate = new Date(p.createdAt);
    return isWithinInterval(prospectDate, { start: dateRange.start, end: dateRange.end });
  });

  // Calculer les R1 bookés (tous les R1, pas filtré par date)
  const r1Booked = prospects.filter((p) => p.status === "r1_programme").length;

  // Calculer le taux de no show
  const r1WithNoShow = prospects.filter((p) => p.status === "r1_programme" && p.no_show === true).length;
  const noShowRate = r1Booked > 0 
    ? ((r1WithNoShow / r1Booked) * 100).toFixed(1)
    : "0";

  // Filtrer les templates utilisés dans la période
  const templatesWithActivity = templates.map((t) => {
    const usageInPeriod = t.usageHistory?.filter((u) => {
      const usageDate = new Date(u.date);
      return isWithinInterval(usageDate, { start: dateRange.start, end: dateRange.end });
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

  const handleCheckboxChange = async (prospectId: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from('prospects')
      .update({ [field]: value })
      .eq('id', prospectId);

    if (error) {
      console.error('Error updating prospect:', error);
      return;
    }

    // Recharger les données
    loadData();
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
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === "thisMonth" ? "default" : "outline"}
                onClick={() => setDateFilter("thisMonth")}
                size="sm"
              >
                Ce mois-ci
              </Button>
              <Button
                variant={dateFilter === "lastMonth" ? "default" : "outline"}
                onClick={() => setDateFilter("lastMonth")}
                size="sm"
              >
                Mois dernier
              </Button>
              <Button
                variant={dateFilter === "all" ? "default" : "outline"}
                onClick={() => setDateFilter("all")}
                size="sm"
              >
                Tout
              </Button>
              
              {/* Période personnalisée */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateFilter === "custom" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "dd/MM/yy") : "Du..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        if (date && customEndDate) {
                          setDateFilter("custom");
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateFilter === "custom" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "dd/MM/yy") : "Au..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        if (customStartDate && date) {
                          setDateFilter("custom");
                        }
                      }}
                      disabled={(date) => customStartDate ? date < customStartDate : false}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {dateFilter === "custom" && customStartDate && customEndDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                      setDateFilter("thisMonth");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Card className="p-4 border-border/50 bg-card/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>Période : {dateRange.label}</span>
            </div>
          </Card>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Phone className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-sm text-muted-foreground">R1 Bookés</div>
              </div>
              <div className="text-4xl font-bold text-green-400">{r1Booked}</div>
              <div className="text-xs text-muted-foreground mt-1">
                sur {filteredProspects.length} prospects
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-sm text-muted-foreground">Taux de No Show</div>
              </div>
              <div className="text-4xl font-bold text-red-400">{noShowRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {r1WithNoShow} no show sur {r1Booked} R1
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-sm text-muted-foreground">Total prospects</div>
              </div>
              <div className="text-4xl font-bold text-purple-400">{filteredProspects.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                dans la période
              </div>
            </Card>
          </div>


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

          {/* Section R1 Programmé */}
          <Card className="p-6 border-border/50 bg-card/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              R1 Programmé
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prospects avec un premier rendez-vous planifié
            </p>
            <div className="space-y-4">
              {prospects.filter(p => p.status === "r1_programme").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun prospect avec R1 programmé
                </div>
              ) : (
                prospects
                  .filter(p => p.status === "r1_programme")
                  .map((prospect) => (
                    <Card key={prospect.id} className="p-4 bg-background/50">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedProspectId(
                          expandedProspectId === prospect.id ? null : prospect.id
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{prospect.fullName}</div>
                          <div className="text-sm text-muted-foreground">{prospect.company}</div>
                          {prospect.reminderDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              📅 Rappel : {new Date(prospect.reminderDate).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                          
                          {/* Checkboxes pour le suivi */}
                          <div className="flex flex-wrap gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`no-show-${prospect.id}`}
                                checked={prospect.no_show || false}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange(prospect.id, 'no_show', checked as boolean)
                                }
                              />
                              <label 
                                htmlFor={`no-show-${prospect.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                No Show
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`proposal-${prospect.id}`}
                                checked={prospect.proposal_sent || false}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange(prospect.id, 'proposal_sent', checked as boolean)
                                }
                              />
                              <label 
                                htmlFor={`proposal-${prospect.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                Propal envoyée
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`r2-${prospect.id}`}
                                checked={prospect.r2_scheduled || false}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange(prospect.id, 'r2_scheduled', checked as boolean)
                                }
                              />
                              <label 
                                htmlFor={`r2-${prospect.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                R2 programmé
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`no-follow-${prospect.id}`}
                                checked={prospect.no_follow_up || false}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange(prospect.id, 'no_follow_up', checked as boolean)
                                }
                              />
                              <label 
                                htmlFor={`no-follow-${prospect.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                Sans suite
                              </label>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedProspectId === prospect.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {expandedProspectId === prospect.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <ProspectMessageManager prospectId={prospect.id} />
                        </div>
                      )}
                    </Card>
                  ))
              )}
            </div>
          </Card>

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
