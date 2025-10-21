import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, BarChart3, TestTube } from "lucide-react";
import { Template, TEMPLATE_CATEGORIES } from "@/types/template";
import { updateTemplateMetrics } from "@/utils/templateUtils";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";
import TemplateCopyModal from "@/components/templates/TemplateCopyModal";
import TemplateStatsModal from "@/components/templates/TemplateStatsModal";
import { toast } from "@/hooks/use-toast";

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }
    loadTemplates();
  }, [navigate]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, statusFilter]);

  const loadTemplates = () => {
    const stored = localStorage.getItem("crm_templates");
    if (stored) {
      setTemplates(JSON.parse(stored));
    }
  };

  const saveTemplates = (newTemplates: Template[]) => {
    localStorage.setItem("crm_templates", JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleSaveTemplate = (templateData: Partial<Template>) => {
    if (templateData.id) {
      const updated = templates.map((t) =>
        t.id === templateData.id
          ? updateTemplateMetrics({ ...t, ...templateData, updatedAt: new Date().toISOString() })
          : t
      );
      saveTemplates(updated);
      toast({ title: "Template modifié avec succès" });
    } else {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateData.name || "",
        category: templateData.category || "premier_contact",
        content: templateData.content || "",
        status: "actif",
        targetProfile: templateData.targetProfile || { types: [], sectors: [], sizes: [] },
        metrics: { sends: 0, responses: 0, calls: 0, responseRate: 0, callRate: 0, rating: 1 },
        tags: templateData.tags || [],
        notes: templateData.notes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageHistory: [],
      };
      saveTemplates([...templates, newTemplate]);
      toast({ title: "Template créé avec succès" });
    }
    setIsFormOpen(false);
    setSelectedTemplate(null);
  };

  const handleTrackSend = (templateId: string) => {
    const updated = templates.map((t) => {
      if (t.id === templateId) {
        return updateTemplateMetrics({
          ...t,
          metrics: { ...t.metrics, sends: t.metrics.sends + 1 },
          lastUsed: new Date().toISOString(),
        });
      }
      return t;
    });
    saveTemplates(updated);
  };

  const handleIncrementSend = (templateId: string) => {
    handleTrackSend(templateId);
    toast({ title: "Envoi enregistré" });
  };

  const handleIncrementResponse = (templateId: string) => {
    const updated = templates.map((t) => {
      if (t.id === templateId) {
        return updateTemplateMetrics({
          ...t,
          metrics: { ...t.metrics, responses: t.metrics.responses + 1 },
        });
      }
      return t;
    });
    saveTemplates(updated);
    toast({ title: "Réponse enregistrée" });
  };

  const handleIncrementCall = (templateId: string) => {
    const updated = templates.map((t) => {
      if (t.id === templateId) {
        return updateTemplateMetrics({
          ...t,
          metrics: { ...t.metrics, calls: t.metrics.calls + 1 },
        });
      }
      return t;
    });
    saveTemplates(updated);
    toast({ title: "Call enregistré" });
  };

  const handleArchive = (template: Template) => {
    const updated = templates.map((t) =>
      t.id === template.id ? { ...t, status: "archive" as const } : t
    );
    saveTemplates(updated);
    toast({ title: "Template archivé" });
  };

  const handleDelete = (template: Template) => {
    if (confirm("Supprimer ce template ?")) {
      saveTemplates(templates.filter((t) => t.id !== template.id));
      toast({ title: "Template supprimé" });
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Templates de messages
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos templates et optimisez vos performances
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/templates/analytics")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => navigate("/templates/ab-tests")}>
                <TestTube className="h-4 w-4 mr-2" />
                A/B Tests
              </Button>
              <Button onClick={() => { setSelectedTemplate(null); setIsFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un template..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="actif">✅ Actif</SelectItem>
                <SelectItem value="en_test">🧪 En test</SelectItem>
                <SelectItem value="archive">❌ Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onCopy={(t) => { setSelectedTemplate(t); setIsCopyModalOpen(true); }}
                  onEdit={(t) => { setSelectedTemplate(t); setIsFormOpen(true); }}
                  onStats={(t) => { setSelectedTemplate(t); setIsStatsModalOpen(true); }}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun template trouvé</p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier template
              </Button>
            </div>
          )}
        </main>
      </div>

      <TemplateForm
        template={selectedTemplate}
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedTemplate(null); }}
        onSave={handleSaveTemplate}
      />

      <TemplateCopyModal
        template={selectedTemplate}
        open={isCopyModalOpen}
        onClose={() => { setIsCopyModalOpen(false); setSelectedTemplate(null); }}
        onTrackSend={handleTrackSend}
      />

      <TemplateStatsModal
        template={selectedTemplate}
        open={isStatsModalOpen}
        onClose={() => { setIsStatsModalOpen(false); setSelectedTemplate(null); }}
        onIncrementSend={handleIncrementSend}
        onIncrementResponse={handleIncrementResponse}
        onIncrementCall={handleIncrementCall}
      />
    </div>
  );
};

export default Templates;
