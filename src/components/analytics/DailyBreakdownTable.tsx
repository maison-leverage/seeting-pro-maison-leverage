import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { format, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  type: 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';
  created_at: string;
}

interface DailyBreakdownTableProps {
  activities: ActivityLog[];
  startDate: Date;
  endDate: Date;
  dailyTarget: number;
  workDays: string[];
}

const DailyBreakdownTable = ({ 
  activities, 
  startDate, 
  endDate, 
  dailyTarget,
  workDays 
}: DailyBreakdownTableProps) => {
  const [showEmptyDays, setShowEmptyDays] = useState(false);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
  const workDayNumbers = workDays.map(day => {
    const map: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return map[day.toLowerCase()] ?? -1;
  });

  // Calculate daily stats
  const dailyStats = days.map(day => {
    const dayActivities = activities.filter(a => 
      isSameDay(parseISO(a.created_at), day)
    );

    const firstDMs = dayActivities.filter(a => a.type === 'first_dm' || a.type === 'message_sent').length;
    const followUps = dayActivities.filter(a => a.type === 'follow_up_dm').length;
    const replies = dayActivities.filter(a => a.type === 'reply_received').length;
    const calls = dayActivities.filter(a => a.type === 'call_booked').length;
    const deals = dayActivities.filter(a => a.type === 'deal_closed').length;
    
    const isWorkDay = workDayNumbers.includes(day.getDay());
    const isToday = isSameDay(day, new Date());
    const isFuture = day > new Date();
    const hasActivity = firstDMs > 0 || followUps > 0 || replies > 0 || calls > 0 || deals > 0;
    const quotaReached = firstDMs >= dailyTarget;

    return {
      date: day,
      firstDMs,
      followUps,
      replies,
      calls,
      deals,
      isWorkDay,
      isToday,
      isFuture,
      hasActivity,
      quotaReached
    };
  });

  // Filter to only show days with activity (unless showEmptyDays is true)
  const displayedStats = showEmptyDays 
    ? dailyStats 
    : dailyStats.filter(day => day.hasActivity || day.isToday);

  // Count days with activity for accurate metrics
  const daysWithActivity = dailyStats.filter(day => day.hasActivity);
  const workDaysWithActivity = daysWithActivity.filter(day => day.isWorkDay);

  // Calculate totals based on days with activity only
  const totals = dailyStats.reduce((acc, day) => ({
    firstDMs: acc.firstDMs + day.firstDMs,
    followUps: acc.followUps + day.followUps,
    replies: acc.replies + day.replies,
    calls: acc.calls + day.calls,
    deals: acc.deals + day.deals,
  }), { firstDMs: 0, followUps: 0, replies: 0, calls: 0, deals: 0 });

  // Count quotas met only for days with activity
  const quotasMet = workDaysWithActivity.filter(day => day.quotaReached).length;
  const totalActiveDays = workDaysWithActivity.length;

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays className="h-5 w-5 text-foreground" />
          Détail par jour
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmptyDays(!showEmptyDays)}
          className="text-xs"
        >
          {showEmptyDays ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Masquer jours vides
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Afficher tous les jours
            </>
          )}
        </Button>
      </div>

      {/* Summary - simplified and accurate */}
      <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totals.firstDMs}</div>
            <div className="text-xs text-muted-foreground">1ers DM</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-600">{totals.followUps}</div>
            <div className="text-xs text-muted-foreground">Relances</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{totals.replies}</div>
            <div className="text-xs text-muted-foreground">Réponses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{totals.calls}</div>
            <div className="text-xs text-muted-foreground">R1 bookés</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{totals.deals}</div>
            <div className="text-xs text-muted-foreground">Deals closés</div>
          </div>
        </div>
        
        {/* Quota info - only if there are active days */}
        {totalActiveDays > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Quota ({dailyTarget}/jour) atteint : 
            </span>
            <span className={`font-bold ${quotasMet === totalActiveDays ? 'text-green-600' : quotasMet > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {quotasMet}/{totalActiveDays} jours travaillés
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jour</TableHead>
              <TableHead className="text-center">1ers DM</TableHead>
              <TableHead className="text-center">Relances</TableHead>
              <TableHead className="text-center">Réponses</TableHead>
              <TableHead className="text-center">R1</TableHead>
              <TableHead className="text-center">Deals</TableHead>
              <TableHead className="text-center">Quota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune activité sur cette période
                </TableCell>
              </TableRow>
            ) : (
              displayedStats.map((day) => (
                <TableRow 
                  key={day.date.toISOString()}
                  className={`
                    ${!day.isWorkDay ? 'opacity-50 bg-muted/20' : ''}
                    ${day.isToday ? 'bg-primary/5 border-primary/30' : ''}
                    ${!day.hasActivity && !day.isToday ? 'opacity-40' : ''}
                  `}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className={day.isToday ? 'text-foreground font-bold' : 'text-foreground'}>
                        {format(day.date, "EEE dd MMM", { locale: fr })}
                      </span>
                      {day.isToday && (
                        <Badge variant="outline" className="text-xs">Aujourd'hui</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${day.firstDMs >= dailyTarget ? 'text-green-600' : day.firstDMs > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {day.firstDMs || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={day.followUps > 0 ? 'text-cyan-600 font-medium' : 'text-muted-foreground'}>
                      {day.followUps || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={day.replies > 0 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
                      {day.replies || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={day.calls > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {day.calls || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={day.deals > 0 ? 'text-purple-600 font-bold' : 'text-muted-foreground'}>
                      {day.deals || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {day.isFuture ? (
                      <span className="text-muted-foreground">-</span>
                    ) : !day.isWorkDay ? (
                      <span className="text-muted-foreground text-xs">Repos</span>
                    ) : !day.hasActivity ? (
                      <span className="text-muted-foreground text-xs">-</span>
                    ) : day.quotaReached ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Funnel summary */}
      <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Funnel de la période</h3>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="font-bold text-blue-600">{totals.firstDMs} DM</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-yellow-600">{totals.replies} réponses</span>
          <span className="text-xs text-muted-foreground">
            ({totals.firstDMs > 0 ? ((totals.replies / totals.firstDMs) * 100).toFixed(1) : 0}%)
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-green-600">{totals.calls} R1</span>
          <span className="text-xs text-muted-foreground">
            ({totals.replies > 0 ? ((totals.calls / totals.replies) * 100).toFixed(1) : 0}%)
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-purple-600">{totals.deals} deals</span>
          <span className="text-xs text-muted-foreground">
            ({totals.calls > 0 ? ((totals.deals / totals.calls) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      </div>
    </Card>
  );
};

export default DailyBreakdownTable;
