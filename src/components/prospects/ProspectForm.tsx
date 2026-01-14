import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Prospect, ProspectStatus, ProspectPriority, ProspectQualification, ProspectHype } from "@/types/prospect";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
interface ProspectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prospect: Partial<Prospect>) => void;
  initialData?: Prospect;
}
const ProspectForm = ({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: ProspectFormProps) => {
  const [formData, setFormData] = useState<Partial<Prospect>>(initialData || {
    fullName: "",
    company: "",
    position: "",
    linkedinUrl: "",
    status: "rien",
    priority: "rien",
    qualification: "rien",
    hype: "rien",
    followUpCount: 0
  });
  const [reminderDate, setReminderDate] = useState<Date | undefined>(initialData?.reminderDate ? new Date(initialData.reminderDate) : undefined);
  const [firstMessageDate, setFirstMessageDate] = useState<Date | undefined>(initialData?.firstMessageDate ? new Date(initialData.firstMessageDate) : undefined);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData);
        setReminderDate(initialData.reminderDate ? new Date(initialData.reminderDate) : undefined);
        setFirstMessageDate(initialData.firstMessageDate ? new Date(initialData.firstMessageDate) : undefined);
      } else {
        setFormData({
          fullName: "",
          company: "",
          position: "",
          linkedinUrl: "",
          status: "rien",
          priority: "rien",
          qualification: "rien",
          hype: "rien",
          followUpCount: 0
        });
        setReminderDate(undefined);
        setFirstMessageDate(undefined);
      }
    }
  }, [open, initialData]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.company) {
      toast.error("Nom complet et entreprise sont obligatoires");
      return;
    }
    const user = JSON.parse(localStorage.getItem("crm_user") || "{}");
    const prospectData: Partial<Prospect> = {
      ...formData,
      reminderDate: reminderDate?.toISOString(),
      firstMessageDate: firstMessageDate?.toISOString(),
      assignedTo: formData.assignedTo || user.id,
      updatedAt: new Date().toISOString(),
      ...(!initialData && {
        createdAt: new Date().toISOString(),
        tags: [],
        notes: [],
        history: [{
          id: Date.now().toString(),
          action: "Création du prospect",
          details: `Créé par ${user.name}`,
          createdAt: new Date().toISOString(),
          createdBy: user.name
        }],
        score: 0,
        followUpCount: 0
      })
    };
    onSubmit(prospectData);
    onOpenChange(false);
    toast.success(initialData ? "Prospect mis à jour !" : "Prospect créé !");
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {initialData ? "Modifier le prospect" : "Nouveau prospect"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Modifiez les informations du prospect" : "Ajoutez un nouveau prospect à votre CRM"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Informations de base */}
          <div className="space-y-2">
            <Label>Nom complet *</Label>
            <Input value={formData.fullName} onChange={e => setFormData({
            ...formData,
            fullName: e.target.value
          })} placeholder="Stefan Stübing" className="bg-input border-border/50" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entreprise *</Label>
              <Input value={formData.company} onChange={e => setFormData({
              ...formData,
              company: e.target.value
            })} placeholder="Acme Inc" className="bg-input border-border/50" required />
            </div>
            <div className="space-y-2">
              <Label>Poste</Label>
              <Input value={formData.position} onChange={e => setFormData({
              ...formData,
              position: e.target.value
            })} placeholder="CEO" className="bg-input border-border/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL Profil LinkedIn</Label>
            <Input type="url" value={formData.linkedinUrl} onChange={e => setFormData({
            ...formData,
            linkedinUrl: e.target.value
          })} placeholder="https://linkedin.com/in/..." className="bg-input border-border/50" />
          </div>

          {/* Statuts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value: ProspectStatus) => setFormData({
              ...formData,
              status: value
            })}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="rien">⚪ Rien</SelectItem>
                  <SelectItem value="premier_message">📩 1ᵉʳ message envoyé</SelectItem>
                  <SelectItem value="discussion">🗣️ En discussion</SelectItem>
                  <SelectItem value="r1_programme">🎯 R1 programmé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bombe de valeur</Label>
              <Select value={formData.qualification} onValueChange={(value: ProspectQualification) => setFormData({
              ...formData,
              qualification: value
            })}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="rien">⚪ Rien</SelectItem>
                  <SelectItem value="loom">🎥 Loom</SelectItem>
                  <SelectItem value="video_youtube">▶️ Vidéo Youtube</SelectItem>
                  <SelectItem value="presentation_genspark">✨ Présentation Genspark</SelectItem>
                  <SelectItem value="magnus_opus">💎 Magnus Opus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hype</Label>
              <Select value={formData.hype} onValueChange={(value: ProspectHype) => setFormData({
              ...formData,
              hype: value
            })}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="rien">⚪ Rien</SelectItem>
                  <SelectItem value="froid">❄️ Froid</SelectItem>
                  <SelectItem value="tiede">🌤️ Tiède</SelectItem>
                  <SelectItem value="chaud">🔥 Chaud</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Affichage info relances (lecture seule) */}
          {initialData && initialData.followUpCount > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                📊 <span className="font-medium">{initialData.followUpCount}</span> relance{initialData.followUpCount > 1 ? 's' : ''} effectuée{initialData.followUpCount > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prise de contact le...</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-input border-border/50", !firstMessageDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {firstMessageDate ? format(firstMessageDate, "PPP") : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border/50" align="start">
                  <Calendar mode="single" selected={firstMessageDate} onSelect={setFirstMessageDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Recontacter le...</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-input border-border/50", !reminderDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reminderDate ? format(reminderDate, "PPP") : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border/50" align="start">
                  <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assignation */}
          

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border/50">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary">
              {initialData ? "Mettre à jour" : "Créer le prospect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export default ProspectForm;