import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Search, Download } from "lucide-react";
import { Template, TEMPLATE_SEQUENCES, TemplateSequence } from "@/types/template";
import { Prospect } from "@/types/prospect";
import { updateTemplateMetrics } from "@/utils/templateUtils";
import { exportTemplatesToCSV } from "@/utils/exportUtils";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";
import TemplateCopyModal from "@/components/templates/TemplateCopyModal";
import TemplateStatsModal from "@/components/templates/TemplateStatsModal";
import { toast } from "@/hooks/use-toast";

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TemplateSequence>(1);
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
    loadData();
  }, [navigate]);

  const loadData = () => {
    const storedTemplates = localStorage.getItem("crm_templates");
    const storedProspects = localStorage.getItem("crm_prospects");
    
    if (storedTemplates) {
      const parsed = JSON.parse(storedTemplates);
      setTemplates(migrateTemplates(parsed));
    }
    
    if (storedProspects) {
      setProspects(JSON.parse(storedProspects));
    }
  };

  // Migration des anciennes catégories vers séquences
  const migrateTemplates = (oldTemplates: any[]): Template[] => {
    return oldTemplates.map((t) => {
      // Si déjà migré (a sequence)
      if (typeof t.sequence === "number") return t;

      // Mapper anciennes catégories
      const sequenceMap: Record<string, number> = {
        premier_contact: 1,
        relance_1: 2,
        relance_2: 3,
        relance_3: 4,
        relance_4: 5,
        relance_5: 6,
        relance_6: 7,
        relance_7: 8,
        relance_8: 9,
        relance_9: 10,
        relance_10: 10,
      };

      const sequence = sequenceMap[t.category] || 1;

      return {
        id: t.id,
        name: t.name,
        sequence: sequence as TemplateSequence,
        content: t.content,
        targetProfile: t.targetProfile || { types: [], sectors: [], sizes: [] },
        metrics: t.metrics || { sends: 0, responses: 0, calls: 0, responseRate: 0, callRate: 0, rating: 1 },
        tags: t.tags || [],
        notes: t.notes || "",
        lastUsed: t.lastUsed,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        usageHistory: t.usageHistory || [],
      };
    });
  };

  const saveTemplates = (newTemplates: Template[]) => {
    localStorage.setItem("crm_templates", JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const saveProspects = (newProspects: Prospect[]) => {
    localStorage.setItem("crm_prospects", JSON.stringify(newProspects));
    setProspects(newProspects);
  };

  const getTemplatesBySequence = (sequence: TemplateSequence) => {
    return templates
      .filter((t) => t.sequence === sequence)
      .filter(
        (t) =>
          searchQuery === "" ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const getSequenceStats = (sequence: TemplateSequence) => {
    const seqTemplates = templates.filter((t) => t.sequence === sequence);
    const totalSends = seqTemplates.reduce((sum, t) => sum + t.metrics.sends, 0);
    const totalResponses = seqTemplates.reduce((sum, t) => sum + t.metrics.responses, 0);
    const totalCalls = seqTemplates.reduce((sum, t) => sum + t.metrics.calls, 0);
    
    const avgResponseRate = totalSends > 0 ? (totalResponses / totalSends) * 100 : 0;
    const avgCallRate = totalResponses > 0 ? (totalCalls / totalResponses) * 100 : 0;

    const bestTemplate = seqTemplates
      .filter((t) => t.metrics.sends >= 5)
      .sort((a, b) => {
        const scoreA = a.metrics.responseRate * 0.5 + a.metrics.callRate * 0.5;
        const scoreB = b.metrics.responseRate * 0.5 + b.metrics.callRate * 0.5;
        return scoreB - scoreA;
      })[0];

    return { totalSends, avgResponseRate, avgCallRate, bestTemplate };
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
        sequence: templateData.sequence || activeTab,
        content: templateData.content || "",
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

  const handleTrackSend = (templateId: string, prospectId: string) => {
    const template = templates.find((t) => t.id === templateId);
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!template || !prospect) return;

    // Update template
    const updatedTemplates = templates.map((t) => {
      if (t.id === templateId) {
        return updateTemplateMetrics({
          ...t,
          metrics: { ...t.metrics, sends: t.metrics.sends + 1 },
          lastUsed: new Date().toISOString(),
          usageHistory: [
            ...(t.usageHistory || []),
            {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              prospectId: prospect.id,
              prospectName: prospect.fullName,
              userId: "current_user",
              userName: "Utilisateur",
              hasResponse: false,
              hasCall: false,
            },
          ],
        });
      }
      return t;
    });
    saveTemplates(updatedTemplates);

    // Update prospect
    const updatedProspects = prospects.map((p) => {
      if (p.id === prospectId) {
        return {
          ...p,
          templateUsage: [
            ...(p.templateUsage || []),
            {
              sequence: template.sequence,
              templateId: template.id,
              templateName: template.name,
              sentAt: new Date().toISOString(),
            },
          ],
        };
      }
      return p;
    });
    saveProspects(updatedProspects);
  };

  const handleDelete = (template: Template) => {
    if (confirm("Supprimer ce template ?")) {
      saveTemplates(templates.filter((t) => t.id !== template.id));
      toast({ title: "Template supprimé" });
    }
  };

  const handleDuplicate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (copie)`,
      metrics: {
        sends: 0,
        responses: 0,
        calls: 0,
        responseRate: 0,
        callRate: 0,
        rating: 1,
      },
      usageHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    saveTemplates([...templates, duplicated]);
    toast({ title: "Template dupliqué", description: "Tu peux maintenant le modifier" });
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
                Gérez vos séquences de messages par numéro
              </p>
            </div>
            <div className="flex gap-2">
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
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un template..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs value={activeTab.toString()} onValueChange={(v) => setActiveTab(Number(v) as TemplateSequence)}>
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {TEMPLATE_SEQUENCES.map((seq) => {
                const count = getTemplatesBySequence(seq.value).length;
                return (
                  <TabsTrigger key={seq.value} value={seq.value.toString()} className="flex gap-2">
                    {seq.label}
                    {count > 0 && (
                      <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {TEMPLATE_SEQUENCES.map((seq) => {
              const seqTemplates = getTemplatesBySequence(seq.value);
              const stats = getSequenceStats(seq.value);

              return (
                <TabsContent key={seq.value} value={seq.value.toString()} className="space-y-4">
                  {stats.totalSends > 0 && (
                    <Card className="p-4 bg-card/50 border-border/50">
                      <h3 className="font-semibold mb-2">📊 Performance globale - {seq.label}</h3>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Envois totaux</div>
                          <div className="text-2xl font-bold">{stats.totalSends}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Taux de réponse moyen</div>
                          <div className="text-2xl font-bold text-blue-400">
                            {stats.avgResponseRate.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Taux de calls moyen</div>
                          <div className="text-2xl font-bold text-green-400">
                            {stats.avgCallRate.toFixed(1)}%
                          </div>
                        </div>
                        {stats.bestTemplate && (
                          <div>
                            <div className="text-muted-foreground">🏆 Meilleur template</div>
                            <div className="font-semibold truncate">{stats.bestTemplate.name}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {seqTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {seqTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onCopy={(t) => {
                            setSelectedTemplate(t);
                            setIsCopyModalOpen(true);
                          }}
                          onEdit={(t) => {
                            setSelectedTemplate(t);
                            setIsFormOpen(true);
                          }}
                          onStats={(t) => {
                            setSelectedTemplate(t);
                            setIsStatsModalOpen(true);
                          }}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Aucun template pour {seq.label.toLowerCase()}</p>
                      <Button
                        className="mt-4"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setIsFormOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un template
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </main>
      </div>

      <TemplateForm
        template={selectedTemplate}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleSaveTemplate}
        defaultSequence={activeTab}
      />

      <TemplateCopyModal
        template={selectedTemplate}
        prospects={prospects}
        open={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          setSelectedTemplate(null);
        }}
        onTrackSend={handleTrackSend}
      />

      <TemplateStatsModal
        template={selectedTemplate}
        open={isStatsModalOpen}
        onClose={() => {
          setIsStatsModalOpen(false);
          setSelectedTemplate(null);
        }}
        templates={templates}
        prospects={prospects}
        onUpdateTemplate={saveTemplates}
        onUpdateProspects={saveProspects}
      />
    </div>
  );
};

export default Templates;
