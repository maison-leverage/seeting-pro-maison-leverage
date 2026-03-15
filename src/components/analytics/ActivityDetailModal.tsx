import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Phone, CheckCircle, RotateCcw, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActivityLog {
  id: string;
  type: 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';
  created_at: string;
  user_name: string;
  lead_id: string;
  prospect_name?: string;
  prospect_company?: string;
}

type ActivityCategory = 'dms' | 'replies' | 'calls' | 'deals';

interface ActivityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ActivityCategory;
  activities: ActivityLog[];
  periodLabel: string;
  onActivityDeleted?: () => void;
}

const categoryConfig: Record<ActivityCategory, {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  types: ActivityLog['type'][];
}> = {
  dms: { title: "DMs Envoyés", icon: Send, color: "text-blue-500", bgColor: "bg-blue-500/10", types: ['first_dm', 'message_sent', 'follow_up_dm'] },
  replies: { title: "Réponses Reçues", icon: MessageCircle, color: "text-yellow-500", bgColor: "bg-yellow-500/10", types: ['reply_received'] },
  calls: { title: "R1 Programmés", icon: Phone, color: "text-green-500", bgColor: "bg-green-500/10", types: ['call_booked'] },
  deals: { title: "Deals Closés", icon: CheckCircle, color: "text-purple-500", bgColor: "bg-purple-500/10", types: ['deal_closed'] }
};

const ActivityDetailModal = ({ open, onOpenChange, category, activities, periodLabel, onActivityDeleted }: ActivityDetailModalProps) => {
  const config = categoryConfig[category];
  const Icon = config.icon;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteActivity, setConfirmDeleteActivity] = useState<ActivityLog | null>(null);

  const filteredActivities = activities.filter(a => config.types.includes(a.type));

  const prospectMap = new Map<string, {
    prospect_name: string;
    prospect_company: string;
    lead_id: string;
    count: number;
    activities: ActivityLog[];
  }>();

  filteredActivities.forEach(activity => {
    const existing = prospectMap.get(activity.lead_id);
    if (existing) {
      existing.count++;
      existing.activities.push(activity);
    } else {
      prospectMap.set(activity.lead_id, {
        prospect_name: activity.prospect_name || 'Prospect archivé',
        prospect_company: activity.prospect_company || '',
        lead_id: activity.lead_id,
        count: 1,
        activities: [activity]
      });
    }
  });

  const uniqueProspects = Array.from(prospectMap.values()).sort((a, b) => {
    const dateA = new Date(a.activities[a.activities.length - 1].created_at).getTime();
    const dateB = new Date(b.activities[b.activities.length - 1].created_at).getTime();
    return dateB - dateA;
  });

  const getTypeLabel = (type: ActivityLog['type']) => {
    switch (type) {
      case 'first_dm': return '1er DM';
      case 'follow_up_dm': return 'Relance';
      case 'message_sent': return 'Message';
      case 'reply_received': return 'Réponse';
      case 'call_booked': return 'R1';
      case 'deal_closed': return 'Deal';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'first_dm':
      case 'message_sent': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'follow_up_dm': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'reply_received': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'call_booked': return 'bg-green-100 text-green-700 border-green-300';
      case 'deal_closed': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleDeleteActivity = async (activity: ActivityLog) => {
    setDeletingId(activity.id);
    try {
      const { error: deleteError } = await supabase.from('activity_logs').delete().eq('id', activity.id);
      if (deleteError) {
        console.error('Error deleting activity:', deleteError);
        toast.error("Erreur lors de la suppression");
        return;
      }

      const updateData: Record<string, any> = {};
      if (activity.type === 'first_dm' || activity.type === 'message_sent') {
        updateData.first_message_date = null;
        updateData.status = 'nouveau';
      } else if (activity.type === 'follow_up_dm') {
        const { data: prospectData } = await supabase.from('prospects').select('follow_up_count').eq('id', activity.lead_id).single();
        if (prospectData) updateData.follow_up_count = Math.max(0, (prospectData.follow_up_count || 1) - 1);
      } else if (activity.type === 'reply_received') {
        updateData.status = 'premier_dm';
      } else if (activity.type === 'call_booked') {
        updateData.status = 'discussion';
      } else if (activity.type === 'deal_closed') {
        updateData.is_deleted = false;
        updateData.deleted_at = null;
        updateData.status = 'r1_booke';
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase.from('prospects').update(updateData).eq('id', activity.lead_id);
        if (updateError) {
          console.error('Error restoring prospect:', updateError);
          toast.error("Activité supprimée mais erreur lors de la restauration du prospect");
          return;
        }
      }

      toast.success("Activité supprimée et prospect restauré !");
      onActivityDeleted?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setDeletingId(null);
      setConfirmDeleteActivity(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>{config.title}</span>
                  <Badge variant="secondary" className="text-lg px-3">{uniqueProspects.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal mt-1">{periodLabel}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {uniqueProspects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucune activité pour cette période</div>
            ) : (
              <div className="space-y-3">
                {uniqueProspects.map((prospect, index) => (
                  <div key={prospect.lead_id} className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-mono">#{index + 1}</span>
                          <h4 className="font-semibold text-foreground truncate">{prospect.prospect_name}</h4>
                        </div>
                        {prospect.prospect_company && (
                          <p className="text-sm text-muted-foreground mt-1">{prospect.prospect_company}</p>
                        )}
                        <div className="space-y-2 mt-3">
                          {prospect.activities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(activity.type)}`}>
                                  {getTypeLabel(activity.type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(activity.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                                </span>
                              </div>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => setConfirmDeleteActivity(activity)}
                                disabled={deletingId === activity.id}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Supprimer cette activité et restaurer le prospect"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="pt-4 border-t border-border/50">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total : {filteredActivities.length} activités</span>
              <span>{uniqueProspects.length} prospects uniques</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDeleteActivity} onOpenChange={() => setConfirmDeleteActivity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer l'activité <strong>{confirmDeleteActivity && getTypeLabel(confirmDeleteActivity.type)}</strong> pour{" "}
              <strong>{confirmDeleteActivity?.prospect_name}</strong> et restaurer le prospect à son état précédent.
              {confirmDeleteActivity?.type === 'deal_closed' && (
                <span className="block mt-2 text-orange-600 font-medium">⚠️ Le prospect sera également désarchivé.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteActivity && handleDeleteActivity(confirmDeleteActivity)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer et restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActivityDetailModal;
