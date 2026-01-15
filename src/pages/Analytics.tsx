import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Send, MessageCircle, Phone, CheckCircle, X, TrendingUp } from "lucide-react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay,
  isWithinInterval,
  format,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
  subWeeks
} from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DailyBreakdownTable from "@/components/analytics/DailyBreakdownTable";
import PerformanceChart from "@/components/analytics/PerformanceChart";
import ActivityDetailModal from "@/components/analytics/ActivityDetailModal";

type DateFilter = "thisMonth" | "lastMonth" | "thisWeek" | "lastWeek" | "all" | "custom";

interface ActivityLog {
  id: string;
  type: 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';
  created_at: string;
  user_name: string;
  lead_id: string;
  prospect_name?: string;
  prospect_company?: string;
}

import { RotateCcw } from "lucide-react";

const typeConfig: Record<ActivityLog['type'], { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  message_sent: { 
    label: 'Nouvelle Conversation', 
    icon: Send, 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
  },
  first_dm: { 
    label: '1er DM (quota)', 
    icon: Send, 
    color: 'bg-blue-100 text-blue-700 border-blue-300' 
  },
  follow_up_dm: { 
    label: 'Relance (hors quota)', 
    icon: RotateCcw, 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300' 
  },
  reply_received: { 
    label: 'Réponse Reçue', 
    icon: MessageCircle, 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300' 
  },
  call_booked: { 
    label: 'Call Booké', 
    icon: Phone, 
    color: 'bg-green-100 text-green-700 border-green-300' 
  },
  deal_closed: { 
    label: 'Deal Closé', 
    icon: CheckCircle, 
    color: 'bg-purple-100 text-purple-700 border-purple-300' 
  },
};

const Analytics = () => {
  const navigate = useNavigate();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("thisWeek");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState(25);
  const [workDays, setWorkDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [contactedProspects, setContactedProspects] = useState<any[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalCategory, setDetailModalCategory] = useState<'dms' | 'replies' | 'calls' | 'deals'>('dms');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadData();
      loadObjectives();
    });

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const loadObjectives = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('setter_objectives')
      .select('daily_target, work_days')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setDailyTarget(data.daily_target);
      setWorkDays(data.work_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    // Load activity logs with prospect info (including stored prospect_name/company for anti-cheat)
    const { data: logsData, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        type,
        created_at,
        user_name,
        lead_id,
        prospect_name,
        prospect_company
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading activity logs:', error);
      setLoading(false);
      return;
    }

    // Get prospect names for each log
    if (logsData && logsData.length > 0) {
      const leadIds = [...new Set(logsData.map(l => l.lead_id))];
      const { data: prospectsData } = await supabase
        .from('prospects')
        .select('id, full_name, company, linkedin_url, status')
        .in('id', leadIds);

      const prospectMap = new Map(
        prospectsData?.map(p => [p.id, { 
          name: p.full_name, 
          company: p.company,
          linkedin_url: p.linkedin_url,
          status: p.status
        }]) || []
      );

      // Use stored prospect info first (anti-cheat: survives archiving), fallback to join
      const enrichedLogs: ActivityLog[] = logsData.map(log => ({
        ...log,
        type: log.type as ActivityLog['type'],
        prospect_name: log.prospect_name || prospectMap.get(log.lead_id)?.name || 'Prospect archivé',
        prospect_company: log.prospect_company || prospectMap.get(log.lead_id)?.company || '',
      }));

      setActivityLogs(enrichedLogs);

      // Build contacted prospects list (unique prospects with first DM info)
      const prospectDMMap = new Map<string, {
        id: string;
        prospect_id: string;
        prospect_name: string;
        prospect_company: string;
        first_dm_date: string;
        has_replied: boolean;
        has_call: boolean;
        linkedin_url?: string;
        current_status: string;
      }>();

      // Sort logs by date (oldest first) to get first DM date correctly
      const sortedLogs = [...logsData].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      for (const log of sortedLogs) {
        if (log.type === 'first_dm' || log.type === 'message_sent') {
          if (!prospectDMMap.has(log.lead_id)) {
            const prospectInfo = prospectMap.get(log.lead_id);
            // Use stored prospect info first (anti-cheat), fallback to join
            prospectDMMap.set(log.lead_id, {
              id: log.id,
              prospect_id: log.lead_id,
              prospect_name: (log as any).prospect_name || prospectInfo?.name || 'Prospect archivé',
              prospect_company: (log as any).prospect_company || prospectInfo?.company || '',
              first_dm_date: log.created_at,
              has_replied: false,
              has_call: false,
              linkedin_url: prospectInfo?.linkedin_url,
              current_status: prospectInfo?.status || 'archivé'
            });
          }
        }
      }

      // Mark replied and calls
      for (const log of logsData) {
        const prospect = prospectDMMap.get(log.lead_id);
        if (prospect) {
          if (log.type === 'reply_received') prospect.has_replied = true;
          if (log.type === 'call_booked') prospect.has_call = true;
        }
      }

      setContactedProspects(Array.from(prospectDMMap.values()));
    } else {
      setActivityLogs([]);
      setContactedProspects([]);
    }

    setLoading(false);
  };

  // Activity deletion is now disabled (anti-cheat: immutable logs)
  // This function is kept but will show an error if called
  const handleDeleteActivity = async (id: string) => {
    toast.error("Les activités ne peuvent plus être supprimées (système anti-triche)");
  };

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "thisWeek":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: `Semaine du ${format(startOfWeek(now, { weekStartsOn: 1 }), "dd MMM", { locale: fr })}`
        };
      case "lastWeek":
        const lastWeekDate = subWeeks(now, 1);
        return {
          start: startOfWeek(lastWeekDate, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeekDate, { weekStartsOn: 1 }),
          label: `Semaine du ${format(startOfWeek(lastWeekDate, { weekStartsOn: 1 }), "dd MMM", { locale: fr })}`
        };
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
        // Find the earliest activity date to avoid generating thousands of empty days
        const earliestActivity = activityLogs.length > 0 
          ? activityLogs.reduce((earliest, log) => {
              const logDate = parseISO(log.created_at);
              return logDate < earliest ? logDate : earliest;
            }, parseISO(activityLogs[0].created_at))
          : subMonths(now, 3); // Default to 3 months ago if no activities
        
        return {
          start: startOfDay(earliestActivity),
          end: endOfDay(now),
          label: `Depuis ${format(earliestActivity, "dd MMM yyyy", { locale: fr })}`
        };
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            start: startOfDay(customStartDate),
            end: endOfDay(customEndDate),
            label: `${format(customStartDate, "dd MMM yyyy", { locale: fr })} - ${format(customEndDate, "dd MMM yyyy", { locale: fr })}`
          };
        }
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: "Sélectionner une période"
        };
    }
  };

  const dateRange = getDateRange();

  // Filter logs by date
  const filteredLogs = activityLogs.filter((log) => {
    if (dateFilter === "all") return true;
    const logDate = parseISO(log.created_at);
    return isWithinInterval(logDate, { start: dateRange.start, end: dateRange.end });
  });

  // Calculate metrics - only count first_dm for quotas (and legacy message_sent)
  const firstDMs = filteredLogs.filter(l => l.type === 'first_dm' || l.type === 'message_sent').length;
  const followUps = filteredLogs.filter(l => l.type === 'follow_up_dm').length;
  const repliesReceived = filteredLogs.filter(l => l.type === 'reply_received').length;
  const callsBooked = filteredLogs.filter(l => l.type === 'call_booked').length;
  const dealsClosed = filteredLogs.filter(l => l.type === 'deal_closed').length;

  // Calculate rates based on first DMs only (not follow-ups)
  const replyRate = firstDMs > 0 ? ((repliesReceived / firstDMs) * 100).toFixed(1) : "0";
  const bookingRate = repliesReceived > 0 ? ((callsBooked / repliesReceived) * 100).toFixed(1) : "0";
  const closeRate = callsBooked > 0 ? ((dealsClosed / callsBooked) * 100).toFixed(1) : "0";

  const openDetailModal = (category: 'dms' | 'replies' | 'calls' | 'deals') => {
    setDetailModalCategory(category);
    setDetailModalOpen(true);
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
                Analytics Performance
              </h1>
              <p className="text-muted-foreground mt-1">Suivi des activités et performances</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === "thisWeek" ? "default" : "outline"}
                onClick={() => setDateFilter("thisWeek")}
                size="sm"
              >
                Cette semaine
              </Button>
              <Button
                variant={dateFilter === "lastWeek" ? "default" : "outline"}
                onClick={() => setDateFilter("lastWeek")}
                size="sm"
              >
                Semaine dernière
              </Button>
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
              
              {/* Custom period */}
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

          {/* Main metrics - clickable cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card 
              className="p-6 border-border/50 bg-card/50 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
              onClick={() => openDetailModal('dms')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-sm text-muted-foreground">1ers DM (quota)</div>
              </div>
              <div className="text-4xl font-bold text-blue-400">{firstDMs}</div>
              <div className="text-xs text-muted-foreground mt-1">
                + {followUps} relances (hors quota)
              </div>
              <div className="text-xs text-blue-400/70 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Cliquer pour voir les détails →
              </div>
            </Card>

            <Card 
              className="p-6 border-border/50 bg-card/50 cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all group"
              onClick={() => openDetailModal('replies')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-sm text-muted-foreground">Réponses Reçues</div>
              </div>
              <div className="text-4xl font-bold text-yellow-400">{repliesReceived}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Taux de réponse : {replyRate}%
              </div>
              <div className="text-xs text-yellow-400/70 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Cliquer pour voir les détails →
              </div>
            </Card>

            <Card 
              className="p-6 border-border/50 bg-card/50 cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-all group"
              onClick={() => openDetailModal('calls')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Phone className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-sm text-muted-foreground">R1 Programmés</div>
              </div>
              <div className="text-4xl font-bold text-green-400">{callsBooked}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Taux de booking : {bookingRate}%
              </div>
              <div className="text-xs text-green-400/70 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Cliquer pour voir les détails →
              </div>
            </Card>

            <Card 
              className="p-6 border-border/50 bg-card/50 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
              onClick={() => openDetailModal('deals')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-sm text-muted-foreground">Deals Closés</div>
              </div>
              <div className="text-4xl font-bold text-purple-400">{dealsClosed}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Taux de closing : {closeRate}%
              </div>
              <div className="text-xs text-purple-400/70 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Cliquer pour voir les détails →
              </div>
            </Card>

            {/* Funnel visualization */}
            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/10 to-purple-500/10">
              <div className="text-sm text-muted-foreground mb-2">Funnel (pour 100 DM)</div>
              <div className="space-y-1 text-sm">
                <div className="text-blue-400 font-medium">100 → 1ers DM</div>
                <div className="text-yellow-400 font-medium">
                  {firstDMs > 0 ? Math.round((repliesReceived / firstDMs) * 100) : 0} → Réponses
                </div>
                <div className="text-green-400 font-medium">
                  {firstDMs > 0 ? Math.round((callsBooked / firstDMs) * 100) : 0} → Calls
                </div>
                <div className="text-purple-400 font-medium">
                  {firstDMs > 0 ? Math.round((dealsClosed / firstDMs) * 100) : 0} → Deals
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Detail Modal */}
          <ActivityDetailModal
            onActivityDeleted={loadData}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            category={detailModalCategory}
            activities={filteredLogs}
            periodLabel={dateRange.label}
          />

          {/* Performance Evolution Chart */}
          <PerformanceChart 
            activities={activityLogs} 
            startDate={dateRange.start}
            endDate={dateRange.end > new Date() ? new Date() : dateRange.end}
          />

          {/* Conversion Rate Card */}
          <Card className="p-6 border-border/50 bg-gradient-to-r from-purple-500/10 via-primary/10 to-green-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-green-500/20">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Taux de conversion global</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main conversion metric */}
              <div className="text-center p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="text-4xl font-bold text-purple-400">
                  {dealsClosed > 0 ? Math.round(firstDMs / dealsClosed) : "∞"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">messages pour 1 deal</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {firstDMs > 0 ? ((dealsClosed / firstDMs) * 100).toFixed(2) : "0"}% de conversion
                </div>
              </div>

              {/* Step by step conversion */}
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="text-sm font-medium text-muted-foreground mb-3">Conversions par étape</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">DM → Réponse</span>
                    <span className="font-bold text-yellow-400">{replyRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400">Réponse → Call</span>
                    <span className="font-bold text-green-400">{bookingRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">Call → Deal</span>
                    <span className="font-bold text-purple-400">{closeRate}%</span>
                  </div>
                </div>
              </div>

              {/* Prediction */}
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="text-sm font-medium text-muted-foreground mb-3">Projection</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Pour 100 DM →</span>
                    <span className="font-bold text-purple-400">
                      {firstDMs > 0 ? ((dealsClosed / firstDMs) * 100).toFixed(1) : "0"} deals
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pour 500 DM →</span>
                    <span className="font-bold text-purple-400">
                      {firstDMs > 0 ? ((dealsClosed / firstDMs) * 500).toFixed(1) : "0"} deals
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pour 1000 DM →</span>
                    <span className="font-bold text-purple-400">
                      {firstDMs > 0 ? ((dealsClosed / firstDMs) * 1000).toFixed(1) : "0"} deals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Breakdown Table */}
          <DailyBreakdownTable 
            activities={filteredLogs}
            startDate={dateRange.start}
            endDate={dateRange.end > new Date() ? new Date() : dateRange.end}
            dailyTarget={dailyTarget}
            workDays={workDays}
          />

        </main>
      </div>
    </div>
  );
};

export default Analytics;
