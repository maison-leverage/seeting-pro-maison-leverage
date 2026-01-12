import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProspectForm from "@/components/prospects/ProspectForm";
import ProspectCard from "@/components/prospects/ProspectCard";
import DuplicateDetector from "@/components/prospects/DuplicateDetector";
import { Prospect } from "@/types/prospect";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadProspects();
    });

    // Realtime subscription
    const channel = supabase
      .channel('prospects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, () => {
        loadProspects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [prospects, view, searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    // Check if we should open the form (from "Nouveau prospect" button)
    const shouldOpenForm = searchParams.get("new");
    if (shouldOpenForm === "true") {
      setEditingProspect(undefined);
      setFormOpen(true);
      // Clear the query param
      navigate("/prospects?view=" + view, { replace: true });
    }
  }, [searchParams, navigate, view]);

  const loadProspects = async () => {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading prospects:', error);
      return;
    }

    const loadedProspects: Prospect[] = data.map((p: any) => ({
      id: p.id,
      fullName: p.full_name,
      company: p.company,
      position: p.position || "",
      linkedinUrl: p.linkedin_url || "",
      status: p.status,
      priority: p.priority,
      qualification: p.qualification,
      hype: p.hype,
      tags: p.tags || [],
      notes: [],
      history: [],
      reminderDate: p.reminder_date,
      firstMessageDate: p.first_message_date,
      assignedTo: p.assigned_to || "",
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      lastContact: p.last_contact,
      followUpCount: p.follow_up_count || 0,
      no_show: p.no_show || false,
      proposal_sent: p.proposal_sent || false,
      r2_scheduled: p.r2_scheduled || false,
      no_follow_up: p.no_follow_up || false,
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
  };

  const applyFilters = () => {
    let filtered = [...prospects];

    // Exclure tous les prospects avec R1 programmé de la page Prospects
    filtered = filtered.filter((p) => p.status !== "r1_programme");

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

  const handleSubmit = async (prospectData: Partial<Prospect>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingProspect) {
      // Update existing
      const { error } = await supabase
        .from('prospects')
        .update({
          full_name: prospectData.fullName,
          company: prospectData.company,
          position: prospectData.position,
          linkedin_url: prospectData.linkedinUrl,
          status: prospectData.status,
          priority: prospectData.priority,
          qualification: prospectData.qualification,
          hype: prospectData.hype,
          tags: prospectData.tags,
          reminder_date: prospectData.reminderDate,
          first_message_date: prospectData.firstMessageDate,
          last_contact: prospectData.lastContact,
          follow_up_count: prospectData.followUpCount,
        })
        .eq('id', editingProspect.id);

      if (error) {
        console.error('Error updating prospect:', error);
        toast.error("Erreur lors de la modification");
        return;
      }
      toast.success("Prospect modifié !");
    } else {
      // Create new
      const { error } = await supabase
        .from('prospects')
        .insert({
          user_id: user.id,
          full_name: prospectData.fullName!,
          company: prospectData.company!,
          position: prospectData.position,
          linkedin_url: prospectData.linkedinUrl,
          status: prospectData.status || "rien",
          priority: prospectData.priority || "rien",
          qualification: prospectData.qualification || "rien",
          hype: prospectData.hype || "rien",
          tags: prospectData.tags || [],
          reminder_date: prospectData.reminderDate,
          first_message_date: prospectData.firstMessageDate,
          follow_up_count: 0,
        });

      if (error) {
        console.error('Error creating prospect:', error);
        toast.error("Erreur lors de la création");
        return;
      }
      toast.success("Prospect ajouté !");
    }

    setEditingProspect(undefined);
    loadProspects();
  };

  const handleEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archiver ce prospect ? Il ne sera plus visible mais restera dans les statistiques.")) return;

    const { error } = await supabase
      .from('prospects')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error archiving prospect:', error);
      toast.error("Erreur lors de l'archivage");
      return;
    }

    toast.success("Prospect archivé");
    loadProspects();
  };

  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      toast.error("Aucun prospect à exporter");
      return;
    }

    const headers = [
      "Nom complet",
      "Entreprise",
      "Poste",
      "LinkedIn",
      "Statut",
      "Relances",
      "Value Bomb/Qualification",
      "Hype",
      "Date de relance",
      "Date premier message",
      "Nombre de follow-up"
    ];

    const csvRows = [headers.join(",")];

    filteredProspects.forEach((prospect) => {
      const row = [
        `"${prospect.fullName}"`,
        `"${prospect.company}"`,
        `"${prospect.position}"`,
        `"${prospect.linkedinUrl}"`,
        `"${prospect.status}"`,
        `"${prospect.priority}"`,
        `"${prospect.qualification}"`,
        `"${prospect.hype}"`,
        prospect.reminderDate ? new Date(prospect.reminderDate).toLocaleDateString("fr-FR") : "",
        prospect.firstMessageDate ? new Date(prospect.firstMessageDate).toLocaleDateString("fr-FR") : "",
        prospect.followUpCount || 0
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `prospects_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${filteredProspects.length} prospects exportés !`);
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

            <DuplicateDetector prospects={prospects} onEdit={handleEdit} />

            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
              disabled={filteredProspects.length === 0}
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-input border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="rien">⚪ Rien</SelectItem>
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
                <SelectItem value="rien">⚪ Rien</SelectItem>
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onActivityLogged={loadProspects}
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
