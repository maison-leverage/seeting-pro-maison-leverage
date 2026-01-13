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
import { CalendarDays } from "lucide-react";
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
}: DailyBreakdownTableProps) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

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
    
    const isToday = isSameDay(day, new Date());
    const hasActivity = firstDMs > 0 || followUps > 0 || replies > 0 || calls > 0 || deals > 0;

    return {
      date: day,
      firstDMs,
      followUps,
      replies,
      calls,
      deals,
      isToday,
      hasActivity
    };
  });

  // Only show days with activity, reversed (most recent first)
  const daysWithActivity = dailyStats.filter(day => day.hasActivity).reverse();

  // Calculate totals
  const totals = daysWithActivity.reduce((acc, day) => ({
    firstDMs: acc.firstDMs + day.firstDMs,
    followUps: acc.followUps + day.followUps,
    replies: acc.replies + day.replies,
    calls: acc.calls + day.calls,
    deals: acc.deals + day.deals,
  }), { firstDMs: 0, followUps: 0, replies: 0, calls: 0, deals: 0 });

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <CalendarDays className="h-5 w-5 text-foreground" />
        Détail par jour
      </h2>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jour</TableHead>
              <TableHead className="text-center">1ers DM</TableHead>
              <TableHead className="text-center">Relances</TableHead>
              <TableHead className="text-center">Réponses</TableHead>
              <TableHead className="text-center">Calls</TableHead>
              <TableHead className="text-center">Deals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daysWithActivity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune activité sur cette période
                </TableCell>
              </TableRow>
            ) : (
              daysWithActivity.map((day) => (
                <TableRow 
                  key={day.date.toISOString()}
                  className={day.isToday ? 'bg-primary/5' : ''}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className={day.isToday ? 'text-foreground font-bold' : 'text-foreground'}>
                        {format(day.date, "EEEE dd MMMM", { locale: fr })}
                      </span>
                      {day.isToday && (
                        <Badge variant="outline" className="text-xs">Aujourd'hui</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-blue-600">{day.firstDMs}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-cyan-600">{day.followUps}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-yellow-600">{day.replies}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-green-600">{day.calls}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-purple-600">{day.deals}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
            {/* Total row */}
            {daysWithActivity.length > 0 && (
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell className="font-bold text-foreground">TOTAL</TableCell>
                <TableCell className="text-center text-blue-600">{totals.firstDMs}</TableCell>
                <TableCell className="text-center text-cyan-600">{totals.followUps}</TableCell>
                <TableCell className="text-center text-yellow-600">{totals.replies}</TableCell>
                <TableCell className="text-center text-green-600">{totals.calls}</TableCell>
                <TableCell className="text-center text-purple-600">{totals.deals}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default DailyBreakdownTable;
