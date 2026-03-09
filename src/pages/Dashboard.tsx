import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Users, TrendingUp, Clock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import TodayActivityCard from "@/components/dashboard/TodayActivityCard";
import FollowUpsTodayCard from "@/components/dashboard/FollowUpsTodayCard";
import { startOfDay, endOfDay } from "date-fns";
import { useProspects } from "@/hooks/useProspects";

interface TodayActivity {
  id: string;
  type: 'first_dm' | 'follow_up_dm' | 'reply_received' | 'call_booked' | 'deal_closed' | 'message_sent';
  created_at: string;
  prospect_name: string;
  prospect_company: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { prospects, todayCount } = useProspects();
  const [todayActivities, setTodayActivities] = useState<TodayActivity[]>([]);
  const [dailyTarget, setDailyTarget] = useState(25);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    // Check auth and load data
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadTodayActivities();
      loadObjectives();
    });

    // Realtime subscription for activity logs
    const activityChannel = supabase
      .channel('dashboard-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        loadTodayActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, [navigate]);

  const loadObjectives = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('setter_objectives')
      .select('daily_target')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setDailyTarget(data.daily_target);
    }
  };

  const loadTodayActivities = async () => {
    setActivitiesLoading(true);
    const today = new Date();
    const start = startOfDay(today).toISOString();
    const end = endOfDay(today).toISOString();

    const { data: logsData, error } = await supabase
      .from('activity_logs')
      .select('id, type, created_at, lead_id, prospect_name, prospect_company')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading today activities:', error);
      setActivitiesLoading(false);
      return;
    }

    if (logsData && logsData.length > 0) {
      const enrichedActivities: TodayActivity[] = logsData.map(log => ({
        id: log.id,
        type: log.type as TodayActivity['type'],
        created_at: log.created_at,
        prospect_name: log.prospect_name || 'Prospect supprimé',
        prospect_company: log.prospect_company || '',
      }));

      setTodayActivities(enrichedActivities);
    } else {
      setTodayActivities([]);
    }

    setActivitiesLoading(false);
  };

  // Filtrer les prospects non archivés pour les stats
  const activeProspects = prospects.filter(p => !p.no_follow_up);
  const stats = [{
    label: "Total prospects",
    value: activeProspects.length,
    icon: Users,
    color: "from-primary to-secondary",
    glow: "glow-primary"
  }, {
    label: "À relancer aujourd'hui",
    value: todayCount,
    icon: Clock,
    color: "from-destructive to-warning",
    glow: "glow-secondary"
  }, {
    label: "En discussion",
    value: activeProspects.filter(p => p.status === "discussion" || p.status === "r1_programme").length,
    icon: TrendingUp,
    color: "from-warning to-success"
  }, {
    label: "Taux de conversion",
    value: activeProspects.length > 0 ? `${Math.round(activeProspects.filter(p => p.status === "r1_programme").length / activeProspects.length * 100)}%` : "0%",
    icon: Target,
    color: "from-secondary to-primary"
  }];
  const topProspects = [...activeProspects]
    .filter(p => p.status !== 'r1_programme') // Exclure les R1 déjà programmés
    .sort((a, b) => {
      // Sort by reminder date (soonest first)
      if (a.reminderDate && b.reminderDate) {
        const dateA = new Date(a.reminderDate).getTime();
        const dateB = new Date(b.reminderDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
      } else if (a.reminderDate) {
        return -1;
      } else if (b.reminderDate) {
        return 1;
      }

      // Then by priority (higher number = higher priority)
      return parseInt(b.priority) - parseInt(a.priority);
    }).slice(0, 5);
  return <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header notificationCount={todayCount} />

        <main className="p-6 space-y-6 animate-fade-in">
          {/* Today Activity Card */}
          <TodayActivityCard 
            activities={todayActivities}
            dailyTarget={dailyTarget}
            loading={activitiesLoading}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => <Card 
              key={index} 
              onClick={() => {
                if (stat.label === "À relancer aujourd'hui") {
                  navigate("/prospects?view=today");
                }
              }}
              className={`p-6 border-border/50 hover:border-primary/50 transition-all hover-scale cursor-pointer ${stat.glow || ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>)}
          </div>

          {/* Top Prospects */}
          <Card className="p-6 border-border/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Top 5 prospects à traiter en priorité
            </h2>
            {topProspects.length === 0 ? <p className="text-muted-foreground text-center py-8">
                Aucun prospect pour le moment. Commence par en ajouter ! 🚀
              </p> : <div className="space-y-3">
                {topProspects.map(prospect => <div key={prospect.id} className="flex items-center justify-between p-4 rounded-lg bg-card-hover border border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {prospect.fullName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">
                          {prospect.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {prospect.position} chez {prospect.company}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">
                        {prospect.reminderDate ? new Date(prospect.reminderDate).toLocaleDateString("fr-FR") : "Pas de rappel"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Relance {prospect.priority}
                      </p>
                    </div>
                  </div>)}
              </div>}
          </Card>
        </main>
      </div>
    </div>;
};
export default Dashboard;