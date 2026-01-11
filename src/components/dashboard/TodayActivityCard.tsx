import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Phone, CheckCircle, RotateCcw, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface TodayActivity {
  id: string;
  type: 'first_dm' | 'follow_up_dm' | 'reply_received' | 'call_booked' | 'deal_closed' | 'message_sent';
  created_at: string;
  prospect_name: string;
  prospect_company: string;
}

interface TodayActivityCardProps {
  activities: TodayActivity[];
  dailyTarget: number;
  loading?: boolean;
}

const TodayActivityCard = ({ activities, dailyTarget, loading }: TodayActivityCardProps) => {
  // Count only first DMs for quota (not follow-ups)
  const firstDMsToday = activities.filter(a => a.type === 'first_dm' || a.type === 'message_sent').length;
  const followUpsToday = activities.filter(a => a.type === 'follow_up_dm').length;
  const repliesToday = activities.filter(a => a.type === 'reply_received').length;
  const callsToday = activities.filter(a => a.type === 'call_booked').length;

  const progressPercent = Math.min((firstDMsToday / dailyTarget) * 100, 100);
  
  // Status badge
  const getStatusBadge = () => {
    if (firstDMsToday >= dailyTarget) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">✅ Quota atteint !</Badge>;
    }
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">🌅 Matin</Badge>;
    }
    if (hour < 17) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">⏳ En cours</Badge>;
    }
    if (firstDMsToday < dailyTarget * 0.5) {
      return <Badge className="bg-red-100 text-red-700 border-red-300">⚠️ En retard</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">📊 Presque</Badge>;
  };

  // Get DM activities sorted by time (most recent first)
  const dmActivities = activities
    .filter(a => a.type === 'first_dm' || a.type === 'message_sent' || a.type === 'follow_up_dm')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  if (loading) {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <Clock className="w-5 h-5 text-foreground" />
          Activité du Jour
        </h2>
        {getStatusBadge()}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progression quotidienne</span>
          <span className="font-bold">
            <span className={firstDMsToday >= dailyTarget ? "text-green-600" : "text-foreground"}>
              {firstDMsToday}
            </span>
            <span className="text-muted-foreground">/{dailyTarget} DM</span>
          </span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-3"
        />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
          <Send className="w-4 h-4 mx-auto mb-1 text-blue-600" />
          <div className="text-lg font-bold text-blue-700">{firstDMsToday}</div>
          <div className="text-xs text-blue-600">1ers DM</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-cyan-50 border border-cyan-200">
          <RotateCcw className="w-4 h-4 mx-auto mb-1 text-cyan-600" />
          <div className="text-lg font-bold text-cyan-700">{followUpsToday}</div>
          <div className="text-xs text-cyan-600">Relances</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-50 border border-yellow-200">
          <MessageCircle className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
          <div className="text-lg font-bold text-yellow-700">{repliesToday}</div>
          <div className="text-xs text-yellow-600">Réponses</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
          <Phone className="w-4 h-4 mx-auto mb-1 text-green-600" />
          <div className="text-lg font-bold text-green-700">{callsToday}</div>
          <div className="text-xs text-green-600">Calls</div>
        </div>
      </div>

      {/* DM list */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Prospects DM aujourd'hui
        </h3>
        {dmActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun DM envoyé aujourd'hui. C'est le moment de commencer ! 🚀
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {dmActivities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-2">
                  {activity.type === 'follow_up_dm' ? (
                    <RotateCcw className="w-3 h-3 text-cyan-600" />
                  ) : (
                    <Send className="w-3 h-3 text-blue-600" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-foreground">{activity.prospect_name}</span>
                    {activity.prospect_company && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({activity.prospect_company})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(activity.created_at), "HH:mm", { locale: fr })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TodayActivityCard;