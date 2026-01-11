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
import { CalendarDays, CheckCircle, XCircle } from "lucide-react";
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
      quotaReached
    };
  });

  // Calculate totals
  const totals = dailyStats.reduce((acc, day) => ({
    firstDMs: acc.firstDMs + day.firstDMs,
    followUps: acc.followUps + day.followUps,
    replies: acc.replies + day.replies,
    calls: acc.calls + day.calls,
    deals: acc.deals + day.deals,
    workDays: acc.workDays + (day.isWorkDay && !day.isFuture ? 1 : 0),
    quotasMet: acc.quotasMet + (day.isWorkDay && !day.isFuture && day.quotaReached ? 1 : 0)
  }), { firstDMs: 0, followUps: 0, replies: 0, calls: 0, deals: 0, workDays: 0, quotasMet: 0 });

  const expectedDMs = totals.workDays * dailyTarget;
  const difference = totals.firstDMs - expectedDMs;

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <CalendarDays className="h-5 w-5 text-foreground" />
        Détail par jour
      </h2>

      {/* Summary */}
      <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totals.firstDMs}</div>
            <div className="text-xs text-muted-foreground">1ers DM envoyés</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">/{expectedDMs}</div>
            <div className="text-xs text-muted-foreground">Objectif ({totals.workDays}j × {dailyTarget})</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {difference >= 0 ? '+' : ''}{difference}
            </div>
            <div className="text-xs text-muted-foreground">Différence</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{totals.quotasMet}/{totals.workDays}</div>
            <div className="text-xs text-muted-foreground">Quotas atteints</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jour</TableHead>
              <TableHead className="text-center">1ers DM</TableHead>
              <TableHead className="text-center">Relances</TableHead>
              <TableHead className="text-center">Réponses</TableHead>
              <TableHead className="text-center">R1</TableHead>
              <TableHead className="text-center">Quota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyStats.map((day) => (
              <TableRow 
                key={day.date.toISOString()}
                className={`
                  ${!day.isWorkDay ? 'opacity-50 bg-muted/20' : ''}
                  ${day.isToday ? 'bg-primary/5 border-primary/30' : ''}
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
                  <span className={`font-bold ${day.firstDMs >= dailyTarget ? 'text-green-600' : 'text-blue-600'}`}>
                    {day.firstDMs}
                  </span>
                </TableCell>
                <TableCell className="text-center text-cyan-600 font-medium">{day.followUps}</TableCell>
                <TableCell className="text-center text-yellow-600 font-medium">{day.replies}</TableCell>
                <TableCell className="text-center text-green-600 font-medium">{day.calls}</TableCell>
                <TableCell className="text-center">
                  {day.isFuture ? (
                    <span className="text-muted-foreground">-</span>
                  ) : !day.isWorkDay ? (
                    <span className="text-muted-foreground text-xs">Repos</span>
                  ) : day.quotaReached ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
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
        </div>
      </div>
    </Card>
  );
};

export default DailyBreakdownTable;