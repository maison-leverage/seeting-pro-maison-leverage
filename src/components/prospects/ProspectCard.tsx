import { Prospect } from "@/types/prospect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  nouveau: { label: "🆕 Nouveau", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  contacte: { label: "💬 Contacté", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  discussion: { label: "🗣️ En discussion", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  qualifie: { label: "✅ Qualifié", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  gagne: { label: "🎯 Gagné", color: "bg-green-600/20 text-green-400 border-green-600/30" },
  perdu: { label: "❌ Perdu", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const priorityConfig = {
  urgent: { label: "🔴 Urgent", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  haute: { label: "🟠 Haute", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  moyenne: { label: "🟡 Moyenne", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  faible: { label: "🟢 Faible", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const qualificationConfig = {
  qualifie: { label: "✅ Qualifié", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  non_qualifie: { label: "❌ Non qualifié", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  a_evaluer: { label: "⏳ À évaluer", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  opportunites: { label: "💎 Opportunités", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const ProspectCard = ({ prospect, onEdit, onDelete }: ProspectCardProps) => {
  const isReminderToday = () => {
    if (!prospect.reminderDate) return false;
    const today = new Date().toISOString().split("T")[0];
    const reminderDay = prospect.reminderDate.split("T")[0];
    return reminderDay <= today;
  };

  const hasReminderToday = isReminderToday();

  return (
    <Card
      className={`p-6 border-border/50 hover:border-primary/50 transition-all hover-scale relative ${
        hasReminderToday ? "border-destructive/50 glow-secondary" : ""
      }`}
    >
      {/* Badge reminder */}
      {hasReminderToday && (
        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          À relancer !
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shrink-0">
          {prospect.fullName.split(" ").slice(0, 2).map(n => n[0]).join("")}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-xl font-bold mb-1">
                {prospect.fullName}
              </h3>
              <p className="text-muted-foreground text-sm">
                {prospect.position} {prospect.position && prospect.company && "chez"} {prospect.company}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary mb-1">{prospect.score}</div>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={statusConfig[prospect.status].color}>
              {statusConfig[prospect.status].label}
            </Badge>
            <Badge variant="outline" className={priorityConfig[prospect.priority].color}>
              {priorityConfig[prospect.priority].label}
            </Badge>
            <Badge variant="outline" className={qualificationConfig[prospect.qualification].color}>
              {qualificationConfig[prospect.qualification].label}
            </Badge>
          </div>

          {/* Info supplémentaire */}
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            {prospect.linkedinUrl && (
              <a
                href={prospect.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Voir le profil LinkedIn
              </a>
            )}
            {prospect.reminderDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Rappel: {new Date(prospect.reminderDate).toLocaleDateString("fr-FR")}
              </div>
            )}
            {prospect.lastContact && (
              <p>
                Dernier contact:{" "}
                {formatDistanceToNow(new Date(prospect.lastContact), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(prospect)}
              className="border-border/50 hover:border-primary hover:bg-primary/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(prospect.id)}
              className="border-border/50 hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProspectCard;
