import { Template } from "@/types/template";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TemplateStatsModalProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onIncrementSend: (templateId: string) => void;
  onIncrementResponse: (templateId: string) => void;
  onIncrementCall: (templateId: string) => void;
}

const TemplateStatsModal = ({
  template,
  open,
  onClose,
  onIncrementSend,
  onIncrementResponse,
  onIncrementCall,
}: TemplateStatsModalProps) => {
  if (!template) return null;

  const stars = "⭐".repeat(template.metrics.rating);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle>Statistiques : {template.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50 border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Envois</div>
              <div className="text-3xl font-bold">{template.metrics.sends}</div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => onIncrementSend(template.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Envoi
              </Button>
            </Card>
            <Card className="p-4 bg-card/50 border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Réponses</div>
              <div className="text-3xl font-bold text-blue-400">
                {template.metrics.responses}
                <span className="text-sm ml-2">({template.metrics.responseRate}%)</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => onIncrementResponse(template.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Réponse
              </Button>
            </Card>
            <Card className="p-4 bg-card/50 border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Calls bookés</div>
              <div className="text-3xl font-bold text-green-400">
                {template.metrics.calls}
                <span className="text-sm ml-2">({template.metrics.callRate}%)</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => onIncrementCall(template.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Call
              </Button>
            </Card>
          </div>

          <Card className="p-4 bg-card/50 border-border/50">
            <div className="text-lg font-semibold mb-2">Note globale</div>
            <div className="text-3xl">{stars}</div>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-3">Historique des utilisations</h3>
            {template.usageHistory && template.usageHistory.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {template.usageHistory.map((usage) => (
                  <Card key={usage.id} className="p-3 bg-card/30 border-border/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{usage.prospectName}</div>
                        <div className="text-sm text-muted-foreground">
                          Par {usage.userName} • {format(new Date(usage.date), "d MMM yyyy à HH:mm", { locale: fr })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {usage.hasResponse && (
                          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Réponse</span>
                        )}
                        {usage.hasCall && (
                          <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">Call</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Aucune utilisation enregistrée
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateStatsModal;
