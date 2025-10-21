import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProspectForm from "@/components/prospects/ProspectForm";
import ProspectCard from "@/components/prospects/ProspectCard";
import { Prospect } from "@/types/prospect";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download } from "lucide-react";
import { exportProspectsToCSV } from "@/utils/exportUtils";
import { Template } from "@/types/template";

const Prospects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }

    loadProspects();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [prospects, view, searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    // Check if we should open the form (from "Nouveau prospect" button)
    const shouldOpenForm = searchParams.get("new");
    console.log("Prospects page - searchParams:", { shouldOpenForm, view, formOpen });
    if (shouldOpenForm === "true" && !formOpen) {
      console.log("Opening form from 'new' param");
      setEditingProspect(undefined);
      setFormOpen(true);
      // Clear the query param immediately
      const timer = setTimeout(() => {
        navigate("/prospects?view=" + view, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, view, formOpen]);

  const loadProspects = () => {
    const stored = localStorage.getItem("crm_prospects");
    const storedTemplates = localStorage.getItem("crm_templates");
    
    if (stored) {
      const loadedProspects = JSON.parse(stored).map((p: any) => ({
        ...p,
        // Assurer que followUpCount existe (migration pour anciens prospects)
        followUpCount: p.followUpCount ?? 0,
      }));
      setProspects(loadedProspects);

      // Calculate today count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const count = loadedProspects.filter((p: Prospect) => {
        if (!p.reminderDate) return false;
        const reminder = new Date(p.reminderDate);
        reminder.setHours(0, 0, 0, 0);
        return reminder <= today;
      }).length;
      setTodayCount(count);
    }
    
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }
  };

  const applyFilters = () => {
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
          p.fullName.toLowerCase().includes(query) ||
          p.company.toLowerCase().includes(query) ||
          p.position.toLowerCase().includes(query)
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
      // First sort by reminder date
      if (a.reminderDate && b.reminderDate) {
        const dateA = new Date(a.reminderDate).getTime();
        const dateB = new Date(b.reminderDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
      } else if (a.reminderDate) {
        return -1;
      } else if (b.reminderDate) {
        return 1;
      }
      
      // Then by priority (higher number = higher priority)
      return parseInt(b.priority) - parseInt(a.priority);
    });

    setFilteredProspects(filtered);
  };

  const handleSubmit = (prospectData: Partial<Prospect>) => {
    const user = JSON.parse(localStorage.getItem("crm_user") || "{}");

    if (editingProspect) {
      // Update existing
      const updated = prospects.map((p) =>
        p.id === editingProspect.id
          ? {
              ...p,
              ...prospectData,
              history: [
                ...p.history,
                {
                  id: Date.now().toString(),
                  action: "Modification",
                  details: `Modifié par ${user.name}`,
                  createdAt: new Date().toISOString(),
                  createdBy: user.name,
                },
              ],
            }
          : p
      );
      setProspects(updated);
      localStorage.setItem("crm_prospects", JSON.stringify(updated));
    } else {
      // Create new
      const newProspect: Prospect = {
        id: Date.now().toString(),
        fullName: prospectData.fullName!,
        company: prospectData.company!,
        position: prospectData.position || "",
        linkedinUrl: prospectData.linkedinUrl || "",
        status: prospectData.status || "premier_message",
        priority: prospectData.priority || "2",
        qualification: prospectData.qualification || "loom",
        hype: prospectData.hype || "tiede",
        tags: prospectData.tags || [],
        notes: prospectData.notes || [],
        history: prospectData.history || [],
        reminderDate: prospectData.reminderDate,
        assignedTo: prospectData.assignedTo || user.id,
        createdAt: prospectData.createdAt!,
        updatedAt: prospectData.updatedAt!,
        followUpCount: 0,
      };

      const updated = [...prospects, newProspect];
      setProspects(updated);
      localStorage.setItem("crm_prospects", JSON.stringify(updated));
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

    const updated = prospects.filter((p) => p.id !== id);
    setProspects(updated);
    localStorage.setItem("crm_prospects", JSON.stringify(updated));
    toast.success("Prospect supprimé");
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
                  onUpdateTemplates={(updated) => {
                    setTemplates(updated);
                    localStorage.setItem("crm_templates", JSON.stringify(updated));
                  }}
                  onUpdateProspect={(updated) => {
                    const updatedProspects = prospects.map((p) =>
                      p.id === updated.id ? updated : p
                    );
                    setProspects(updatedProspects);
                    localStorage.setItem("crm_prospects", JSON.stringify(updatedProspects));
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
