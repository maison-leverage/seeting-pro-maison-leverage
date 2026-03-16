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
import { Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProspects, mapProspectToDb } from "@/hooks/useProspects";

const PROSPECTS_PER_PAGE = 25;

const Prospects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";

  const { prospects, todayCount, refresh } = useProspects();
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [prospects, view, searchQuery, statusFilter, sourceFilter]);

  useEffect(() => {
    const shouldOpenForm = searchParams.get("new");
    if (shouldOpenForm === "true") {
      setEditingProspect(undefined);
      setFormOpen(true);
      navigate("/prospects?view=" + view, { replace: true });
    }
  }, [searchParams, navigate, view]);

  const applyFilters = () => {
    let filtered = [...prospects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.company.toLowerCase().includes(query) ||
          p.position.toLowerCase().includes(query)
      );
    } else {
      // Vue R1 — filtrer sur r1_booke, r1_fait, r2_booke
      if (view === "r1") {
        filtered = filtered.filter((p) => ["r1_booke", "r1_fait", "r2_booke"].includes(p.status));
      } else {
        // Autres vues — exclure les statuts avancés
        filtered = filtered.filter((p) => !["r1_booke", "r1_fait", "r2_booke", "signe", "perdu"].includes(p.status));
      }

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
        default:
          break;
      }
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((p) => p.source === sourceFilter);
    }

    // Sort by reminder date then by hype
    const hypeOrder: Record<string, number> = { chaud: 3, tiede: 2, froid: 1, rien: 0 };
    filtered.sort((a, b) => {
      if (a.reminderDate && b.reminderDate) {
        const dateA = new Date(a.reminderDate).getTime();
        const dateB = new Date(b.reminderDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
      } else if (a.reminderDate) return -1;
      else if (b.reminderDate) return 1;
      return (hypeOrder[b.hype] || 0) - (hypeOrder[a.hype] || 0);
    });

    setFilteredProspects(filtered);
  };

  const totalPages = Math.ceil(filteredProspects.length / PROSPECTS_PER_PAGE);
  const paginatedProspects = filteredProspects.slice(
    (currentPage - 1) * PROSPECTS_PER_PAGE,
    currentPage * PROSPECTS_PER_PAGE
  );

  const handleSubmit = async (prospectData: Partial<Prospect>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingProspect) {
      const dbData = mapProspectToDb(prospectData);
      const { error } = await supabase.from('prospects').update(dbData).eq('id', editingProspect.id);
      if (error) {
        console.error('Error updating prospect:', error);
        toast.error("Erreur lors de la modification");
        return;
      }
      toast.success("Prospect modifié !");
    } else {
      const hasWebsite = prospectData.websiteUrl && prospectData.websiteUrl.trim() !== "";
      const { data: newProspect, error } = await supabase
        .from('prospects')
        .insert({
          user_id: user.id,
          full_name: prospectData.fullName!,
          company: prospectData.company!,
          position: prospectData.position,
          linkedin_url: prospectData.linkedinUrl,
          email: prospectData.email,
          website_url: prospectData.websiteUrl || null,
          audit_status: hasWebsite ? "pending" : null,
          status: prospectData.status || "nouveau",
          source: prospectData.source || "outbound",
          qualification: prospectData.qualification || "rien",
          hype: prospectData.hype || "rien",
          tags: prospectData.tags || [],
          reminder_date: prospectData.reminderDate,
          first_message_date: prospectData.firstMessageDate,
          follow_up_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prospect:', error);
        toast.error("Erreur lors de la création");
        return;
      }

      if (prospectData.firstMessageDate && newProspect) {
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
        const userName = profile?.name || user.email || 'Utilisateur';
        await supabase.from('activity_logs').insert({
          type: 'first_dm',
          user_name: userName,
          lead_id: newProspect.id,
          user_id: user.id,
          prospect_name: prospectData.fullName,
          prospect_company: prospectData.company
        });
      }

      // Auto-trigger audit generation if website URL is provided
      if (hasWebsite && newProspect) {
        toast.info("Audit SEO & IA en cours de génération...");
        // Call the generate-audit Edge Function in background
        supabase.functions.invoke('generate-audit', {
          body: {
            prospect_id: newProspect.id,
            website_url: prospectData.websiteUrl,
            prenom: prospectData.fullName?.split(' ')[0] || '',
            company: prospectData.company,
            secteur: '', // Can be added later
            ville: '',   // Can be added later
          }
        }).then(({ error: auditError }) => {
          if (auditError) {
            console.error('Audit generation error:', auditError);
            toast.error("Erreur lors de la génération de l'audit");
          } else {
            toast.success("Audit SEO & IA généré avec succès !");
            refresh();
          }
        });
      }

      toast.success("Prospect ajouté !");
    }

    setEditingProspect(undefined);
    refresh();
  };

  const handleEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archiver ce prospect ? Il ne sera plus visible mais restera dans les statistiques.")) return;
    const { error } = await supabase.from('prospects').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('Error archiving prospect:', error);
      toast.error("Erreur lors de l'archivage");
      return;
    }
    toast.success("Prospect archivé");
    refresh();
  };

  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      toast.error("Aucun prospect à exporter");
      return;
    }

    const headers = [
      "Nom complet", "Entreprise", "Poste", "LinkedIn", "Email",
      "Statut", "Source", "Value Bomb/Qualification", "Hype",
      "Date de relance", "Date premier message", "Nombre de follow-up"
    ];

    const csvRows = [headers.join(",")];
    filteredProspects.forEach((prospect) => {
      const row = [
        `"${prospect.fullName}"`, `"${prospect.company}"`, `"${prospect.position}"`,
        `"${prospect.linkedinUrl}"`, `"${prospect.email || ""}"`, `"${prospect.status}"`,
        `"${prospect.source}"`, `"${prospect.qualification}"`, `"${prospect.hype}"`,
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
    if (searchQuery) return `🔍 Recherche : "${searchQuery}"`;
    switch (view) {
      case "today": return "📌 À relancer aujourd'hui";
      case "hot": return "🔥 Prospects chauds";
      case "r1": return "🎯 R1 / R2 en cours";
      case "waiting": return "⏰ En attente de réponse";
      default: return "📊 Tous les prospects";
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header onNewProspect={() => { setEditingProspect(undefined); setFormOpen(true); }} notificationCount={todayCount} />
        <main className="p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{getViewTitle()}</h1>
              <p className="text-muted-foreground">{filteredProspects.length} prospect{filteredProspects.length > 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un prospect..." className="pl-10 bg-input border-border/50" />
              </div>
            </div>

            <DuplicateDetector prospects={prospects} onEdit={handleEdit} onDelete={handleDelete} />

            <Button onClick={handleExportCSV} variant="outline" className="gap-2" disabled={filteredProspects.length === 0}>
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

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[200px] bg-input border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="inbound">📥 Inbound</SelectItem>
                <SelectItem value="visiteur_profil">👁️ Visiteur profil</SelectItem>
                <SelectItem value="relation_dormante">💤 Relation dormante</SelectItem>
                <SelectItem value="outbound">📤 Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProspects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">Aucun prospect trouvé</p>
              <Button onClick={() => setFormOpen(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary">
                Ajouter ton premier prospect
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedProspects.map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} onEdit={handleEdit} onDelete={handleDelete} onActivityLogged={refresh} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-6">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-10">
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="gap-1">
                    Suivant <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-4">
                    Page {currentPage} sur {totalPages} ({filteredProspects.length} prospects)
                  </span>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ProspectForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} initialData={editingProspect} />
    </div>
  );
};

export default Prospects;
