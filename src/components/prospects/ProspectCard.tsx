import { useState, useEffect } from "react";
import { Prospect, ProspectStatus } from "@/types/prospect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Archive, Clock, Send, MessageCircle, Phone, CheckCircle, RotateCcw, Linkedin, Undo2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUndoableActionContext } from "@/contexts/UndoableActionContext";
import { addDays, differenceInDays, format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import MessageTypeSelector from "./MessageTypeSelector";

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onActivityLogged?: () => void;
}

const getStatusLabel = (status: string, followUpCount: number) => {
  const baseLabels: Record<string, string> = {
    // New statuses
    nouveau: "🆕 Nouveau",
    premier_dm: "📩 1er DM envoyé",
    relance: "🔄 En relance",
    reponse: "💬 Réponse reçue",
    discussion: "🗣️ En discussion",
    demande_dispos: "📅 Dispos demandées",
    r1_booke: "🎯 R1 booké",
    r1_fait: "✅ R1 fait",
    r2_booke: "📆 R2 booké",
    signe: "🏆 Signé",
    perdu: "❌ Perdu",
    // Legacy compatibility
    rien: "🆕 Nouveau",
    premier_message: "📩 1er DM envoyé",
    r1_programme: "🎯 R1 booké",
  };
  return baseLabels[status] || status;
};

const statusConfig: Record<string, { color: string }> = {
  nouveau: { color: "bg-gray-100 text-gray-700 border-gray-300" },
  premier_dm: { color: "bg-blue-100 text-blue-700 border-blue-300" },
  relance: { color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  reponse: { color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  discussion: { color: "bg-orange-100 text-orange-700 border-orange-300" },
  demande_dispos: { color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  r1_booke: { color: "bg-green-100 text-green-700 border-green-300" },
  r1_fait: { color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  r2_booke: { color: "bg-teal-100 text-teal-700 border-teal-300" },
  signe: { color: "bg-purple-100 text-purple-700 border-purple-300" },
  perdu: { color: "bg-red-100 text-red-700 border-red-300" },
  // Legacy
  rien: { color: "bg-gray-100 text-gray-700 border-gray-300" },
  premier_message: { color: "bg-blue-100 text-blue-700 border-blue-300" },
  r1_programme: { color: "bg-green-100 text-green-700 border-green-300" },
};

const sourceConfig: Record<string, { label: string; color: string }> = {
  inbound: { label: "📥 Inbound", color: "bg-green-100 text-green-700 border-green-300" },
  visiteur_profil: { label: "👁️ Visiteur profil", color: "bg-blue-100 text-blue-700 border-blue-300" },
  relation_dormante: { label: "💤 Relation dormante", color: "bg-amber-100 text-amber-700 border-amber-300" },
  outbound: { label: "📤 Outbound", color: "bg-purple-100 text-purple-700 border-purple-300" },
};

const qualificationConfig: Record<string, { label: string; color: string }> = {
  rien: { label: "⚪ Rien", color: "bg-gray-100 text-gray-700 border-gray-300" },
  loom: { label: "🎥 Loom", color: "bg-purple-100 text-purple-700 border-purple-300" },
  video_youtube: { label: "▶️ Vidéo Youtube", color: "bg-red-100 text-red-700 border-red-300" },
  presentation_genspark: { label: "✨ Présentation Genspark", color: "bg-blue-100 text-blue-700 border-blue-300" },
  magnus_opus: { label: "💎 Magnus Opus", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
};

const hypeConfig: Record<string, { label: string; color: string }> = {
  rien: { label: "⚪ Rien", color: "bg-gray-100 text-gray-700 border-gray-300" },
  froid: { label: "❄️ Froid", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  tiede: { label: "🌤️ Tiède", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  chaud: { label: "🔥 Chaud", color: "bg-red-100 text-red-700 border-red-300" },
};

const defaultConfig = { label: "⚪ Inconnu", color: "bg-gray-100 text-gray-700 border-gray-300" };
const getStatusConfig = (key: string) => statusConfig[key] || { color: defaultConfig.color };
const getSourceConfig = (key: string) => sourceConfig[key] || defaultConfig;
const getQualificationConfig = (key: string) => qualificationConfig[key] || defaultConfig;
const getHypeConfig = (key: string) => hypeConfig[key] || defaultConfig;

// Follow-up SOP timing: J+4, J+10, J+15
const FOLLOW_UP_DAYS = [4, 10, 15];

const getFollowUpInfo = (followUpCount: number, firstMessageDate?: string) => {
  if (!firstMessageDate || followUpCount >= 3) return null;
  
  const firstDate = new Date(firstMessageDate);
  const nextFollowUpDay = FOLLOW_UP_DAYS[followUpCount];
  const nextDate = addDays(firstDate, nextFollowUpDay);
  const daysUntil = differenceInDays(nextDate, new Date());
  const isReady = isPast(nextDate) || isToday(nextDate);
  const isLate = isPast(nextDate) && !isToday(nextDate);
  
  return {
    number: followUpCount + 1,
    dayLabel: `J+${nextFollowUpDay}`,
    nextDate,
    daysUntil,
    isReady,
    isLate,
  };
};

type ActivityType = 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';

const ProspectCard = ({ prospect, onEdit, onDelete, onActivityLogged }: ProspectCardProps) => {
  const { addUndoableAction, canUndo, getTimeRemaining, undoAction } = useUndoableActionContext();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState<number>(0);
  const [messageTypeOpen, setMessageTypeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'first_dm' | 'follow_up' | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const action = canUndo(prospect.id, currentUserId);
    if (action) {
      setUndoTimeRemaining(getTimeRemaining(action));
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(action);
        setUndoTimeRemaining(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setUndoTimeRemaining(0);
    }
  }, [currentUserId, canUndo, getTimeRemaining, prospect.id]);

  const undoableAction = currentUserId ? canUndo(prospect.id, currentUserId) : null;
  const followUpInfo = getFollowUpInfo(prospect.followUpCount, prospect.firstMessageDate);

  const isReminderToday = () => {
    if (!prospect.reminderDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminder = new Date(prospect.reminderDate);
    reminder.setHours(0, 0, 0, 0);
    return reminder <= today;
  };

  const hasReminderToday = isReminderToday();

  const logActivity = async (type: ActivityType, messageType: 'dm' | 'inmail' = 'dm', updateStatus?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Vous devez être connecté");
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .maybeSingle();

    const userName = profile?.name || session.user.email || 'Utilisateur';

    const { data: insertedData, error: logError } = await supabase
      .from('activity_logs')
      .insert({
        type,
        user_name: userName,
        lead_id: prospect.id,
        user_id: session.user.id,
        prospect_name: prospect.fullName,
        prospect_company: prospect.company,
        message_type: messageType,
      } as any)
      .select()
      .single();

    if (logError) {
      console.error('Error logging activity:', logError);
      toast.error("Erreur lors de l'enregistrement");
      return null;
    }

    if (updateStatus) {
      const { error: updateError } = await supabase
        .from('prospects')
        .update({ status: updateStatus })
        .eq('id', prospect.id);

      if (updateError) {
        console.error('Error updating prospect:', updateError);
        toast.error("Erreur lors de la mise à jour du statut");
        return null;
      }
    }

    const labels: Record<ActivityType, string> = {
      message_sent: 'Nouvelle conversation créée',
      reply_received: 'Réponse enregistrée',
      call_booked: 'Call booké',
      deal_closed: 'Deal closé',
      first_dm: `Premier ${messageType === 'inmail' ? 'InMail' : 'DM'} enregistré`,
      follow_up_dm: `Relance ${prospect.followUpCount + 1} enregistrée (${messageType === 'inmail' ? 'InMail' : 'DM'})`
    };

    toast.success(labels[type]);
    onActivityLogged?.();
    return insertedData;
  };

  const handleUndo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!undoableAction) return;
    const success = await undoAction(undoableAction);
    if (success) onActivityLogged?.();
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDMClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prospect.firstMessageDate) {
      const date = new Date(prospect.firstMessageDate).toLocaleDateString('fr-FR');
      toast.error(`Ce prospect a déjà été contacté le ${date}. Utilise "Relance" si tu veux le recontacter.`);
      return;
    }
    setPendingAction('first_dm');
    setMessageTypeOpen(true);
  };

  const handleFollowUpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prospect.followUpCount >= 3) {
      toast.error("Maximum 3 relances atteint (SOP). Pas de relance supplémentaire.");
      return;
    }
    if (followUpInfo && !followUpInfo.isReady) {
      toast.error(`Trop tôt ! La relance ${followUpInfo.number} (${followUpInfo.dayLabel}) est prévue le ${format(followUpInfo.nextDate, "dd/MM/yyyy", { locale: fr })}`);
      return;
    }
    setPendingAction('follow_up');
    setMessageTypeOpen(true);
  };

  const handleMessageTypeSelected = async (messageType: 'dm' | 'inmail') => {
    setMessageTypeOpen(false);
    
    if (pendingAction === 'first_dm') {
      const previousStatus = prospect.status;
      const previousFirstMessageDate = prospect.firstMessageDate;
      
      const activityData = await logActivity('first_dm', messageType, 'premier_dm');
      if (!activityData) return;
      
      const now = new Date();
      const nextReminder = addDays(now, FOLLOW_UP_DAYS[0]);
      
      await supabase
        .from('prospects')
        .update({ 
          first_message_date: now.toISOString(),
          reminder_date: nextReminder.toISOString(),
        })
        .eq('id', prospect.id);

      if (currentUserId) {
        addUndoableAction({
          activityId: activityData.id,
          prospectId: prospect.id,
          type: 'first_dm',
          previousStatus,
          previousFirstMessageDate: previousFirstMessageDate || null,
          userId: currentUserId,
        });
      }
    } else if (pendingAction === 'follow_up') {
      const previousFollowUpCount = prospect.followUpCount;
      
      const activityData = await logActivity('follow_up_dm', messageType);
      if (!activityData) return;
      
      const newFollowUpCount = prospect.followUpCount + 1;
      
      const updateData: Record<string, any> = { follow_up_count: newFollowUpCount };
      
      if (newFollowUpCount < 3 && prospect.firstMessageDate) {
        const nextDay = FOLLOW_UP_DAYS[newFollowUpCount];
        const nextReminder = addDays(new Date(prospect.firstMessageDate), nextDay);
        updateData.reminder_date = nextReminder.toISOString();
      } else {
        updateData.reminder_date = null;
      }
      
      await supabase
        .from('prospects')
        .update(updateData)
        .eq('id', prospect.id);

      if (currentUserId) {
        addUndoableAction({
          activityId: activityData.id,
          prospectId: prospect.id,
          type: 'follow_up_dm',
          previousFollowUpCount,
          userId: currentUserId,
        });
      }
    }
    
    setPendingAction(null);
  };

  const handleReplyReceived = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousStatus = prospect.status;
    const activityData = await logActivity('reply_received', 'dm', 'reponse');
    if (activityData && currentUserId) {
      addUndoableAction({
        activityId: activityData.id,
        prospectId: prospect.id,
        type: 'reply_received',
        previousStatus,
        userId: currentUserId,
      });
    }
  };

  const handleCallBooked = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousStatus = prospect.status;
    const activityData = await logActivity('call_booked', 'dm', 'r1_booke');
    if (activityData && currentUserId) {
      addUndoableAction({
        activityId: activityData.id,
        prospectId: prospect.id,
        type: 'call_booked',
        previousStatus,
        userId: currentUserId,
      });
    }
  };

  const handleDealClosed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: existingDeal } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('lead_id', prospect.id)
      .eq('type', 'deal_closed')
      .maybeSingle();
    
    if (existingDeal) {
      toast.error("Ce prospect a déjà été closé.");
      return;
    }
    
    const activityData = await logActivity('deal_closed', 'dm', 'signe');
    if (activityData) {
      if (currentUserId) {
        addUndoableAction({
          activityId: activityData.id,
          prospectId: prospect.id,
          type: 'deal_closed',
          userId: currentUserId,
        });
      }
    }
  };

  const renderFollowUpBadge = () => {
    if (prospect.followUpCount >= 3) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
          ✅ 3/3 relances terminées
        </Badge>
      );
    }
    if (!prospect.firstMessageDate) return null;
    if (!followUpInfo) return null;

    if (followUpInfo.isLate) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Relance {followUpInfo.number} ({followUpInfo.dayLabel}) – EN RETARD
        </Badge>
      );
    }
    if (followUpInfo.isReady) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
          ✅ Relance {followUpInfo.number} ({followUpInfo.dayLabel}) – PRÊTE
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
        ⏳ Relance {followUpInfo.number} ({followUpInfo.dayLabel}) dans {followUpInfo.daysUntil}j
      </Badge>
    );
  };

  return (
    <>
      <Card
        className={`p-4 bg-card border-border hover:border-primary/50 transition-all hover-scale relative cursor-pointer shadow-sm ${
          hasReminderToday ? "border-destructive/50 ring-2 ring-destructive/20" : ""
        }`}
        onClick={() => onEdit(prospect)}
      >
        {hasReminderToday && (
          <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            À relancer !
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Top row */}
          <div className="flex items-center gap-4 justify-between">
            <div className="flex-shrink-0 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground truncate">
                  {prospect.fullName}
                </h3>
                {prospect.linkedinUrl && (
                  <a
                    href={prospect.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#0077b5] hover:text-[#005885] transition-colors"
                    title="Ouvrir le profil LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
              <p className="text-muted-foreground text-sm truncate">
                {prospect.position} {prospect.position && prospect.company && "chez"} {prospect.company}
              </p>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <Badge variant="outline" className={getStatusConfig(prospect.status).color}>
                {getStatusLabel(prospect.status, prospect.followUpCount)}
              </Badge>
              <Badge variant="outline" className={getSourceConfig(prospect.source).color}>
                {getSourceConfig(prospect.source).label}
              </Badge>
              {renderFollowUpBadge()}
              <Badge variant="outline" className={getQualificationConfig(prospect.qualification).color}>
                {getQualificationConfig(prospect.qualification).label}
              </Badge>
              <Badge variant="outline" className={getHypeConfig(prospect.hype).color}>
                {getHypeConfig(prospect.hype).label}
              </Badge>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {prospect.reminderDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {new Date(prospect.reminderDate).toLocaleDateString("fr-FR")}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onEdit(prospect); }}
                  className="border-border hover:border-primary hover:bg-primary/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onDelete(prospect.id); }}
                  className="border-border hover:border-orange-500 hover:bg-orange-100 hover:text-orange-600"
                  title="Archiver ce prospect"
                >
                  <Archive className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom: Quick actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDMClick}
              disabled={!!prospect.firstMessageDate}
              className={`flex-1 ${
                prospect.firstMessageDate 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
              }`}
              title={prospect.firstMessageDate ? `Déjà contacté le ${new Date(prospect.firstMessageDate).toLocaleDateString('fr-FR')}` : 'Enregistrer le premier DM'}
            >
              <Send className="w-4 h-4 mr-2" />
              1er DM
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFollowUpClick}
              disabled={!prospect.firstMessageDate || prospect.followUpCount >= 3}
              className={`flex-1 ${
                !prospect.firstMessageDate || prospect.followUpCount >= 3
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                  : followUpInfo?.isLate
                    ? 'border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 animate-pulse'
                    : followUpInfo?.isReady
                      ? 'border-green-400 text-green-600 hover:bg-green-50 hover:border-green-500'
                      : 'border-cyan-300 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400'
              }`}
              title={
                prospect.followUpCount >= 3 
                  ? 'Maximum 3 relances atteint' 
                  : followUpInfo 
                    ? `Relance ${followUpInfo.number} (${followUpInfo.dayLabel})` 
                    : 'Doit être contacté en premier'
              }
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {prospect.followUpCount >= 3 
                ? 'Max atteint' 
                : followUpInfo 
                  ? `Relance ${followUpInfo.number}` 
                  : 'Relance'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReplyReceived}
              className="flex-1 border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Réponse
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCallBooked}
              className="flex-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDealClosed}
              className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Deal
            </Button>
            
            {undoableAction && undoTimeRemaining > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 animate-pulse"
                title={`Annuler (${formatTimeRemaining(undoTimeRemaining)})`}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Annuler ({formatTimeRemaining(undoTimeRemaining)})
              </Button>
            )}
          </div>
        </div>
      </Card>

      <MessageTypeSelector
        open={messageTypeOpen}
        onSelect={handleMessageTypeSelected}
        onClose={() => { setMessageTypeOpen(false); setPendingAction(null); }}
        title={pendingAction === 'first_dm' ? "1er message – DM ou InMail ?" : `Relance ${followUpInfo?.number || ''} – DM ou InMail ?`}
      />
    </>
  );
};

export default ProspectCard;
