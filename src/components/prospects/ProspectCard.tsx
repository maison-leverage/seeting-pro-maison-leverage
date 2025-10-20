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

const getStatusLabel = (status: string, followUpCount: number) => {
  const baseLabels = {
    premier_message: "📩 1ᵉʳ message envoyé",
    discussion: "🗣️ En discussion",
    r1_programme: "🎯 R1 programmé",
  };
  
  const label = baseLabels[status as keyof typeof baseLabels] || status;
  return followUpCount > 0 ? `${label} (${followUpCount} relance${followUpCount > 1 ? 's' : ''})` : label;
};

const statusConfig = {
  premier_message: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  discussion: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  r1_programme: { color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const priorityConfig = {
  "2": { label: "2e relance", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "3": { label: "3e relance", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  "4": { label: "4e relance", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  "5": { label: "5e relance", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "6": { label: "6e relance", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "7": { label: "7e relance", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "8": { label: "8e relance", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  "9": { label: "9e relance", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  "10": { label: "10e relance", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const qualificationConfig = {
  loom: { label: "🎥 Loom", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  video_youtube: { label: "▶️ Vidéo Youtube", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  presentation_genspark: { label: "✨ Présentation Genspark", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  magnus_opus: { label: "💎 Magnus Opus", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

const ProspectCard = ({ prospect, onEdit, onDelete }: ProspectCardProps) => {
  const isReminderToday = () => {
    if (!prospect.reminderDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminder = new Date(prospect.reminderDate);
    reminder.setHours(0, 0, 0, 0);
    return reminder <= today;
  };

  const hasReminderToday = isReminderToday();

  return (
    <Card
      className={`p-6 border-border/50 hover:border-primary/50 transition-all hover-scale relative cursor-pointer ${
        hasReminderToday ? "border-destructive/50 glow-secondary" : ""
      }`}
      onClick={() => onEdit(prospect)}
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
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={statusConfig[prospect.status].color}>
              {getStatusLabel(prospect.status, prospect.followUpCount)}
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prospect);
              }}
              className="border-border/50 hover:border-primary hover:bg-primary/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prospect.id);
              }}
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
