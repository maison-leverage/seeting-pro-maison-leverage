import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, Phone, Flame, MessageSquare } from "lucide-react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay,
  isWithinInterval,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProspects } from "@/hooks/useProspects";
import { useTemplates } from "@/hooks/useTemplates";

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { prospects, isLoading: prospectsLoading } = useProspects();
  const { templates, isLoading: templatesLoading } = useTemplates();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

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

  const getDateRangeLabel = () => {
    if (!dateRange?.from) return "Sélectionner une période";
    if (!dateRange.to) return format(dateRange.from, "d MMM yyyy", { locale: fr });
    return `${format(dateRange.from, "d MMM yyyy", { locale: fr })} - ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`;
  };

  const newConversations = useMemo(() => {
    if (!dateRange?.from) return [];
    return prospects.filter((p) => {
      const messageDate = new Date(p.firstMessageDate || p.createdAt);
      const start = startOfDay(dateRange.from!);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(messageDate, { start, end });
    });
  }, [prospects, dateRange]);

  const r1FromNewConversations = useMemo(() => {
    return newConversations.filter((p) => p.status === "r1_programme");
  }, [newConversations]);

  const realConversionRate = useMemo(() => {
    return newConversations.length > 0 
      ? (r1FromNewConversations.length / newConversations.length) * 100
      : 0;
  }, [newConversations, r1FromNewConversations]);

  const byHype = useMemo(() => ({
    froid: newConversations.filter((p) => p.hype === "froid").length,
    tiede: newConversations.filter((p) => p.hype === "tiede").length,
    chaud: newConversations.filter((p) => p.hype === "chaud").length,
  }), [newConversations]);

  if (authLoading || prospectsLoading || templatesLoading) {
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
                  {newConversations.length > 0 
                    ? ((byHype.froid / newConversations.length) * 100).toFixed(0)
                    : 0}% du total
                </div>
              </Card>
              <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
                <div className="text-sm text-muted-foreground mb-1">🌡️ Tiède</div>
                <div className="text-3xl font-bold text-yellow-400">{byHype.tiede}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {newConversations.length > 0 
                    ? ((byHype.tiede / newConversations.length) * 100).toFixed(0)
                    : 0}% du total
                </div>
              </Card>
              <Card className="p-4 bg-red-500/5 border-red-500/20">
                <div className="text-sm text-muted-foreground mb-1">🔥 Chaud</div>
                <div className="text-3xl font-bold text-red-400">{byHype.chaud}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {newConversations.length > 0 
                    ? ((byHype.chaud / newConversations.length) * 100).toFixed(0)
                    : 0}% du total
                </div>
              </Card>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
