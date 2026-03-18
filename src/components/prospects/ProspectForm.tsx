import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Prospect, ProspectStatus, ProspectSource, ProspectQualification, ProspectHype } from "@/types/prospect";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Globe } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProspectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prospect: Partial<Prospect>) => void;
  initialData?: Prospect;
}

const ProspectForm = ({ open, onOpenChange, onSubmit, initialData }: ProspectFormProps) => {
  const [formData, setFormData] = useState<Partial<Prospect>>(initialData || {
    fullName: "",
    company: "",
    position: "",
    linkedinUrl: "",
    email: "",
    websiteUrl: "",
    status: "nouveau",
    source: "outbound",
    qualification: "rien",
    hype: "rien",
    followUpCount: 0,
    proposed_slots: "",
    lost_reason: "",
  });
  const [reminderDate, setReminderDate] = useState<Date | undefined>(initialData?.reminderDate ? new Date(initialData.reminderDate) : undefined);
  const [firstMessageDate, setFirstMessageDate] = useState<Date | undefined>(initialData?.firstMessageDate ? new Date(initialData.firstMessageDate) : undefined);

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
          email: "",
          websiteUrl: "",
          status: "nouveau",
          source: "outbound",
          qualification: "rien",
          hype: "rien",
          followUpCount: 0,
          proposed_slots: "",
          lost_reason: "",
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
    if (!formData.websiteUrl) {
      toast.error("L'URL du site web est obligatoire");
      return;
    }
    // Auto-complete URL if missing protocol
    let websiteUrl = formData.websiteUrl;
    if (websiteUrl && !websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
      websiteUrl = `https://${websiteUrl}`;
    }
    if (websiteUrl && !/^https?:\/\/.+/.test(websiteUrl)) {
      toast.error("L'URL du site doit commencer par http:// ou https://");
      return;
    }
    const prospectData: Partial<Prospect> = {
      ...formData,
      websiteUrl,
      reminderDate: reminderDate?.toISOString(),
      firstMessageDate: firstMessageDate?.toISOString(),
      updatedAt: new Date().toISOString(),
      ...(!initialData && {
        createdAt: new Date().toISOString(),
        tags: [],
        notes: [],
        history: [{
          id: Date.now().toString(),
          action: "Création du prospect",
          details: "Créé via le formulaire",
          createdAt: new Date().toISOString(),
          createdBy: "user"
        }],
        followUpCount: 0
      })
    };
    onSubmit(prospectData);
    onOpenChange(false);
    toast.success(initialData ? "Prospect mis à jour !" : "Prospect créé !");
  };

  const showProposedSlots = formData.status === "demande_dispos" || formData.status === "discussion";
  const showLostReason = formData.status === "perdu";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Stefan Stübing" className="bg-input border-border/50" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entreprise *</Label>
              <Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Acme Inc" className="bg-input border-border/50" required />
            </div>
            <div className="space-y-2">
              <Label>Poste</Label>
              <Input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="CEO" className="bg-input border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL Profil LinkedIn</Label>
              <Input type="url" value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." className="bg-input border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className="bg-input border-border/50" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Site web (URL) *
            </Label>
            <Input
              type="url"
              value={formData.websiteUrl || ""}
              onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="https://www.exemple.com"
              className="bg-input border-border/50"
              required
            />
            <p className="text-xs text-muted-foreground">
              Un audit SEO & IA sera généré automatiquement à la création du prospect
            </p>
          </div>

          {/* Source + Statut + Hype */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={formData.source} onValueChange={(value: ProspectSource) => setFormData({ ...formData, source: value })}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="inbound">📥 Inbound</SelectItem>
                  <SelectItem value="visiteur_profil">👁️ Visiteur profil</SelectItem>
                  <SelectItem value="relation_dormante">💤 Relation dormante</SelectItem>
                  <SelectItem value="outbound">📤 Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value: ProspectStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="nouveau">🆕 Nouveau</SelectItem>
                  <SelectItem value="premier_dm">📩 1er DM envoyé</SelectItem>
                  <SelectItem value="relance">🔄 En relance</SelectItem>
                  <SelectItem value="reponse">💬 Réponse reçue</SelectItem>
                  <SelectItem value="discussion">🗣️ En discussion</SelectItem>
                  <SelectItem value="demande_dispos">📅 Dispos demandées</SelectItem>
                  <SelectItem value="r1_booke">🎯 R1 booké</SelectItem>
                  <SelectItem value="r1_fait">✅ R1 fait</SelectItem>
                  <SelectItem value="r2_booke">📆 R2 booké</SelectItem>
                  <SelectItem value="signe">🏆 Signé</SelectItem>
                  <SelectItem value="perdu">❌ Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hype</Label>
              <Select value={formData.hype} onValueChange={(value: ProspectHype) => setFormData({ ...formData, hype: value })}>
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

          {/* Qualification */}
          <div className="space-y-2">
            <Label>Bombe de valeur</Label>
            <Select value={formData.qualification} onValueChange={(value: ProspectQualification) => setFormData({ ...formData, qualification: value })}>
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

          {/* Conditional: Proposed slots */}
          {showProposedSlots && (
            <div className="space-y-2">
              <Label>Créneaux proposés</Label>
              <Textarea
                value={formData.proposed_slots || ""}
                onChange={e => setFormData({ ...formData, proposed_slots: e.target.value })}
                placeholder="Ex: Mardi 14h, Mercredi 10h, Jeudi 16h"
                className="bg-input border-border/50"
                rows={2}
              />
            </div>
          )}

          {/* Conditional: Lost reason */}
          {showLostReason && (
            <div className="space-y-2">
              <Label>Raison de la perte</Label>
              <Textarea
                value={formData.lost_reason || ""}
                onChange={e => setFormData({ ...formData, lost_reason: e.target.value })}
                placeholder="Ex: Pas de budget, pas intéressé, concurrent choisi..."
                className="bg-input border-border/50"
                rows={2}
              />
            </div>
          )}

          {/* Follow-up info */}
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
    </Dialog>
  );
};

export default ProspectForm;
