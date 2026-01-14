import { useState, useEffect } from "react";
import { Prospect } from "@/types/prospect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Archive, Clock, Send, MessageCircle, Phone, CheckCircle, RotateCcw, Linkedin, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUndoableActionContext } from "@/contexts/UndoableActionContext";

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onActivityLogged?: () => void;
}

const getStatusLabel = (status: string, followUpCount: number) => {
  const baseLabels = {
    rien: "⚪ Rien",
    premier_message: "📩 1ᵉʳ message envoyé",
    discussion: "🗣️ En discussion",
    r1_programme: "🎯 R1 programmé",
  };
  
  const label = baseLabels[status as keyof typeof baseLabels] || status;
  return followUpCount > 0 ? `${label} (${followUpCount} relance${followUpCount > 1 ? 's' : ''})` : label;
};

const defaultConfig = { label: "⚪ Inconnu", color: "bg-gray-100 text-gray-700 border-gray-300" };

const statusConfig: Record<string, { color: string }> = {
  rien: { color: "bg-gray-100 text-gray-700 border-gray-300" },
  premier_message: { color: "bg-blue-100 text-blue-700 border-blue-300" },
  discussion: { color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  r1_programme: { color: "bg-green-100 text-green-700 border-green-300" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  "rien": { label: "⚪ Rien", color: "bg-gray-100 text-gray-700 border-gray-300" },
  "2": { label: "2e relance", color: "bg-blue-100 text-blue-700 border-blue-300" },
  "3": { label: "3e relance", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  "4": { label: "4e relance", color: "bg-teal-100 text-teal-700 border-teal-300" },
  "5": { label: "5e relance", color: "bg-green-100 text-green-700 border-green-300" },
  "6": { label: "6e relance", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  "7": { label: "7e relance", color: "bg-orange-100 text-orange-700 border-orange-300" },
  "8": { label: "8e relance", color: "bg-red-100 text-red-700 border-red-300" },
  "9": { label: "9e relance", color: "bg-pink-100 text-pink-700 border-pink-300" },
  "10": { label: "10e relance", color: "bg-purple-100 text-purple-700 border-purple-300" },
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

const getStatusConfig = (key: string) => statusConfig[key] || { color: defaultConfig.color };
const getPriorityConfig = (key: string) => priorityConfig[key] || defaultConfig;
const getQualificationConfig = (key: string) => qualificationConfig[key] || defaultConfig;
const getHypeConfig = (key: string) => hypeConfig[key] || defaultConfig;

type ActivityType = 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';

const ProspectCard = ({ prospect, onEdit, onDelete, onActivityLogged }: ProspectCardProps) => {
  const { addUndoableAction, canUndo, getTimeRemaining, undoAction } = useUndoableActionContext();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Check for undoable action and update timer
  useEffect(() => {
    if (!currentUserId) return;
    
    const action = canUndo(prospect.id, currentUserId);
    if (action) {
      setUndoTimeRemaining(getTimeRemaining(action));
      
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(action);
        setUndoTimeRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setUndoTimeRemaining(0);
    }
  }, [currentUserId, canUndo, getTimeRemaining, prospect.id]);

  const undoableAction = currentUserId ? canUndo(prospect.id, currentUserId) : null;

  const isReminderToday = () => {
    if (!prospect.reminderDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminder = new Date(prospect.reminderDate);
    reminder.setHours(0, 0, 0, 0);
    return reminder <= today;
  };

  const hasReminderToday = isReminderToday();

  const logActivity = async (type: ActivityType, updateStatus?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Vous devez être connecté");
      return;
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .maybeSingle();

    const userName = profile?.name || session.user.email || 'Utilisateur';

    // Create activity log with prospect info for anti-cheat (survives archiving)
    const activityData = {
      type,
      user_name: userName,
      lead_id: prospect.id,
      user_id: session.user.id,
      prospect_name: prospect.fullName,
      prospect_company: prospect.company
    };
    
    const { data: insertedData, error: logError } = await supabase
      .from('activity_logs')
      .insert(activityData)
      .select()
      .single();

    if (logError) {
      console.error('Error logging activity:', logError);
      toast.error("Erreur lors de l'enregistrement");
      return null;
    }

    // Update prospect status if needed
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
      first_dm: 'Premier DM enregistré',
      follow_up_dm: 'Relance enregistrée'
    };

    toast.success(labels[type]);
    onActivityLogged?.();
    
    // Return activity data for undo tracking
    return insertedData;
  };

  const handleUndo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!undoableAction) return;
    
    const success = await undoAction(undoableAction);
    if (success) {
      onActivityLogged?.();
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDMSent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Bloquer si déjà contacté (anti-triche)
    if (prospect.firstMessageDate) {
      const date = new Date(prospect.firstMessageDate).toLocaleDateString('fr-FR');
      toast.error(`Ce prospect a déjà été contacté le ${date}. Utilise "Relance" si tu veux le recontacter.`);
      return;
    }
    
    const previousStatus = prospect.status;
    const previousFirstMessageDate = prospect.firstMessageDate;
    
    // Enregistrer le premier DM
    const activityData = await logActivity('first_dm', 'premier_message');
    if (!activityData) return;
    
    // Mettre à jour first_message_date sur le prospect
    const { error } = await supabase
      .from('prospects')
      .update({ first_message_date: new Date().toISOString() })
      .eq('id', prospect.id);
    
    if (error) {
      console.error('Error updating first_message_date:', error);
    }

    // Track for undo
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
  };

  const handleFollowUpSent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const previousFollowUpCount = prospect.followUpCount;
    
    // Les relances ne comptent pas dans les quotas
    const activityData = await logActivity('follow_up_dm');
    if (!activityData) return;
    
    // Incrémenter le compteur de relances
    const { error } = await supabase
      .from('prospects')
      .update({ follow_up_count: prospect.followUpCount + 1 })
      .eq('id', prospect.id);
    
    if (error) {
      console.error('Error updating follow_up_count:', error);
    }

    // Track for undo
    if (currentUserId) {
      addUndoableAction({
        activityId: activityData.id,
        prospectId: prospect.id,
        type: 'follow_up_dm',
        previousFollowUpCount,
        userId: currentUserId,
      });
    }
  };

  const handleReplyReceived = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousStatus = prospect.status;
    const activityData = await logActivity('reply_received', 'discussion');
    
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
    const activityData = await logActivity('call_booked', 'r1_programme');
    
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
    
    // Vérifier si ce prospect a déjà été closé (anti-doublon)
    const { data: existingDeal } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('lead_id', prospect.id)
      .eq('type', 'deal_closed')
      .maybeSingle();
    
    if (existingDeal) {
      toast.error("Ce prospect a déjà été closé. Un prospect ne peut être closé qu'une seule fois.");
      return;
    }
    
    const activityData = await logActivity('deal_closed');
    
    if (activityData) {
      // Archiver le prospect automatiquement après un deal closé
      const { error: archiveError } = await supabase
        .from('prospects')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', prospect.id);
      
      if (archiveError) {
        console.error('Error archiving prospect:', archiveError);
      } else {
        toast.success("Prospect archivé automatiquement");
      }
      
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

  return (
    <Card
      className={`p-4 bg-card border-border hover:border-primary/50 transition-all hover-scale relative cursor-pointer shadow-sm ${
        hasReminderToday ? "border-destructive/50 ring-2 ring-destructive/20" : ""
      }`}
      onClick={() => onEdit(prospect)}
    >
      {/* Badge reminder */}
      {hasReminderToday && (
        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          À relancer !
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Top row: Name, Company, Badges */}
        <div className="flex items-center gap-4 justify-between">
          {/* Left: Name and Company */}
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

          {/* Center: Badges */}
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant="outline" className={getStatusConfig(prospect.status).color}>
              {getStatusLabel(prospect.status, prospect.followUpCount)}
            </Badge>
            <Badge variant="outline" className={getPriorityConfig(prospect.priority).color}>
              {getPriorityConfig(prospect.priority).label}
            </Badge>
            <Badge variant="outline" className={getQualificationConfig(prospect.qualification).color}>
              {getQualificationConfig(prospect.qualification).label}
            </Badge>
            <Badge variant="outline" className={getHypeConfig(prospect.hype).color}>
              {getHypeConfig(prospect.hype).label}
            </Badge>
          </div>

          {/* Right: Reminder info and Actions */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(prospect);
                }}
                className="border-border hover:border-primary hover:bg-primary/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(prospect.id);
                }}
                className="border-border hover:border-orange-500 hover:bg-orange-100 hover:text-orange-600"
                title="Archiver ce prospect"
              >
                <Archive className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom row: Quick action buttons */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {/* Premier DM - bloqué si déjà contacté */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDMSent}
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
          {/* Relance - disponible uniquement si déjà contacté */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleFollowUpSent}
            disabled={!prospect.firstMessageDate}
            className={`flex-1 ${
              !prospect.firstMessageDate 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                : 'border-cyan-300 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400'
            }`}
            title={!prospect.firstMessageDate ? 'Doit être contacté en premier' : 'Enregistrer une relance (ne compte pas dans les quotas)'}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Relance
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
          
          {/* Bouton d'annulation - visible pendant 5 minutes après une action */}
          {undoableAction && undoTimeRemaining > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 animate-pulse"
              title={`Annuler la dernière action (${formatTimeRemaining(undoTimeRemaining)} restantes)`}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Annuler ({formatTimeRemaining(undoTimeRemaining)})
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProspectCard;