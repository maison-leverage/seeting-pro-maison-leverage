import { useState, useEffect } from "react";
import { Template } from "@/types/template";
import { Prospect } from "@/types/prospect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { replaceVariables } from "@/utils/templateUtils";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TemplateCopyModalProps {
  template: Template | null;
  prospects: Prospect[];
  open: boolean;
  onClose: () => void;
  onTrackSend?: (templateId: string, prospectId: string) => void;
}

const TemplateCopyModal = ({ template, prospects, open, onClose, onTrackSend }: TemplateCopyModalProps) => {
  const [variables, setVariables] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
    poste: "",
  });
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setVariables({ prenom: "", nom: "", entreprise: "", poste: "" });
      setSelectedProspectId("");
      setCopied(false);
    }
  }, [open]);

  // Auto-fill variables when prospect is selected
  useEffect(() => {
    if (selectedProspectId) {
      const prospect = prospects.find((p) => p.id === selectedProspectId);
      if (prospect) {
        const [prenom, ...nomParts] = prospect.fullName.split(" ");
        setVariables({
          prenom: prenom || "",
          nom: nomParts.join(" ") || "",
          entreprise: prospect.company || "",
          poste: prospect.position || "",
        });
      }
    }
  }, [selectedProspectId, prospects]);

  const finalMessage = template ? replaceVariables(template.content, variables) : "";

  const handleCopy = async () => {
    if (!selectedProspectId) {
      toast({
        title: "Prospect requis",
        description: "Veuillez sélectionner un prospect pour tracker l'envoi",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(finalMessage);
      setCopied(true);
      
      if (template && onTrackSend) {
        onTrackSend(template.id, selectedProspectId);
      }
      
      toast({
        title: "Copié !",
        description: "Message copié et envoi enregistré automatiquement",
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
          <div>
            <Label htmlFor="prospect">Prospect * (pour tracking automatique)</Label>
            <Select value={selectedProspectId} onValueChange={setSelectedProspectId}>
              <SelectTrigger id="prospect">
                <SelectValue placeholder="Sélectionner un prospect" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-[200px]">
                {prospects.map((prospect) => (
                  <SelectItem key={prospect.id} value={prospect.id}>
                    {prospect.fullName} - {prospect.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleCopy} disabled={copied || !selectedProspectId}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier et tracker
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
