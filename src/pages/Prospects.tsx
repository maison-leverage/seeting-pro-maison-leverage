import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProspectForm from "@/components/prospects/ProspectForm";
import ProspectCard from "@/components/prospects/ProspectCard";
import { Prospect } from "@/types/prospect";
import { updateProspectScore } from "@/utils/prospectUtils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter } from "lucide-react";

const Prospects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";

  const [prospects, setProspects] = useState<Prospect[]>([]);
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

    // Check for edit parameter
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    
    loadProspects();
    
    // Si un ID d'édition est présent, ouvrir le formulaire
    if (editId) {
      const stored = localStorage.getItem("crm_prospects");
      if (stored) {
        const loadedProspects = JSON.parse(stored);
        const prospectToEdit = loadedProspects.find((p: Prospect) => p.id === editId);
        if (prospectToEdit) {
          setEditingProspect(prospectToEdit);
          setFormOpen(true);
        }
      }
    }
  }, [navigate]);

  useEffect(() => {
    console.log("🔍 Application des filtres - prospects:", prospects.length, "view:", view);
    applyFilters();
  }, [prospects, view, searchQuery, statusFilter, priorityFilter]);

  const loadProspects = () => {
    const stored = localStorage.getItem("crm_prospects");
    console.log("📦 Données localStorage:", stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📊 Prospects parsés:", parsed);
      const loadedProspects = parsed.map((p: any) => ({
        ...p,
        // Assurer que followUpCount existe (migration pour anciens prospects)
        followUpCount: p.followUpCount ?? 0,
      }));
      console.log("✅ Prospects après migration:", loadedProspects);
      setProspects(loadedProspects);

      // Calculate today count
      const today = new Date().toISOString().split("T")[0];
      const count = loadedProspects.filter(
        (p: Prospect) => p.reminderDate && p.reminderDate.split("T")[0] <= today
      ).length;
      setTodayCount(count);
    } else {
      console.log("❌ Aucun prospect dans localStorage");
    }
  };

  const applyFilters = () => {
    let filtered = [...prospects];

    // View filters
    const today = new Date().toISOString().split("T")[0];
    switch (view) {
      case "today":
        filtered = filtered.filter(
          (p) => p.reminderDate && p.reminderDate.split("T")[0] <= today
        );
        break;
      case "hot":
        filtered = filtered.filter(
          (p) =>
            (p.priority === "haute" || p.priority === "urgent") &&
            p.qualification === "qualifie" &&
            (p.status === "discussion" || p.status === "qualifie")
        );
        break;
      case "waiting":
        filtered = filtered.filter(
          (p) => p.status === "contacte" || p.status === "discussion"
        );
        break;
      case "refused":
        filtered = filtered.filter((p) => p.status === "perdu");
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

    // Sort by score
    filtered.sort((a, b) => b.score - a.score);

    console.log("🎯 Prospects filtrés:", filtered.length);
    setFilteredProspects(filtered);
  };

  const handleSubmit = (prospectData: Partial<Prospect>) => {
    const user = JSON.parse(localStorage.getItem("crm_user") || "{}");

    if (editingProspect) {
      // Update existing
      const updated = prospects.map((p) =>
        p.id === editingProspect.id
          ? updateProspectScore({
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
            })
          : p
      );
      setProspects(updated);
      localStorage.setItem("crm_prospects", JSON.stringify(updated));
    } else {
      // Create new
      const newProspect: Prospect = updateProspectScore({
        id: Date.now().toString(),
        fullName: prospectData.fullName!,
        company: prospectData.company!,
        position: prospectData.position || "",
        linkedinUrl: prospectData.linkedinUrl || "",
        status: prospectData.status || "nouveau",
        priority: prospectData.priority || "moyenne",
        qualification: prospectData.qualification || "a_evaluer",
        tags: prospectData.tags || [],
        notes: prospectData.notes || [],
        history: prospectData.history || [],
        reminderDate: prospectData.reminderDate,
        assignedTo: prospectData.assignedTo || user.id,
        createdAt: prospectData.createdAt!,
        updatedAt: prospectData.updatedAt!,
        score: 0,
        followUpCount: 0,
      });

      const updated = [...prospects, newProspect];
      setProspects(updated);
      localStorage.setItem("crm_prospects", JSON.stringify(updated));
    }

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

  const handleExport = () => {
    const csv = [
      ["Nom complet", "Entreprise", "Poste", "LinkedIn", "Statut", "Priorité", "Score"].join(","),
      ...filteredProspects.map((p) =>
        [
          p.fullName,
          p.company,
          p.position,
          p.linkedinUrl,
          p.status,
          p.priority,
          p.score,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospects-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Export réussi !");
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
              onClick={handleExport}
              variant="outline"
              className="border-border/50 hover:border-primary hover:bg-primary/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
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
                <SelectItem value="nouveau">🆕 Nouveau</SelectItem>
                <SelectItem value="contacte">💬 Contacté</SelectItem>
                <SelectItem value="discussion">🗣️ En discussion</SelectItem>
                <SelectItem value="qualifie">✅ Qualifié</SelectItem>
                <SelectItem value="gagne">🎯 Gagné</SelectItem>
                <SelectItem value="perdu">❌ Perdu</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[200px] bg-input border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
                <SelectItem value="haute">🟠 Haute</SelectItem>
                <SelectItem value="moyenne">🟡 Moyenne</SelectItem>
                <SelectItem value="faible">🟢 Faible</SelectItem>
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <ProspectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingProspect}
      />
    </div>
  );
};

export default Prospects;
