import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, SkipForward, MessageCircle, Check, AlertTriangle, Clock, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProspects } from "@/hooks/useProspects";
import { Prospect, ProspectSource } from "@/types/prospect";
import { isPast, isToday, addDays, differenceInDays, startOfDay, endOfDay } from "date-fns";

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

// Pick a random variant from matching category
const pickVariant = (variants: MessageVariant[], category: string): MessageVariant | null => {
  const matching = variants.filter(v => v.category === category);
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
};

// Message templates
const getFirstMessageFallback = (prospect: Prospect): string => {
  const prenom = prospect.fullName.split(" ")[0];
  const templates: Record<ProspectSource, string> = {
    inbound: `Salut ${prenom} 👋\n\nMerci pour l'ajout ! J'ai vu que tu étais ${prospect.position} chez ${prospect.company}.\n\nOn accompagne des entreprises comme la tienne en SEO & GEO pour générer du trafic qualifié.\n\nEst-ce que c'est un sujet qui t'intéresse ?`,
    visiteur_profil: `Salut ${prenom} 👋\n\nJ'ai vu que tu avais visité mon profil — curieux de savoir ce qui t'a attiré !\n\nTu es ${prospect.position} chez ${prospect.company}, c'est bien ça ?\n\nOn aide des entreprises comme la tienne à se positionner sur Google grâce au SEO & GEO.\n\nÇa te parle ?`,
    relation_dormante: `Salut ${prenom} 👋\n\nOn est connectés depuis un moment mais on n'a jamais échangé !\n\nJe vois que tu es ${prospect.position} chez ${prospect.company} — on accompagne justement des entreprises comme la tienne en SEO & GEO.\n\nEst-ce que c'est un sujet d'actualité pour toi ?`,
    outbound: `Salut ${prenom} 👋\n\nJe me permets de te contacter car ton profil de ${prospect.position} chez ${prospect.company} a retenu mon attention.\n\nOn accompagne des PME/TPE en SEO & GEO pour générer du trafic qualifié et des leads.\n\nEst-ce que c'est un levier que vous exploitez déjà ?`,
  };
  return templates[prospect.source] || templates.outbound;
};

const getFollowUpFallback = (prospect: Prospect, followUpNumber: number): string => {
  const prenom = prospect.fullName.split(" ")[0];
  const messages: Record<number, string> = {
    1: `Salut ${prenom}, je me permets de revenir vers toi 😊\n\nAs-tu eu l'occasion de réfléchir à ce que je t'avais partagé sur le SEO & GEO ?\n\nJe serais ravie d'en discuter si ça t'intéresse !`,
    2: `${prenom}, petit message rapide 👋\n\nJe ne veux pas être insistante, mais je pense vraiment qu'on pourrait t'apporter de la valeur côté visibilité en ligne.\n\nSi c'est pas le bon moment, dis-le moi, pas de souci !`,
    3: `Dernier petit message ${prenom} 😊\n\nJe comprends que tu sois occupé(e). Si jamais le SEO & GEO devient un sujet, n'hésite pas à revenir vers moi.\n\nBelle journée ! ☀️`,
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
  const [variants, setVariants] = useState<MessageVariant[]>([]);

  useEffect(() => {
    loadTodayCount();
    loadVariants();
  }, []);

  const loadTodayCount = async () => {
    const today = new Date();
    const { count } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay(today).toISOString())
      .lte('created_at', endOfDay(today).toISOString());
    setTodayActivityCount(count || 0);
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

  // Helper function to get first message with A/B testing
  const getFirstMessage = (prospect: Prospect): { message: string; variantId?: string; variantName?: string; isABTest?: boolean } => {
    const category = `first_dm_${prospect.source}`;
    const variant = pickVariant(variants, category);
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

  // Helper function to get follow-up message with A/B testing
  const getFollowUpMessage = (prospect: Prospect, followUpNumber: number): { message: string; variantId?: string; variantName?: string; isABTest?: boolean } => {
    const category = `followup_${followUpNumber}`;
    const variant = pickVariant(variants, category);
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
  const progressPercent = Math.min((todayActivityCount / 50) * 100, 100);

  const sourceLabels: Record<string, string> = {
    inbound: "📥 Inbound",
    visiteur_profil: "👁️ Visiteur",
    relation_dormante: "💤 Dormant",
    outbound: "📤 Outbound",
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
        .order('created_at', { ascending: false })
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

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header notificationCount={todayCount} />
        <main className="p-6 space-y-6 animate-fade-in">
          {/* Progress bar */}
          <Card className="p-6 border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-foreground">📋 Ma file du jour</h1>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {todayActivityCount}/50 messages
              </Badge>
            </div>
            <Progress value={progressPercent} className="h-3 mb-4" />
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="text-2xl font-bold text-destructive">{sections[0].items.length}</div>
                <div className="text-xs text-destructive/70">En retard</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="text-2xl font-bold text-orange-600">{sections[0].items.length + sections[1].items.length}</div>
                <div className="text-xs text-orange-600/70">Relances</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-2xl font-bold text-primary">{sections[3].items.length}</div>
                <div className="text-xs text-primary/70">1ers DM</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-600">{sections[2].items.length}</div>
                <div className="text-xs text-yellow-600/70">Réponses</div>
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
                          {item.isABTest && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              <FlaskConical className="w-3 h-3 mr-1" />
                              A/B Test
                            </Badge>
                          )}
                        </div>
                      </div>

                      {item.message && (
                        <Textarea
                          readOnly
                          value={item.message}
                          className="bg-background border-border/50 text-sm mb-3 resize-none"
                          rows={Math.min(item.message.split('\n').length + 1, 8)}
                        />
                      )}

                      <div className="flex gap-2">
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
                        {(section.key === 'overdue' || section.key === 'today' || section.key === 'new') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleReplyReceived(item.prospect)} className="border-yellow-300 text-yellow-600 hover:bg-yellow-50">
                              <MessageCircle className="w-4 h-4 mr-1" /> Réponse reçue
                            </Button>
                            <Button size="sm" onClick={() => handleMarkDone(item)} className="bg-green-600 hover:bg-green-700 text-white">
                              <Check className="w-4 h-4 mr-1" /> Fait ✓
                            </Button>
                          </>
                        )}
                      </div>
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
