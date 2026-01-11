import { Prospect } from "@/types/prospect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, Send, MessageCircle, Phone, CheckCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const statusConfig = {
  rien: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  premier_message: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  discussion: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  r1_programme: { color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const priorityConfig = {
  "rien": { label: "⚪ Rien", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  "2": { label: "2e relance", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "3": { label: "3e relance", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  "4": { label: "4e relance", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  "5": { label: "5e relance", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "6": { label: "6e relance", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "7": { label: "7e relance", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "8": { label: "8e relance", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  "9": { label: "9e relance", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  "10": { label: "10e relance", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const qualificationConfig = {
  rien: { label: "⚪ Rien", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  loom: { label: "🎥 Loom", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  video_youtube: { label: "▶️ Vidéo Youtube", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  presentation_genspark: { label: "✨ Présentation Genspark", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  magnus_opus: { label: "💎 Magnus Opus", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

const hypeConfig = {
  rien: { label: "⚪ Rien", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  froid: { label: "❄️ Froid", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  tiede: { label: "🌤️ Tiède", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  chaud: { label: "🔥 Chaud", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

type ActivityType = 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';

const ProspectCard = ({ prospect, onEdit, onDelete, onActivityLogged }: ProspectCardProps) => {
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

    // Create activity log
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        type,
        user_name: userName,
        lead_id: prospect.id,
        user_id: session.user.id
      });

    if (logError) {
      console.error('Error logging activity:', logError);
      toast.error("Erreur lors de l'enregistrement");
      return;
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
        return;
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
  };

  const handleDMSent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Bloquer si déjà contacté (anti-triche)
    if (prospect.firstMessageDate) {
      const date = new Date(prospect.firstMessageDate).toLocaleDateString('fr-FR');
      toast.error(`Ce prospect a déjà été contacté le ${date}. Utilise "Relance" si tu veux le recontacter.`);
      return;
    }
    
    // Enregistrer le premier DM
    await logActivity('first_dm', 'premier_message');
    
    // Mettre à jour first_message_date sur le prospect
    const { error } = await supabase
      .from('prospects')
      .update({ first_message_date: new Date().toISOString() })
      .eq('id', prospect.id);
    
    if (error) {
      console.error('Error updating first_message_date:', error);
    }
  };

  const handleFollowUpSent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Les relances ne comptent pas dans les quotas
    await logActivity('follow_up_dm');
    
    // Incrémenter le compteur de relances
    const { error } = await supabase
      .from('prospects')
      .update({ follow_up_count: prospect.followUpCount + 1 })
      .eq('id', prospect.id);
    
    if (error) {
      console.error('Error updating follow_up_count:', error);
    }
  };

  const handleReplyReceived = (e: React.MouseEvent) => {
    e.stopPropagation();
    logActivity('reply_received', 'discussion');
  };

  const handleCallBooked = (e: React.MouseEvent) => {
    e.stopPropagation();
    logActivity('call_booked', 'r1_programme');
  };

  const handleDealClosed = (e: React.MouseEvent) => {
    e.stopPropagation();
    logActivity('deal_closed');
  };

  return (
    <Card
      className={`p-4 border-border/50 hover:border-primary/50 transition-all hover-scale relative cursor-pointer ${
        hasReminderToday ? "border-destructive/50 glow-secondary" : ""
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
            <h3 className="text-lg font-bold truncate">
              {prospect.fullName}
            </h3>
            <p className="text-muted-foreground text-sm truncate">
              {prospect.position} {prospect.position && prospect.company && "chez"} {prospect.company}
            </p>
          </div>

          {/* Center: Badges */}
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant="outline" className={statusConfig[prospect.status].color}>
              {getStatusLabel(prospect.status, prospect.followUpCount)}
            </Badge>
            <Badge variant="outline" className={priorityConfig[prospect.priority].color}>
              {priorityConfig[prospect.priority].label}
            </Badge>
            <Badge variant="outline" className={qualificationConfig[prospect.qualification].color}>
              {qualificationConfig[prospect.qualification].label}
            </Badge>
            <Badge variant="outline" className={hypeConfig[prospect.hype].color}>
              {hypeConfig[prospect.hype].label}
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
                className="border-border/50 hover:border-primary hover:bg-primary/10"
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
                className="border-border/50 hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom row: Quick action buttons */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          {/* Premier DM - bloqué si déjà contacté */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDMSent}
            disabled={!!prospect.firstMessageDate}
            className={`flex-1 ${
              prospect.firstMessageDate 
                ? 'border-gray-500/30 text-gray-500 cursor-not-allowed opacity-50' 
                : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500'
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
                ? 'border-gray-500/30 text-gray-500 cursor-not-allowed opacity-50' 
                : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500'
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
            className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Réponse
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCallBooked}
            className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDealClosed}
            className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Deal
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProspectCard;
