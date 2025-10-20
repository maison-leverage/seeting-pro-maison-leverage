import { useState, useEffect } from "react";
import { Template, TEMPLATE_SEQUENCES, TARGET_TYPES, TARGET_SECTORS, TARGET_SIZES, TemplateSequence } from "@/types/template";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TemplateFormProps {
  template?: Template | null;
  open: boolean;
  onClose: () => void;
  onSave: (template: Partial<Template>) => void;
  defaultSequence?: TemplateSequence;
}

const TemplateForm = ({ template, open, onClose, onSave, defaultSequence = 1 }: TemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    sequence: defaultSequence,
    content: "",
    notes: "",
    targetTypes: [] as string[],
    targetSectors: [] as string[],
    targetSizes: [] as string[],
    tags: [] as string[],
    tagInput: "",
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        sequence: template.sequence,
        content: template.content,
        notes: template.notes,
        targetTypes: template.targetProfile?.types || [],
        targetSectors: template.targetProfile?.sectors || [],
        targetSizes: template.targetProfile?.sizes || [],
        tags: template.tags || [],
        tagInput: "",
      });
    } else {
      setFormData({
        name: "",
        sequence: defaultSequence,
        content: "",
        notes: "",
        targetTypes: [],
        targetSectors: [],
        targetSizes: [],
        tags: [],
        tagInput: "",
      });
    }
  }, [template, open, defaultSequence]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: template?.id,
      name: formData.name,
      sequence: formData.sequence,
      content: formData.content,
      notes: formData.notes,
      targetProfile: {
        types: formData.targetTypes,
        sectors: formData.targetSectors,
        sizes: formData.targetSizes,
      },
      tags: formData.tags,
    });
  };

  const handleCheckboxChange = (field: "targetTypes" | "targetSectors" | "targetSizes", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle>{template ? "Modifier le template" : "Nouveau template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du template *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="sequence">Numéro de message *</Label>
            <Select 
              value={formData.sequence.toString()} 
              onValueChange={(value) => setFormData({ ...formData, sequence: Number(value) as TemplateSequence })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {TEMPLATE_SEQUENCES.map((seq) => (
                  <SelectItem key={seq.value} value={seq.value.toString()}>
                    {seq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">
              Message
              <span className="text-xs text-muted-foreground ml-2">
                Variables disponibles: {"{prenom}"}, {"{nom}"}, {"{entreprise}"}, {"{poste}"}
              </span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Laissez vide pour remplir plus tard..."
            />
          </div>

          <div>
            <Label>Profil cible - Type</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {TARGET_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={formData.targetTypes.includes(type)}
                    onCheckedChange={() => handleCheckboxChange("targetTypes", type)}
                  />
                  <Label htmlFor={`type-${type}`} className="cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Profil cible - Secteur</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {TARGET_SECTORS.map((sector) => (
                <div key={sector} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sector-${sector}`}
                    checked={formData.targetSectors.includes(sector)}
                    onCheckedChange={() => handleCheckboxChange("targetSectors", sector)}
                  />
                  <Label htmlFor={`sector-${sector}`} className="cursor-pointer">
                    {sector}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Profil cible - Taille</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {TARGET_SIZES.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={formData.targetSizes.includes(size)}
                    onCheckedChange={() => handleCheckboxChange("targetSizes", size)}
                  />
                  <Label htmlFor={`size-${size}`} className="cursor-pointer">
                    {size}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={formData.tagInput}
                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                placeholder="Ajouter un tag..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateForm;
