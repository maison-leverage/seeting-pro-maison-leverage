import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Send, MessageCircle, Phone, CheckCircle, X, TrendingUp, Users, Trash2 } from "lucide-react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay,
  isWithinInterval,
  format,
  subMonths,
  parseISO
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

type DateFilter = "thisMonth" | "lastMonth" | "all" | "custom";

interface ActivityLog {
  id: string;
  type: 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed';
  created_at: string;
  user_name: string;
  lead_id: string;
  prospect_name?: string;
  prospect_company?: string;
}

const typeConfig = {
  message_sent: { 
    label: 'Nouvelle Conversation', 
    icon: Send, 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
  },
  reply_received: { 
    label: 'Réponse Reçue', 
    icon: MessageCircle, 
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
  },
  call_booked: { 
    label: 'Call Booké', 
    icon: Phone, 
    color: 'bg-green-500/20 text-green-400 border-green-500/30' 
  },
  deal_closed: { 
    label: 'Deal Closé', 
    icon: CheckCircle, 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
  },
};

const Analytics = () => {
  const navigate = useNavigate();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadData();
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

  const loadData = async () => {
    setLoading(true);
    
    // Load activity logs with prospect info
    const { data: logsData, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        type,
        created_at,
        user_name,
        lead_id
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
        .select('id, full_name, company')
        .in('id', leadIds);

      const prospectMap = new Map(
        prospectsData?.map(p => [p.id, { name: p.full_name, company: p.company }]) || []
      );

      const enrichedLogs: ActivityLog[] = logsData.map(log => ({
        ...log,
        type: log.type as ActivityLog['type'],
        prospect_name: prospectMap.get(log.lead_id)?.name || 'Prospect supprimé',
        prospect_company: prospectMap.get(log.lead_id)?.company || '',
      }));

      setActivityLogs(enrichedLogs);
    } else {
      setActivityLogs([]);
    }

    setLoading(false);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Supprimer cette activité ?")) return;

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Activité supprimée");
    loadData();
  };

  // Calculate date range
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

  // Calculate metrics
  const messagesSent = filteredLogs.filter(l => l.type === 'message_sent').length;
  const repliesReceived = filteredLogs.filter(l => l.type === 'reply_received').length;
  const callsBooked = filteredLogs.filter(l => l.type === 'call_booked').length;
  const dealsClosed = filteredLogs.filter(l => l.type === 'deal_closed').length;

  // Calculate rates
  const replyRate = messagesSent > 0 ? ((repliesReceived / messagesSent) * 100).toFixed(1) : "0";
  const bookingRate = repliesReceived > 0 ? ((callsBooked / repliesReceived) * 100).toFixed(1) : "0";
  const closeRate = callsBooked > 0 ? ((dealsClosed / callsBooked) * 100).toFixed(1) : "0";

  // Get unique users with their stats
  const userStats = filteredLogs.reduce((acc, log) => {
    if (!acc[log.user_name]) {
      acc[log.user_name] = { messages: 0, replies: 0, calls: 0, deals: 0 };
    }
    if (log.type === 'message_sent') acc[log.user_name].messages++;
    if (log.type === 'reply_received') acc[log.user_name].replies++;
    if (log.type === 'call_booked') acc[log.user_name].calls++;
    if (log.type === 'deal_closed') acc[log.user_name].deals++;
    return acc;
  }, {} as Record<string, { messages: number; replies: number; calls: number; deals: number }>);

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

          {/* Main metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-sm text-muted-foreground">Nouvelles Conversations</div>
              </div>
              <div className="text-4xl font-bold text-blue-400">{messagesSent}</div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <MessageCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-sm text-muted-foreground">Réponses Reçues</div>
              </div>
              <div className="text-4xl font-bold text-yellow-400">{repliesReceived}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Taux de réponse : {replyRate}%
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Phone className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-sm text-muted-foreground">Calls Bookés</div>
              </div>
              <div className="text-4xl font-bold text-green-400">{callsBooked}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Taux de booking : {bookingRate}%
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-sm text-muted-foreground">Deals Closés</div>
              </div>
              <div className="text-4xl font-bold text-purple-400">{dealsClosed}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Taux de closing : {closeRate}%
              </div>
            </Card>
          </div>

          {/* User performance */}
          {Object.keys(userStats).length > 0 && (
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Performance par utilisateur
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-center">Nouvelles Conv.</TableHead>
                    <TableHead className="text-center">Réponses</TableHead>
                    <TableHead className="text-center">Calls</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-center">Taux Réponse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(userStats).map(([userName, stats]) => (
                    <TableRow key={userName}>
                      <TableCell className="font-medium">{userName}</TableCell>
                      <TableCell className="text-center text-blue-400">{stats.messages}</TableCell>
                      <TableCell className="text-center text-yellow-400">{stats.replies}</TableCell>
                      <TableCell className="text-center text-green-400">{stats.calls}</TableCell>
                      <TableCell className="text-center text-purple-400">{stats.deals}</TableCell>
                      <TableCell className="text-center">
                        {stats.messages > 0 ? ((stats.replies / stats.messages) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Activity log table */}
          <Card className="p-6 border-border/50 bg-card/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Historique des activités
            </h2>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune activité enregistrée pour cette période.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Prospect</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 50).map((log) => {
                    const config = typeConfig[log.type];
                    const IconComponent = config.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className={config.color}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.prospect_name}</TableCell>
                        <TableCell className="text-muted-foreground">{log.prospect_company}</TableCell>
                        <TableCell>{log.user_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(log.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteActivity(log.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
