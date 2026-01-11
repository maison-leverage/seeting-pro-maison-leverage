import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  type: 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';
  created_at: string;
  user_name: string;
  lead_id: string;
  prospect_name?: string;
  prospect_company?: string;
}

interface PerformanceChartProps {
  activities: ActivityLog[];
}

interface MonthlyData {
  month: string;
  monthFull: string;
  firstDMs: number;
  replies: number;
  calls: number;
  deals: number;
  replyRate: number;
}

const PerformanceChart = ({ activities }: PerformanceChartProps) => {
  const monthlyData = useMemo(() => {
    // Get last 6 months
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(now),
    });

    const data: MonthlyData[] = months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Filter activities for this month
      const monthActivities = activities.filter((a) => {
        const actDate = parseISO(a.created_at);
        return actDate >= monthStart && actDate <= monthEnd;
      });

      const firstDMs = monthActivities.filter(
        (a) => a.type === "first_dm" || a.type === "message_sent"
      ).length;
      const replies = monthActivities.filter(
        (a) => a.type === "reply_received"
      ).length;
      const calls = monthActivities.filter(
        (a) => a.type === "call_booked"
      ).length;
      const deals = monthActivities.filter(
        (a) => a.type === "deal_closed"
      ).length;

      const replyRate = firstDMs > 0 ? Math.round((replies / firstDMs) * 100) : 0;

      return {
        month: format(monthDate, "MMM", { locale: fr }),
        monthFull: format(monthDate, "MMMM yyyy", { locale: fr }),
        firstDMs,
        replies,
        calls,
        deals,
        replyRate,
      };
    });

    return data;
  }, [activities]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyData;
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="font-semibold text-foreground mb-2 capitalize">{data.monthFull}</p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-muted-foreground">1ers DM:</span>
              <span className="font-medium text-blue-600">{data.firstDMs}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-muted-foreground">Réponses:</span>
              <span className="font-medium text-yellow-600">{data.replies}</span>
              <span className="text-xs text-muted-foreground">({data.replyRate}%)</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-muted-foreground">R1 bookés:</span>
              <span className="font-medium text-green-600">{data.calls}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-muted-foreground">Deals:</span>
              <span className="font-medium text-purple-600">{data.deals}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
        <TrendingUp className="w-5 h-5 text-primary" />
        Évolution des Performances (6 derniers mois)
      </h3>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlyData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value: string) => (
                <span className="text-foreground text-sm">{value}</span>
              )}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="firstDMs"
              name="1ers DM"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="replies"
              name="Réponses"
              stroke="#eab308"
              strokeWidth={2}
              dot={{ fill: "#eab308", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#eab308", strokeWidth: 2 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="calls"
              name="R1 Bookés"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="deals"
              name="Deals Closés"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#a855f7", strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="replyRate"
              name="Taux de réponse %"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#f97316", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explanation */}
      <div className="mt-4 pt-4 border-t border-border/30 text-xs text-muted-foreground">
        <span className="inline-block mr-4">● Ligne pleine = Nombre absolu</span>
        <span className="inline-block">- - - Ligne pointillée = Pourcentage (axe droit)</span>
      </div>
    </Card>
  );
};

export default PerformanceChart;
