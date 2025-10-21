import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProspectForm from "@/components/prospects/ProspectForm";
import ProspectCard from "@/components/prospects/ProspectCard";
import { Prospect } from "@/types/prospect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download } from "lucide-react";
import { exportProspectsToCSV } from "@/utils/exportUtils";
import { useAuth } from "@/hooks/useAuth";
import { useProspects } from "@/hooks/useProspects";
import { useTemplates } from "@/hooks/useTemplates";

const Prospects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";
  const { user, loading: authLoading } = useAuth();
  const { prospects, createProspect, updateProspect, deleteProspect, isLoading: prospectsLoading } = useProspects();
  const { templates } = useTemplates();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const shouldOpenForm = searchParams.get("new");
    if (shouldOpenForm === "true" && !formOpen) {
      setEditingProspect(undefined);
      setFormOpen(true);
      const timer = setTimeout(() => {
        navigate("/prospects?view=" + view, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, view, formOpen]);

  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];

    // View filters
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    switch (view) {
      case "today":
        filtered = filtered.filter((p) => {
          if (!p.reminderDate) return false;
          const reminder = new Date(p.reminderDate);
          reminder.setHours(0, 0, 0, 0);
          return reminder <= todayDate;
        });
        break;
      case "hot":
        filtered = filtered.filter((p) => p.hype === "chaud");
        break;
      case "refused":
        filtered = filtered.filter((p) => parseInt(p.priority) >= 8);
        break;
      default:
        break;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.fullName || "").toLowerCase().includes(query) ||
          (p.company || "").toLowerCase().includes(query) ||
          (p.position || "").toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((p) => p.priority === priorityFilter);
    }

    // Sort by reminder date (soonest first), then by priority (highest first)
    filtered.sort((a, b) => {
      if (a.reminderDate && b.reminderDate) {
        const dateA = new Date(a.reminderDate).getTime();
        const dateB = new Date(b.reminderDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
      } else if (a.reminderDate) {
        return -1;
      } else if (b.reminderDate) {
        return 1;
      }
      
      return parseInt(b.priority) - parseInt(a.priority);
    });

    return filtered;
  }, [prospects, view, searchQuery, statusFilter, priorityFilter]);

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

  const handleSubmit = (prospectData: Partial<Prospect>) => {
    if (editingProspect) {
      updateProspect({ id: editingProspect.id, data: prospectData });
    } else {
      createProspect(prospectData);
    }
    setFormOpen(false);
    setEditingProspect(undefined);
  };

  const handleEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    deleteProspect(id);
  };

  const getViewTitle = () => {
    switch (view) {
      case "today":
        return "📌 À relancer aujourd'hui";
      case "hot":
        return "🔥 Prospects chauds";
      case "waiting":
        return "⏰ En attente de réponse";
      case "refused":
        return "❌ Refus";
      default:
        return "📊 Tous les prospects";
    }
  };

  if (authLoading || prospectsLoading) {
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
        <Header
          onNewProspect={() => {
            setEditingProspect(undefined);
            setFormOpen(true);
          }}
          notificationCount={todayCount}
        />

        <main className="p-6 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{getViewTitle()}</h1>
              <p className="text-muted-foreground">
                {filteredProspects.length} prospect{filteredProspects.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => exportProspectsToCSV(prospects)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un prospect..."
                  className="pl-10 bg-input border-border/50"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-input border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="premier_message">📩 1ᵉʳ message envoyé</SelectItem>
                <SelectItem value="discussion">🗣️ En discussion</SelectItem>
                <SelectItem value="r1_programme">🎯 R1 programmé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[200px] bg-input border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Relances" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="all">Toutes relances</SelectItem>
                <SelectItem value="2">2e relance</SelectItem>
                <SelectItem value="3">3e relance</SelectItem>
                <SelectItem value="4">4e relance</SelectItem>
                <SelectItem value="5">5e relance</SelectItem>
                <SelectItem value="6">6e relance</SelectItem>
                <SelectItem value="7">7e relance</SelectItem>
                <SelectItem value="8">8e relance</SelectItem>
                <SelectItem value="9">9e relance</SelectItem>
                <SelectItem value="10">10e relance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prospects list */}
          {filteredProspects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                Aucun prospect trouvé
              </p>
              <Button
                onClick={() => setFormOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary"
              >
                Ajouter ton premier prospect
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  templates={templates}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onUpdateTemplates={() => {
                    // Templates are now managed by the hook
                  }}
                  onUpdateProspect={(updated) => {
                    updateProspect({ id: updated.id, data: updated });
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <ProspectForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingProspect(undefined);
          }
        }}
        onSubmit={handleSubmit}
        initialData={editingProspect}
      />
    </div>
  );
};

export default Prospects;
