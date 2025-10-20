import { Prospect } from "@/types/prospect";
import { Template } from "@/types/template";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, CheckCircle, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { updateTemplateMetrics, suggestTemplatesForProspect } from "@/utils/templateUtils";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  templates?: Template[];
  onUpdateTemplates?: (templates: Template[]) => void;
  onUpdateProspect?: (prospect: Prospect) => void;
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

const hypeConfig = {
  froid: { label: "❄️ Froid", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  tiede: { label: "🌤️ Tiède", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  chaud: { label: "🔥 Chaud", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const ProspectCard = ({ prospect, onEdit, onDelete, templates = [], onUpdateTemplates, onUpdateProspect }: ProspectCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const isReminderToday = () => {
    if (!prospect.reminderDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminder = new Date(prospect.reminderDate);
    reminder.setHours(0, 0, 0, 0);
    return reminder <= today;
  };

  const hasReminderToday = isReminderToday();

  // Générer la timeline
  const timeline = [
    { date: prospect.createdAt, icon: "🆕", label: "Prospect ajouté" },
    ...(prospect.templateUsage || []).map((t) => ({
      date: t.sentAt,
      icon: "📧",
      label: `Message ${t.sequence} envoyé : ${t.templateName}`,
    })),
    ...(prospect.history || []).map((h) => ({
      date: h.createdAt,
      icon: "📝",
      label: h.details,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Suggestions de templates
  const suggestedTemplates = suggestTemplatesForProspect(prospect, templates);

  const handleResponse = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!prospect.templateUsage || prospect.templateUsage.length === 0) {
      toast({ title: "Aucun template envoyé", description: "Impossible d'enregistrer une réponse", variant: "destructive" });
      return;
    }

    const lastTemplate = prospect.templateUsage[prospect.templateUsage.length - 1];
    if (templates && onUpdateTemplates) {
      const updated = templates.map((t) => {
        if (t.id === lastTemplate.templateId) {
          return updateTemplateMetrics({
            ...t,
            metrics: { ...t.metrics, responses: t.metrics.responses + 1 },
          });
        }
        return t;
      });
      onUpdateTemplates(updated);
    }

    if (onUpdateProspect) {
      onUpdateProspect({ ...prospect, status: "discussion" });
    }

    toast({ title: "Réponse enregistrée", description: `Template "${lastTemplate.templateName}" crédité` });
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!prospect.templateUsage || prospect.templateUsage.length === 0) {
      toast({ title: "Aucun template envoyé", description: "Impossible d'enregistrer un R1", variant: "destructive" });
      return;
    }

    const lastTemplate = prospect.templateUsage[prospect.templateUsage.length - 1];
    if (templates && onUpdateTemplates) {
      const updated = templates.map((t) => {
        if (t.id === lastTemplate.templateId) {
          return updateTemplateMetrics({
            ...t,
            metrics: { ...t.metrics, calls: t.metrics.calls + 1 },
          });
        }
        return t;
      });
      onUpdateTemplates(updated);
    }

    if (onUpdateProspect) {
      onUpdateProspect({ ...prospect, status: "r1_programme" });
    }

    toast({ title: "R1 enregistré", description: `Template "${lastTemplate.templateName}" crédité` });
  };

  return (
    <Card
      className={`p-4 border-border/50 hover:border-primary/50 transition-all hover-scale relative ${
        hasReminderToday ? "border-destructive/50 glow-secondary" : ""
      }`}
    >
      {hasReminderToday && (
        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          À relancer !
        </div>
      )}

      <div 
        className="flex items-center gap-4 justify-between cursor-pointer"
        onClick={() => onEdit(prospect)}
      >
        <div className="flex-shrink-0 min-w-0">
          <h3 className="text-lg font-bold truncate">
            {prospect.fullName}
          </h3>
          <p className="text-muted-foreground text-sm truncate">
            {prospect.position} {prospect.position && prospect.company && "chez"} {prospect.company}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Badge variant="outline" className={statusConfig[prospect.status].color}>
            {getStatusLabel(prospect.status, prospect.followUpCount)}
          </Badge>
          <Badge variant="outline" className={priorityConfig[prospect.priority].color}>
            {priorityConfig[prospect.priority].label}
          </Badge>
          <Badge variant="outline" className={qualificationConfig[prospect.qualification].color}>
            {qualificationConfig[prospect.qualification].label}
          </Badge>
          <Badge variant="outline" className={hypeConfig[prospect.hype].color}>
            {hypeConfig[prospect.hype].label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {prospect.reminderDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {new Date(prospect.reminderDate).toLocaleDateString("fr-FR")}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResponse}
              className="border-border/50 hover:border-blue-500 hover:bg-blue-500/10"
              title="Marquer comme ayant répondu"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCall}
              className="border-border/50 hover:border-green-500 hover:bg-green-500/10"
              title="Marquer R1 programmé"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prospect);
              }}
              className="border-border/50 hover:border-primary hover:bg-primary/10"
            >
              <Edit className="w-4 h-4" />
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
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Timeline/Suggestions */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="mt-3 w-full"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4 mr-2" />
            Masquer l'historique
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-2" />
            Voir l'historique ({timeline.length})
          </>
        )}
      </Button>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Templates suggérés */}
          {suggestedTemplates.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                📌 Templates suggérés pour le prochain message
              </h4>
              <div className="space-y-2">
                {suggestedTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 border rounded bg-card/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.metrics.callRate.toFixed(1)}% calls | {t.metrics.sends} envois
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({ title: "Utilise le bouton 'Copier' sur le template" });
                      }}
                    >
                      →
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              📅 Historique
            </h4>
            <div className="space-y-3">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProspectCard;
