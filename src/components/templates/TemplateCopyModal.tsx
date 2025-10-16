import { useState, useEffect } from "react";
import { Template } from "@/types/template";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { replaceVariables } from "@/utils/templateUtils";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TemplateCopyModalProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onTrackSend?: (templateId: string) => void;
}

const TemplateCopyModal = ({ template, open, onClose, onTrackSend }: TemplateCopyModalProps) => {
  const [variables, setVariables] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
    poste: "",
  });
  const [trackSend, setTrackSend] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setVariables({ prenom: "", nom: "", entreprise: "", poste: "" });
      setTrackSend(true);
      setCopied(false);
    }
  }, [open]);

  const finalMessage = template ? replaceVariables(template.content, variables) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalMessage);
      setCopied(true);
      if (trackSend && template && onTrackSend) {
        onTrackSend(template.id);
      }
      toast({
        title: "Copié !",
        description: trackSend ? "Message copié et envoi enregistré" : "Message copié",
      });
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le message",
        variant: "destructive",
      });
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border-border">
        <DialogHeader>
          <DialogTitle>Copier le template : {template.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={variables.prenom}
                onChange={(e) => setVariables({ ...variables, prenom: e.target.value })}
                placeholder="Prénom du prospect"
              />
            </div>
            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={variables.nom}
                onChange={(e) => setVariables({ ...variables, nom: e.target.value })}
                placeholder="Nom du prospect"
              />
            </div>
            <div>
              <Label htmlFor="entreprise">Entreprise</Label>
              <Input
                id="entreprise"
                value={variables.entreprise}
                onChange={(e) => setVariables({ ...variables, entreprise: e.target.value })}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <Label htmlFor="poste">Poste</Label>
              <Input
                id="poste"
                value={variables.poste}
                onChange={(e) => setVariables({ ...variables, poste: e.target.value })}
                placeholder="Poste du prospect"
              />
            </div>
          </div>

          <div>
            <Label>Aperçu du message :</Label>
            <div className="mt-2 p-4 border border-border rounded-md bg-card/50 min-h-[150px] whitespace-pre-wrap">
              {finalMessage || template.content}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="track" checked={trackSend} onCheckedChange={(checked) => setTrackSend(checked as boolean)} />
            <Label htmlFor="track" className="cursor-pointer">
              Enregistrer cet envoi (incrémente le compteur)
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleCopy} disabled={copied}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier dans le presse-papier
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateCopyModal;
