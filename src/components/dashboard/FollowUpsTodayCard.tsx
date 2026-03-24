import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Prospect } from "@/types/prospect";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FollowUpsTodayCardProps {
  prospects: Prospect[];
  loading?: boolean;
}

const ADVANCED_STATUSES = ["r1_booke", "r1_fait", "r2_booke", "signe", "perdu"];
const EXCLUDED_STATUSES = [...ADVANCED_STATUSES, "discussion", "reponse", "demande_dispos"];

interface FollowUpItem {
  prospect: Prospect;
  followUpNumber: number;
  dayLabel: string;
  dueDate: Date;
  isLate: boolean;
}

const FollowUpsTodayCard = ({ prospects, loading }: FollowUpsTodayCardProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUps: FollowUpItem[] = prospects
    .filter(p => p.reminderDate && p.followUpCount < 3 && !p.no_follow_up && !EXCLUDED_STATUSES.includes(p.status))
    .map(p => {
      const dueDate = new Date(p.reminderDate!);
      dueDate.setHours(0, 0, 0, 0);
      const isDue = dueDate <= today;
      if (!isDue) return null;
      const isLate = dueDate < today;
      const followUpNumber = p.followUpCount + 1;
      const dayLabels = ['J+4', 'J+10', 'J+15'];
      const dayLabel = dayLabels[p.followUpCount] || `Relance ${followUpNumber}`;
      return { prospect: p, followUpNumber, dayLabel, dueDate, isLate };
    })
    .filter(Boolean) as FollowUpItem[];

  followUps.sort((a, b) => {
    if (a.isLate && !b.isLate) return -1;
    if (!a.isLate && b.isLate) return 1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  if (loading) {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <RotateCcw className="w-5 h-5 text-foreground" />
          Relances du jour
        </h2>
        <Badge variant="outline" className={followUps.length > 0 ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-green-100 text-green-700 border-green-300"}>
          {followUps.length} relance{followUps.length !== 1 ? 's' : ''} à faire
        </Badge>
      </div>

      {followUps.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm">Aucune relance prévue aujourd'hui 🎉</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {followUps.map((item) => (
            <div key={item.prospect.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.isLate ? 'bg-red-50 border-red-200' : 'bg-muted/50 border-border'}`}>
              <div className="flex items-center gap-3">
                {item.isLate ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                <div>
                  <span className="text-sm font-medium text-foreground">{item.prospect.fullName}</span>
                  <span className="text-xs text-muted-foreground ml-1">({item.prospect.company})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={item.isLate ? "bg-red-100 text-red-700 border-red-300" : "bg-cyan-100 text-cyan-700 border-cyan-300"}>
                  Relance {item.followUpNumber} ({item.dayLabel})
                </Badge>
                {item.isLate && (
                  <span className="text-xs text-red-500 font-medium">
                    depuis le {format(item.dueDate, "dd/MM", { locale: fr })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default FollowUpsTodayCard;
