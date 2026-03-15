import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProspects } from "@/hooks/useProspects";
import {
  BarChart3,
  Send,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus
} from "lucide-react";
import { startOfDay, endOfDay, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

interface PerformanceMetrics {
  messagesSejourdhuiCount: number;
  messagesSejourdhuiTarget: number;
  messagesThisWeek: number;
  globalReplyRate: number;
  pipelineVelocity: number; // avg days from premier_dm to r1_booke
}

interface MessageVariant {
  id: string;
  category: string;
  name: string;
  content: string;
  created_at: string;
}

interface MessageSend {
  id: string;
  variant_id: string;
  prospect_id: string;
  sent_at: string;
  has_reply: boolean;
  replied_at?: string;
}

interface ABTestResult {
  categoryName: string;
  variants: {
    id: string;
    name: string;
    sendCount: number;
    replyCount: number;
    replyRate: number;
    isWinner?: boolean;
    isStatSignificant?: boolean;
  }[];
}

interface PipelineFunnelItem {
  stage: string;
  count: number;
  conversionRate: number;
}

interface StalledProspect {
  id: string;
  fullName: string;
  company: string;
  status: string;
  daysSinceContact: number;
  lastContactDate: string;
}

const PROSPCT_STATUS = [
  "nouveau",
  "premier_dm",
  "relance",
  "reponse",
  "discussion",
  "demande_dispos",
  "r1_booke",
  "r1_fait",
  "r2_booke",
  "signe",
  "perdu",
];

const MESSAGE_CATEGORIES = [
  "first_dm_inbound",
  "first_dm_outbound",
  "followup_1",
  "followup_2",
  "followup_3",
];

const Admin = () => {
  const navigate = useNavigate();
  const { prospects } = useProspects();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    messagesSejourdhuiCount: 0,
    messagesSejourdhuiTarget: 25,
    messagesThisWeek: 0,
    globalReplyRate: 0,
    pipelineVelocity: 0,
  });
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [pipelineFunnel, setPipelineFunnel] = useState<PipelineFunnelItem[]>([]);
  const [stalledProspects, setStalledProspects] = useState<StalledProspect[]>([]);

  // Form state for new variant
  const [newVariantCategory, setNewVariantCategory] = useState("");
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantContent, setNewVariantContent] = useState("");
  const [savingVariant, setSavingVariant] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadAdminData();
    });

    // Subscribe to activity logs for real-time updates
    const activityChannel = supabase
      .channel("admin-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => {
        loadAdminData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, [navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPerformanceMetrics(),
        loadABTestResults(),
        loadPipelineFunnel(),
        loadStalledProspects(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    const today = new Date();
    const start = startOfDay(today).toISOString();
    const end = endOfDay(today).toISOString();

    // Messages sent today (count first_dm + follow_up_dm in activity_logs)
    const { data: todayLogs } = await supabase
      .from("activity_logs")
      .select("type")
      .gte("created_at", start)
      .lte("created_at", end);

    const messagesSejourdhuiCount = (todayLogs || []).filter(
      (l) => l.type === "first_dm" || l.type === "follow_up_dm"
    ).length;

    // Messages this week
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const { data: weekLogs } = await supabase
      .from("activity_logs")
      .select("type")
      .gte("created_at", weekStart.toISOString());

    const messagesThisWeek = (weekLogs || []).filter(
      (l) => l.type === "first_dm" || l.type === "follow_up_dm"
    ).length;

    // Global reply rate (all time)
    const { data: allLogs } = await supabase
      .from("activity_logs")
      .select("type");

    const firstDMs = (allLogs || []).filter(
      (l) => l.type === "first_dm" || l.type === "follow_up_dm"
    ).length;
    const replies = (allLogs || []).filter((l) => l.type === "reply_received").length;
    const globalReplyRate = firstDMs > 0 ? ((replies / firstDMs) * 100) : 0;

    // Pipeline velocity: avg days from premier_dm to r1_booke
    // This requires fetching prospects with both events recorded
    const prospectsWithR1 = prospects.filter(
      (p) => p.firstMessageDate && ["r1_booke", "r1_fait", "r2_booke", "signe"].includes(p.status)
    );

    let pipelineVelocity = 0;
    if (prospectsWithR1.length > 0) {
      const totalDays = prospectsWithR1.reduce((sum, p) => {
        if (!p.firstMessageDate || !p.r1_date) return sum;
        return sum + differenceInDays(parseISO(p.r1_date), parseISO(p.firstMessageDate));
      }, 0);
      pipelineVelocity = Math.round(totalDays / prospectsWithR1.length);
    }

    setMetrics({
      messagesSejourdhuiCount,
      messagesSejourdhuiTarget: 25,
      messagesThisWeek,
      globalReplyRate: Math.round(globalReplyRate * 10) / 10,
      pipelineVelocity,
    });
  };

  const loadABTestResults = async () => {
    // Get all message variants
    const { data: variants } = await supabase
      .from("message_variants")
      .select("*");

    if (!variants || variants.length === 0) {
      setAbTestResults([]);
      return;
    }

    // Get all message sends
    const { data: sends } = await supabase
      .from("message_sends")
      .select("*");

    if (!sends) {
      setAbTestResults([]);
      return;
    }

    // Group by category
    const grouped: Record<string, typeof variants> = {};
    for (const variant of variants) {
      if (!grouped[variant.category]) {
        grouped[variant.category] = [];
      }
      grouped[variant.category].push(variant);
    }

    const results: ABTestResult[] = [];

    for (const [category, categoryVariants] of Object.entries(grouped)) {
      const variantResults = categoryVariants.map((variant) => {
        const variantSends = sends.filter((s) => s.variant_id === variant.id);
        const replyCount = variantSends.filter((s) => s.has_reply).length;
        const sendCount = variantSends.length;
        const replyRate = sendCount > 0 ? (replyCount / sendCount) * 100 : 0;

        return {
          id: variant.id,
          name: variant.name,
          sendCount,
          replyCount,
          replyRate: Math.round(replyRate * 10) / 10,
        };
      });

      // Find winner (highest reply rate)
      if (variantResults.length > 0) {
        const maxRate = Math.max(...variantResults.map((v) => v.replyRate));
        const minSends = 30;
        const diffThreshold = 5;

        variantResults = variantResults.map((variant) => ({
          ...variant,
          isWinner: variant.replyRate === maxRate,
          isStatSignificant:
            variant.sendCount >= minSends &&
            Math.max(...variantResults.map((v) => v.replyRate)) -
              Math.min(...variantResults.map((v) => v.replyRate)) >=
              diffThreshold,
        }));
      }

      results.push({
        categoryName: category,
        variants: variantResults,
      });
    }

    setAbTestResults(results);
  };

  const loadPipelineFunnel = async () => {
    const funnel: PipelineFunnelItem[] = [];

    for (let i = 0; i < PROSPCT_STATUS.length; i++) {
      const stage = PROSPCT_STATUS[i];
      const count = prospects.filter((p) => p.status === stage).length;
      const nextStage = PROSPCT_STATUS[i + 1];
      const nextCount =
        nextStage && i < PROSPCT_STATUS.length - 1
          ? prospects.filter((p) => p.status === nextStage).length
          : 0;

      const conversionRate =
        count > 0 && nextCount > 0 ? Math.round((nextCount / count) * 100) : 0;

      funnel.push({
        stage,
        count,
        conversionRate,
      });
    }

    setPipelineFunnel(funnel);
  };

  const loadStalledProspects = async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stalled = prospects
      .filter((p) => {
        const inTargetStatus = ["premier_dm", "relance"].includes(p.status);
        const lastContact = p.lastContact ? parseISO(p.lastContact) : null;
        const isStale =
          !lastContact || differenceInDays(now, lastContact) > 7;
        return inTargetStatus && isStale;
      })
      .map((p) => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company,
        status: p.status,
        daysSinceContact: p.lastContact ? differenceInDays(now, parseISO(p.lastContact)) : 999,
        lastContactDate: p.lastContact || "N/A",
      }))
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
      .slice(0, 10);

    setStalledProspects(stalled);
  };

  const handleSaveVariant = async () => {
    if (!newVariantCategory || !newVariantName || !newVariantContent) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSavingVariant(true);
    try {
      const { error } = await supabase.from("message_variants").insert([
        {
          category: newVariantCategory,
          name: newVariantName,
          content: newVariantContent,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Variante ajoutée avec succès");
      setNewVariantCategory("");
      setNewVariantName("");
      setNewVariantContent("");
      await loadABTestResults();
    } catch (error) {
      console.error("Error saving variant:", error);
      toast.error("Erreur lors de l'ajout de la variante");
    } finally {
      setSavingVariant(false);
    }
  };

  const progressPercent = Math.min(
    (metrics.messagesSejourdhuiCount / metrics.messagesSejourdhuiTarget) * 100,
    100
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Performance des setters et résultats A/B tests
            </p>
          </div>

          {/* Performance Setter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Messages today */}
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Messages aujourd'hui
                  </p>
                  <p className="text-3xl font-bold">
                    {metrics.messagesSejourdhuiCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Objectif: {metrics.messagesSejourdhuiTarget}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </Card>

            {/* Messages this week */}
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Messages cette semaine
                  </p>
                  <p className="text-3xl font-bold">
                    {metrics.messagesThisWeek}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Moyenne: ~{Math.round(metrics.messagesThisWeek / 5)}/jour
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </Card>

            {/* Global reply rate */}
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Taux de réponse global
                  </p>
                  <p className="text-3xl font-bold">
                    {metrics.globalReplyRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-time
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <BarChart3 className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </Card>

            {/* Pipeline velocity */}
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pipeline velocity
                  </p>
                  <p className="text-3xl font-bold">
                    {metrics.pipelineVelocity}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Jours moy. à R1
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* A/B Test Results */}
          <Card className="p-6 border-border/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Résultats A/B Tests
            </h2>

            {abTestResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune variante de message pour le moment
              </p>
            ) : (
              <div className="space-y-6">
                {abTestResults.map((result) => (
                  <div key={result.categoryName} className="border border-border/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-foreground">
                      {result.categoryName}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border/50">
                          <tr>
                            <th className="text-left py-2 px-3 text-muted-foreground">
                              Variante
                            </th>
                            <th className="text-right py-2 px-3 text-muted-foreground">
                              Envois
                            </th>
                            <th className="text-right py-2 px-3 text-muted-foreground">
                              Réponses
                            </th>
                            <th className="text-right py-2 px-3 text-muted-foreground">
                              Taux
                            </th>
                            <th className="text-right py-2 px-3 text-muted-foreground">
                              Statut
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.variants.map((variant) => (
                            <tr
                              key={variant.id}
                              className={`border-b border-border/50 ${
                                variant.isWinner ? "bg-green-500/5" : ""
                              }`}
                            >
                              <td className="py-3 px-3 font-medium">
                                {variant.name}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {variant.sendCount}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {variant.replyCount}
                              </td>
                              <td className="py-3 px-3 text-right font-medium">
                                {variant.replyRate.toFixed(1)}%
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex gap-2 justify-end">
                                  {variant.isWinner && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                      Gagnant
                                    </Badge>
                                  )}
                                  {variant.isStatSignificant && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                      Significatif
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pipeline Funnel */}
          <Card className="p-6 border-border/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Pipeline Funnel
            </h2>

            {pipelineFunnel.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune donnée disponible
              </p>
            ) : (
              <div className="space-y-3">
                {pipelineFunnel.map((item, idx) => (
                  <div key={item.stage} className="flex items-center gap-4">
                    <div className="w-32">
                      <p className="font-medium text-sm">{item.stage}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          {item.count} prospects
                        </span>
                        {idx < pipelineFunnel.length - 1 && (
                          <span className="text-xs text-muted-foreground">
                            → {item.conversionRate}%
                          </span>
                        )}
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                          style={{
                            width: `${Math.min(
                              (item.count / Math.max(...pipelineFunnel.map((x) => x.count))) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Stalled Prospects */}
          <Card className="p-6 border-border/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              Prospects qui stagnent
            </h2>

            {stalledProspects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun prospect stagnant
              </p>
            ) : (
              <div className="space-y-3">
                {stalledProspects.map((prospect) => (
                  <div
                    key={prospect.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card-hover border border-border/50 hover:border-destructive/50 transition-all"
                  >
                    <div>
                      <p className="font-medium">{prospect.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {prospect.company} • {prospect.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">
                        {prospect.daysSinceContact} jours sans contact
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dernier: {prospect.lastContactDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Add New Variant Form */}
          <Card className="p-6 border-border/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-primary" />
              Ajouter une nouvelle variante
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Catégorie
                  </label>
                  <Select value={newVariantCategory} onValueChange={setNewVariantCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESSAGE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Nom</label>
                  <Input
                    placeholder="ex: Variante A - Hook 1"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Contenu du message
                </label>
                <Textarea
                  placeholder="Votre message ici. Placeholders disponibles: {prenom}, {position}, {company}"
                  value={newVariantContent}
                  onChange={(e) => setNewVariantContent(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Placeholders: {'{prenom}'} - {'{position}'} - {'{company}'}
                </p>
              </div>

              <Button
                onClick={handleSaveVariant}
                disabled={savingVariant || !newVariantCategory || !newVariantName || !newVariantContent}
                className="w-full"
              >
                {savingVariant ? "Enregistrement..." : "Enregistrer la variante"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Admin;
