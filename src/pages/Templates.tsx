import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Search, Download } from "lucide-react";
import { Template, TEMPLATE_SEQUENCES, TemplateSequence } from "@/types/template";
import { exportTemplatesToCSV } from "@/utils/exportUtils";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";
import TemplateCopyModal from "@/components/templates/TemplateCopyModal";
import TemplateStatsModal from "@/components/templates/TemplateStatsModal";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTemplates } from "@/hooks/useTemplates";
import { useProspects } from "@/hooks/useProspects";

const Templates = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { templates, createTemplate, updateTemplate, deleteTemplate, isLoading: templatesLoading } = useTemplates();
  const { prospects } = useProspects();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TemplateSequence>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prospects.filter((p) => {
      if (!p.reminderDate) return false;
      const reminder = new Date(p.reminderDate);
      reminder.setHours(0, 0, 0, 0);
      return reminder <= today;
    }).length;
  }, [prospects]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter((t) =>
      t.name.toLowerCase().includes(query) ||
      t.content.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  const templatesBySequence = useMemo(() => {
    return filteredTemplates.filter((t) => t.sequence === activeTab);
  }, [filteredTemplates, activeTab]);

  const handleSaveTemplate = (templateData: Partial<Template>) => {
    if (selectedTemplate) {
      updateTemplate({ id: selectedTemplate.id, data: templateData });
    } else {
      createTemplate(templateData);
    }
    setIsFormOpen(false);
    setSelectedTemplate(null);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = (template: Template) => {
    if (!confirm("Supprimer ce template ?")) return;
    deleteTemplate(template.id);
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicate: Partial<Template> = {
      ...template,
      name: `${template.name} (copie)`,
    };
    delete duplicate.id;
    createTemplate(duplicate);
    toast({
      title: "Template dupliqué",
      description: "Le template a été dupliqué avec succès",
    });
  };

  const handleCopyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsCopyModalOpen(true);
  };

  const handleViewStats = (template: Template) => {
    setSelectedTemplate(template);
    setIsStatsModalOpen(true);
  };

  const handleCopyContent = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(selectedTemplate.content);
      toast({
        title: "Copié !",
        description: "Le contenu a été copié dans le presse-papier",
      });
      setIsCopyModalOpen(false);
    }
  };

  if (authLoading || templatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header notificationCount={todayCount} />

        <main className="p-6 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">📝 Mes Templates</h1>
              <p className="text-muted-foreground">
                {templates.length} template{templates.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => exportTemplatesToCSV(templates)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  setSelectedTemplate(null);
                  setIsFormOpen(true);
                }}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau template
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un template..."
              className="pl-10 bg-input border-border/50"
            />
          </div>

          {/* Sequence Tabs */}
          <Tabs value={activeTab.toString()} onValueChange={(v) => setActiveTab(parseInt(v) as TemplateSequence)}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2 bg-transparent h-auto p-0">
              {TEMPLATE_SEQUENCES.map((seq) => {
                const count = filteredTemplates.filter((t) => t.sequence === seq.value).length;
                return (
                  <TabsTrigger
                    key={seq.value}
                    value={seq.value.toString()}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50 hover:border-primary/50 transition-all"
                  >
                    <div className="text-center">
                      <div className="font-semibold">{seq.label}</div>
                      <div className="text-xs opacity-80">{count}</div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {TEMPLATE_SEQUENCES.map((seq) => (
              <TabsContent key={seq.value} value={seq.value.toString()} className="mt-6">
                {templatesBySequence.length === 0 ? (
                  <Card className="p-12 text-center border-border/50">
                    <p className="text-muted-foreground mb-4">
                      Aucun template pour {seq.label}
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setIsFormOpen(true);
                      }}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un template
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templatesBySequence.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onEdit={handleEditTemplate}
                        onDelete={handleDeleteTemplate}
                        onDuplicate={handleDuplicateTemplate}
                        onCopy={handleCopyTemplate}
                        onStats={handleViewStats}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>

      {/* Modals */}
      <TemplateForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={selectedTemplate || undefined}
        defaultSequence={activeTab}
      />

      {selectedTemplate && (
        <>
          <TemplateCopyModal
            open={isCopyModalOpen}
            onClose={() => setIsCopyModalOpen(false)}
            template={selectedTemplate}
            prospects={prospects}
          />

          <TemplateStatsModal
            open={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
            template={selectedTemplate}
            templates={templates}
            prospects={prospects}
            onUpdateTemplate={(updatedTemplates) => {
              // Find the updated template and save it
              const updatedTemplate = updatedTemplates.find(t => t.id === selectedTemplate.id);
              if (updatedTemplate) {
                updateTemplate({ id: updatedTemplate.id, data: updatedTemplate });
              }
            }}
            onUpdateProspects={() => {
              // Prospects are managed by the hook
            }}
          />
        </>
      )}
    </div>
  );
};

export default Templates;
