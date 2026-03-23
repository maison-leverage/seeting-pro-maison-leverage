import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, SkipForward, MessageCircle, Check, AlertTriangle, Clock, FlaskConical, Brain, XCircle, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProspects } from "@/hooks/useProspects";
import { Prospect, ProspectSource } from "@/types/prospect";
import { isPast, isToday, addDays, differenceInDays, startOfDay, endOfDay } from "date-fns";
import ResponseAnalyzer from "@/components/prospects/ResponseAnalyzer";
import AuditButton from "@/components/prospects/AuditButton";
import { generateAudit } from "@/utils/auditUtils";

const FOLLOW_UP_DAYS = [4, 10, 15];
const ADVANCED_STATUSES = ["r1_booke", "r1_fait", "r2_booke", "signe", "perdu"];

// Types for A/B testing
interface MessageVariant {
  id: string;
  name: string;
  category: string;
  content: string;
  is_control: boolean;
}

// Fill template placeholders with prospect data
const fillTemplate = (template: string, prospect: Prospect): string => {
  const prenom = prospect.fullName.split(" ")[0];
  return template
    .replace(/{prenom}/g, prenom)
    .replace(/{position}/g, prospect.position)
    .replace(/{company}/g, prospect.company);
};

// Pick variant with strict 50/50 distribution based on actual send counts
const pickVariant = (
  variants: MessageVariant[],
  category: string,
  sendCounts: Record<string, number>
): MessageVariant | null => {
  const matching = variants.filter(v => v.category === category);
  if (matching.length === 0) return null;
  if (matching.length === 1) return matching[0];

  // Find the variant with the fewest sends — guarantees 50/50
  const sorted = [...matching].sort((a, b) => {
    const countA = sendCounts[a.id] || 0;
    const countB = sendCounts[b.id] || 0;
    if (countA !== countB) return countA - countB; // least sent first
    return Math.random() - 0.5; // tie-break randomly
  });
  return sorted[0];
};

// Message templates
const getFirstMessageFallback = (prospect: Prospect): string => {
  const prenom = prospect.fullName.split(" ")[0];
  const company = prospect.company;
  const templates: Record<ProspectSource, string> = {
    inbound: `Bonjour, Merci pour la demande d'ajout ! Par curiosité, qu'est-ce qui vous donne envie de me contacter ? Une envie d'échanger autour du SEO, ou simplement l'idée d'agrandir votre réseau ? Au plaisir d'échanger, Océane`,
    visiteur_profil: `Salut ${prenom}, J'ai vu que vous aviez jeté un œil à mon profil, ne soyez pas timide ! C'était suite à un post que vous avez vu, ou le SEO et la visibilité sur les IA c'est un sujet pour ${company} ? Dans les deux cas, ravie d'échanger ! Océane`,
    relation_dormante: `Salut ${prenom}, On est connectés depuis un moment mais on n'a jamais pris le temps de parler ! J'ai regardé ${company} sur Google et ChatGPT, il y a encore énormément de positions à prendre face à vos concurrents. Si c'est un sujet, je suis dispo pour en parler. Sinon, pas de souci ! Océane`,
    outbound: `Bonjour, Merci pour la demande d'ajout ! Par curiosité, qu'est-ce qui vous donne envie de me contacter ? Une envie d'échanger autour du SEO, ou simplement l'idée d'agrandir votre réseau ? Au plaisir d'échanger, Océane`,
  };
  return templates[prospect.source] || templates.outbound;
};

const getFollowUpFallback = (prospect: Prospect, followUpNumber: number): string => {
  const prenom = prospect.fullName.split(" ")[0];
  const company = prospect.company;
  const messages: Record<number, string> = {
    1: `Re ${prenom},\n\nJe me suis dit que le mieux serait de vous montrer directement le potentiel SEO & IA de ${company}, j'en ai fait un mini-audit.\n\nC'est pas une analyse complète, juste un aperçu rapide de ce que j'ai trouvé.\n\nSi ça vous parle, je suis dispo pour en discuter !\n\nOcéane\n\n[PDF en pièce jointe]`,
    2: `${prenom},\n\nJe reviens vers vous car j'ai vraiment identifié du potentiel pour ${company} côté référencement Google et visibilité sur les IA.\n\nVos concurrents prennent de l'avance sur ces sujets, et il y a une vraie fenêtre de tir en ce moment.\n\nSi vous avez 15 min cette semaine, je vous montre ce que j'ai trouvé.\n\nOcéane`,
    3: `${prenom},\n\nDernier message de ma part, je ne veux pas vous importuner.\n\nSi le SEO et la visibilité sur les IA deviennent un sujet pour ${company}, n'hésitez pas à revenir vers moi.\n\nJe vous souhaite une excellente continuation !\n\nOcéane`,
  };
  return messages[followUpNumber] || messages[1];
};

interface QueueItem {
  prospect: Prospect;
  section: 'overdue' | 'today' | 'responses' | 'new' | 'dispos';
  message: string;
  followUpNumber?: number;
  daysLate?: number;
  variantId?: string;
  variantName?: string;
  isABTest?: boolean;
}

const DailyQueue = () => {
  const navigate = useNavigate();
  const { prospects, todayCount, refresh } = useProspects();
  const [todayActivityCount, setTodayActivityCount] = useState(0);
  const [todayFirstDMCount, setTodayFirstDMCount] = useState(0);
  const [todayFollowUpCount, setTodayFollowUpCount] = useState(0);
  const [todayReplyCount, setTodayReplyCount] = useState(0);
  const [variants, setVariants] = useState<MessageVariant[]>([]);
  const [sendCounts, setSendCounts] = useState<Record<string, number>>({});
  const [analyzingProspectId, setAnalyzingProspectId] = useState<string | null>(null);
  const [editableMessages, setEditableMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTodayCount();
    loadVariants();
    loadSendCounts();
  }, []);

  const loadTodayCount = async () => {
    const today = new Date();
    const start = startOfDay(today).toISOString();
    const end = endOfDay(today).toISOString();

    const { data: todayLogs } = await supabase
      .from('activity_logs')
      .select('type')
      .gte('created_at', start)
      .lte('created_at', end);

    const logs = todayLogs || [];
    const firstDMs = logs.filter(l => l.type === 'first_dm').length;
    const followUps = logs.filter(l => l.type === 'follow_up_dm').length;
    const replies = logs.filter(l => l.type === 'reply_received').length;

    setTodayFirstDMCount(firstDMs);
    setTodayFollowUpCount(followUps);
    setTodayReplyCount(replies);
    setTodayActivityCount(firstDMs + followUps);
  };

  const loadVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('message_variants')
        .select('*');
      if (error) throw error;
      setVariants((data as MessageVariant[]) || []);
    } catch (error) {
      console.error('Failed to load message variants:', error);
      setVariants([]);
    }
  };

  const loadSendCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('message_sends')
        .select('variant_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((send: any) => {
        if (send.variant_id) {
          counts[send.variant_id] = (counts[send.variant_id] || 0) + 1;
        }
      });
      setSendCounts(counts);
    } catch (error) {
      console.error('Failed to load send counts:', error);
      setSendCounts({});
    }
  };

  const trackSend = async (prospectId: string, variantId?: string) => {
    try {
      await supabase.from('message_sends').insert({
        prospect_id: prospectId,
        variant_id: variantId || null,
        created_at: new Date().toISOString(),
        got_reply: false,
      } as any);
    } catch (error) {
      console.error('Failed to track message send:', error);
    }
  };

  // Helper function to get first message with A/B testing (strict 50/50)
  const getFirstMessage = (prospect: Prospect): { message: string; variantId?: string; variantName?: string; isABTest?: boolean } => {
    const category = `first_dm_${prospect.source}`;
    const variant = pickVariant(variants, category, sendCounts);
    if (variant) {
      return {
        message: fillTemplate(variant.content, prospect),
        variantId: variant.id,
        variantName: variant.name,
        isABTest: variants.filter(v => v.category === category).length > 1,
      };
    }
    return { message: getFirstMessageFallback(prospect) };
  };

  // Helper function to get follow-up message with A/B testing (strict 50/50)
  const getFollowUpMessage = (prospect: Prospect, followUpNumber: number): { message: string; variantId?: string; variantName?: string; isABTest?: boolean } => {
    const category = `followup_${followUpNumber}`;
    const variant = pickVariant(variants, category, sendCounts);
    if (variant) {
      return {
        message: fillTemplate(variant.content, prospect),
        variantId: variant.id,
        variantName: variant.name,
        isABTest: variants.filter(v => v.category === category).length > 1,
      };
    }
    return { message: getFollowUpFallback(prospect, followUpNumber) };
  };

  const activeProspects = prospects.filter(p => !p.no_follow_up && !ADVANCED_STATUSES.includes(p.status));

  // Build queue items
  const queueItems: QueueItem[] = [];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // 1. Overdue follow-ups
  activeProspects.filter(p => {
    if (!p.reminderDate || !p.firstMessageDate) return false;
    if (p.status === 'reponse' || p.status === 'demande_dispos') return false;
    const reminder = new Date(p.reminderDate);
    reminder.setHours(0, 0, 0, 0);
    return reminder < todayDate && p.followUpCount < 3;
  }).forEach(p => {
    const reminder = new Date(p.reminderDate!);
    reminder.setHours(0, 0, 0, 0);
    const daysLate = differenceInDays(todayDate, reminder);
    const followUpNumber = p.followUpCount + 1;
    const { message, variantId, variantName, isABTest } = getFollowUpMessage(p, followUpNumber);
    queueItems.push({
      prospect: p,
      section: 'overdue',
      message,
      followUpNumber,
      daysLate,
      variantId,
      variantName,
      isABTest,
    });
  });

  // 2. Today's follow-ups
  activeProspects.filter(p => {
    if (!p.reminderDate || !p.firstMessageDate) return false;
    if (p.status === 'reponse' || p.status === 'demande_dispos') return false;
    const reminder = new Date(p.reminderDate);
    reminder.setHours(0, 0, 0, 0);
    return reminder.getTime() === todayDate.getTime() && p.followUpCount < 3;
  }).forEach(p => {
    const followUpNumber = p.followUpCount + 1;
    const { message, variantId, variantName, isABTest } = getFollowUpMessage(p, followUpNumber);
    queueItems.push({
      prospect: p,
      section: 'today',
      message,
      followUpNumber,
      variantId,
      variantName,
      isABTest,
    });
  });

  // 3. Responses to handle
  activeProspects.filter(p => p.status === 'reponse').forEach(p => {
    queueItems.push({ prospect: p, section: 'responses', message: '' });
  });

  // 4. New prospects
  activeProspects.filter(p => p.status === 'nouveau').forEach(p => {
    const { message, variantId, variantName, isABTest } = getFirstMessage(p);
    queueItems.push({ prospect: p, section: 'new', message, variantId, variantName, isABTest });
  });

  // 5. Pending dispos
  activeProspects.filter(p => p.status === 'demande_dispos').forEach(p => {
    queueItems.push({ prospect: p, section: 'dispos', message: '' });
  });

  const sections = [
    { key: 'overdue' as const, label: '🔴 Relances en retard', color: 'border-red-500', items: queueItems.filter(i => i.section === 'overdue') },
    { key: 'today' as const, label: '🟠 Relances du jour', color: 'border-orange-500', items: queueItems.filter(i => i.section === 'today') },
    { key: 'responses' as const, label: '🟡 Réponses à traiter', color: 'border-yellow-500', items: queueItems.filter(i => i.section === 'responses') },
    { key: 'new' as const, label: '🔵 Nouveaux prospects', color: 'border-blue-500', items: queueItems.filter(i => i.section === 'new') },
    { key: 'dispos' as const, label: '🟢 Demandes de dispos en attente', color: 'border-green-500', items: queueItems.filter(i => i.section === 'dispos') },
  ];

  const totalItems = queueItems.length;

  // Daily quotas
  const QUOTA_FIRST_DM = 30;
  const QUOTA_FOLLOW_UP = 50;
  const QUOTA_TOTAL = 80;
  const pctFirstDM = Math.min((todayFirstDMCount / QUOTA_FIRST_DM) * 100, 100);
  const pctFollowUp = Math.min((todayFollowUpCount / QUOTA_FOLLOW_UP) * 100, 100);
  const pctTotal = Math.min((todayActivityCount / QUOTA_TOTAL) * 100, 100);
  const allQuotasDone = todayFirstDMCount >= QUOTA_FIRST_DM && todayFollowUpCount >= QUOTA_FOLLOW_UP;

  const sourceLabels: Record<string, string> = {
    inbound: "📥 Inbound — Il nous a contacté",
    visiteur_profil: "👁️ Visiteur — Il a vu notre profil",
    relation_dormante: "💤 Dormant — Connecté mais jamais parlé",
    outbound: "📤 Outbound — On l'a ajouté",
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Message copié ! 📋");
  };

  const handleMarkDone = async (item: QueueItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.user.id).maybeSingle();
    const userName = profile?.name || session.user.email || 'Utilisateur';

    if (item.section === 'new') {
      await trackSend(item.prospect.id, item.variantId);
      await supabase.from('activity_logs').insert({
        type: 'first_dm', user_name: userName, lead_id: item.prospect.id,
        user_id: session.user.id, prospect_name: item.prospect.fullName, prospect_company: item.prospect.company,
        variant_id: item.variantId || null,
      } as any);
      const now = new Date();
      await supabase.from('prospects').update({
        status: 'premier_dm', first_message_date: now.toISOString(),
        reminder_date: addDays(now, FOLLOW_UP_DAYS[0]).toISOString(),
      }).eq('id', item.prospect.id);
      toast.success("1er DM enregistré !");
    } else if (item.section === 'overdue' || item.section === 'today') {
      const newCount = item.prospect.followUpCount + 1;
      await trackSend(item.prospect.id, item.variantId);
      await supabase.from('activity_logs').insert({
        type: 'follow_up_dm', user_name: userName, lead_id: item.prospect.id,
        user_id: session.user.id, prospect_name: item.prospect.fullName, prospect_company: item.prospect.company,
        variant_id: item.variantId || null,
      } as any);
      const updateData: Record<string, any> = { follow_up_count: newCount };
      if (newCount < 3 && item.prospect.firstMessageDate) {
        updateData.reminder_date = addDays(new Date(item.prospect.firstMessageDate), FOLLOW_UP_DAYS[newCount]).toISOString();
      } else {
        updateData.reminder_date = null;
      }
      await supabase.from('prospects').update(updateData).eq('id', item.prospect.id);
      toast.success(`Relance ${newCount} enregistrée !`);
    }

    refresh();
    loadTodayCount();
    loadSendCounts(); // Refresh counts to maintain 50/50 balance
  };

  const handleReplyReceived = async (prospect: Prospect) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.user.id).maybeSingle();
    const userName = profile?.name || session.user.email || 'Utilisateur';

    await supabase.from('activity_logs').insert({
      type: 'reply_received', user_name: userName, lead_id: prospect.id,
      user_id: session.user.id, prospect_name: prospect.fullName, prospect_company: prospect.company,
    });

    // Mark the last message_send as got_reply=true
    try {
      const { data: lastSend } = await supabase
        .from('message_sends')
        .select('id')
        .eq('prospect_id', prospect.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSend) {
        await supabase
          .from('message_sends')
          .update({ got_reply: true })
          .eq('id', lastSend.id);
      }
    } catch (error) {
      console.error('Failed to update message_send reply status:', error);
    }

    await supabase.from('prospects').update({ status: 'reponse' }).eq('id', prospect.id);
    toast.success("Réponse enregistrée !");
    refresh();
    loadTodayCount();
  };

  const handleNotInterested = async (prospect: Prospect) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.user.id).maybeSingle();
    const userName = profile?.name || session.user.email || 'Utilisateur';

    await supabase.from('prospects').update({
      status: 'perdu',
      lost_reason: 'not_interested',
    }).eq('id', prospect.id);

    await supabase.from('activity_logs').insert({
      type: 'prospect_lost',
      user_name: userName,
      lead_id: prospect.id,
      user_id: session.user.id,
      prospect_name: prospect.fullName,
      prospect_company: prospect.company,
    });

    toast.success("Prospect marqué comme non intéressé");
    refresh();
    loadTodayCount();
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header notificationCount={todayCount} />
        <main className="p-6 space-y-6 animate-fade-in">
          {/* Quotas du jour */}
          <Card className={`p-6 border-border bg-card shadow-sm ${allQuotasDone ? 'border-green-500/50 bg-green-500/5' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">📋 Ma file du jour</h1>
              {allQuotasDone ? (
                <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                  ✅ Quotas atteints !
                </Badge>
              ) : (
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {todayActivityCount}/{QUOTA_TOTAL} messages
                </Badge>
              )}
            </div>

            {/* 3 Quota bars */}
            <div className="space-y-4 mb-5">
              {/* 1ers DM */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    🔵 Messages d'ouverture (1ers DM)
                  </span>
                  <span className={`text-sm font-bold ${todayFirstDMCount >= QUOTA_FIRST_DM ? 'text-green-600' : 'text-foreground'}`}>
                    {todayFirstDMCount}/{QUOTA_FIRST_DM}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${todayFirstDMCount >= QUOTA_FIRST_DM ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pctFirstDM}%` }}
                  />
                </div>
              </div>

              {/* Relances */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    🟠 Relances
                  </span>
                  <span className={`text-sm font-bold ${todayFollowUpCount >= QUOTA_FOLLOW_UP ? 'text-green-600' : 'text-foreground'}`}>
                    {todayFollowUpCount}/{QUOTA_FOLLOW_UP}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${todayFollowUpCount >= QUOTA_FOLLOW_UP ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${pctFollowUp}%` }}
                  />
                </div>
              </div>

              {/* Total */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    📊 Total messages envoyés
                  </span>
                  <span className={`text-sm font-bold ${todayActivityCount >= QUOTA_TOTAL ? 'text-green-600' : 'text-foreground'}`}>
                    {todayActivityCount}/{QUOTA_TOTAL}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${todayActivityCount >= QUOTA_TOTAL ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-orange-500'}`}
                    style={{ width: `${pctTotal}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="text-2xl font-bold text-destructive">{sections[0].items.length}</div>
                <div className="text-xs text-destructive/70">En retard</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="text-2xl font-bold text-orange-600">{sections[1].items.length}</div>
                <div className="text-xs text-orange-600/70">Relances jour</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-2xl font-bold text-primary">{sections[3].items.length}</div>
                <div className="text-xs text-primary/70">1ers DM à faire</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-600">{sections[2].items.length}</div>
                <div className="text-xs text-yellow-600/70">Réponses</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-2xl font-bold text-green-600">{todayReplyCount}</div>
                <div className="text-xs text-green-600/70">Réponses reçues</div>
              </div>
            </div>
          </Card>

          {/* Sections */}
          {sections.map(section => {
            if (section.items.length === 0) return null;
            return (
              <Card key={section.key} className={`p-6 border-l-4 ${section.color} border-border bg-card shadow-sm`}>
                <h2 className="text-lg font-bold mb-4 text-foreground">
                  {section.label} <Badge variant="secondary" className="ml-2">{section.items.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.prospect.id} className="p-4 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                            {item.prospect.fullName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{item.prospect.fullName}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {item.prospect.position} @ {item.prospect.company}
                            </span>
                          </div>
                          {section.key === 'new' && (
                            <Badge variant="outline" className="text-xs">
                              {sourceLabels[item.prospect.source] || "📤 Outbound"}
                            </Badge>
                          )}
                          {item.followUpNumber && (
                            <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300 text-xs">
                              Relance {item.followUpNumber}
                            </Badge>
                          )}
                          {item.daysLate && item.daysLate > 0 && (
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {item.daysLate}j en retard
                            </Badge>
                          )}
                          {item.isABTest && item.variantName && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              <FlaskConical className="w-3 h-3 mr-1" />
                              {item.variantName}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {item.message && (
                        <div className="relative">
                          <Textarea
                            value={editableMessages[item.prospect.id] ?? item.message}
                            onChange={(e) => setEditableMessages(prev => ({ ...prev, [item.prospect.id]: e.target.value }))}
                            className="bg-background border-border/50 text-sm mb-3 resize-none"
                            rows={Math.min((editableMessages[item.prospect.id] ?? item.message).split('\n').length + 1, 8)}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {item.message && (
                          <Button size="sm" variant="outline" onClick={() => handleCopy(item.message)} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            <Copy className="w-4 h-4 mr-1" /> Copier
                          </Button>
                        )}
                        {item.prospect.linkedinUrl && (
                          <Button size="sm" variant="outline" asChild className="border-[#0077b5] text-[#0077b5] hover:bg-[#0077b5]/10">
                            <a href={item.prospect.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" /> LinkedIn
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/prospects?view=all&edit=${item.prospect.id}`)}
                          className="border-border/50"
                        >
                          Modifier le profil
                        </Button>
                        {(section.key === 'overdue' || section.key === 'today' || section.key === 'new') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleReplyReceived(item.prospect)} className="border-yellow-300 text-yellow-600 hover:bg-yellow-50">
                              <MessageCircle className="w-4 h-4 mr-1" /> Réponse reçue
                            </Button>
                            <Button size="sm" onClick={() => handleMarkDone(item)} className="bg-green-600 hover:bg-green-700 text-white">
                              <Check className="w-4 h-4 mr-1" /> Fait ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAnalyzingProspectId(
                                analyzingProspectId === item.prospect.id ? null : item.prospect.id
                              )}
                              className="border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              Claude
                            </Button>
                          </>
                        )}
                        {section.key === 'responses' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setAnalyzingProspectId(
                                analyzingProspectId === item.prospect.id ? null : item.prospect.id
                              )}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              {analyzingProspectId === item.prospect.id ? "Fermer l'analyse" : "Analyser avec Claude"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotInterested(item.prospect)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Pas intéressé
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Audit SEO Button */}
                      {item.prospect.websiteUrl && (
                        <div className="mt-2">
                          <AuditButton
                            prospectId={item.prospect.id}
                            prospectName={item.prospect.fullName}
                            company={item.prospect.company}
                            websiteUrl={item.prospect.websiteUrl}
                            auditStatus={item.prospect.audit_status}
                            auditScore={item.prospect.audit_score}
                            auditPdfUrl={item.prospect.audit_pdf_url}
                            onAuditGenerated={() => refresh()}
                          />
                        </div>
                      )}

                      {/* Claude ResponseAnalyzer */}
                      {analyzingProspectId === item.prospect.id && (
                        <div className="mt-4">
                          <ResponseAnalyzer
                            prospect={item.prospect}
                            onClose={() => setAnalyzingProspectId(null)}
                            onReplyChosen={() => {
                              setAnalyzingProspectId(null);
                              refresh();
                              loadTodayCount();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {totalItems === 0 && (
            <Card className="p-12 border-border bg-card shadow-sm text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">File du jour vide !</h2>
              <p className="text-muted-foreground">Tu as tout traité. Bravo ! 💪</p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default DailyQueue;
