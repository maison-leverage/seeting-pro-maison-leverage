import { Template, TEMPLATE_SEQUENCES } from "@/types/template";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Edit, BarChart3, MoreVertical } from "lucide-react";
import { getSequenceColor, getTemplatePreview, getStatisticalConfidence } from "@/utils/templateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateCardProps {
  template: Template;
  onCopy: (template: Template) => void;
  onEdit: (template: Template) => void;
  onStats: (template: Template) => void;
  onDelete: (template: Template) => void;
}

const TemplateCard = ({
  template,
  onCopy,
  onEdit,
  onStats,
  onDelete,
}: TemplateCardProps) => {
  const sequenceInfo = TEMPLATE_SEQUENCES.find((s) => s.value === template.sequence);
  const stars = "⭐".repeat(template.metrics.rating);
  const confidence = getStatisticalConfidence(template.metrics.sends);

  return (
    <Card className="p-4 hover:shadow-glow transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in group">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getSequenceColor(template.sequence)} border`}>
                {sequenceInfo?.label}
              </Badge>
              <Badge variant={confidence.variant} className={confidence.color}>
                {confidence.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStats(template)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir les stats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-yellow-500">{stars}</span>
            <Badge variant="outline" className="text-xs">
              📊 {template.metrics.sends} envois
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Réponse:</span>
              <span className="font-semibold text-blue-400">{template.metrics.responseRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Call:</span>
              <span className="font-semibold text-green-400">{template.metrics.callRate}%</span>
            </div>
          </div>
        </div>

        {template.targetProfile && template.targetProfile.types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.targetProfile.types.slice(0, 2).map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
            {template.targetProfile.types.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{template.targetProfile.types.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground italic line-clamp-2">
          {getTemplatePreview(template.content || "Aucun contenu")}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy(template)}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copier
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(template)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStats(template)}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;
