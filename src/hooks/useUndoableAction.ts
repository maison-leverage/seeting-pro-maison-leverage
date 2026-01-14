import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UndoableAction {
  activityId: string;
  prospectId: string;
  type: string;
  previousStatus?: string;
  previousFollowUpCount?: number;
  previousFirstMessageDate?: string | null;
  createdAt: Date;
  userId: string;
}

const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const useUndoableAction = () => {
  const [undoableActions, setUndoableActions] = useState<UndoableAction[]>([]);

  // Clean up expired actions every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setUndoableActions((prev) =>
        prev.filter(
          (action) => now.getTime() - action.createdAt.getTime() < UNDO_WINDOW_MS
        )
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const addUndoableAction = useCallback((action: Omit<UndoableAction, "createdAt">) => {
    setUndoableActions((prev) => [
      ...prev,
      { ...action, createdAt: new Date() },
    ]);
  }, []);

  const canUndo = useCallback(
    (prospectId: string, currentUserId: string): UndoableAction | null => {
      const now = new Date();
      const action = undoableActions.find(
        (a) =>
          a.prospectId === prospectId &&
          a.userId === currentUserId &&
          now.getTime() - a.createdAt.getTime() < UNDO_WINDOW_MS
      );
      return action || null;
    },
    [undoableActions]
  );

  const getTimeRemaining = useCallback((action: UndoableAction): number => {
    const now = new Date();
    const elapsed = now.getTime() - action.createdAt.getTime();
    return Math.max(0, UNDO_WINDOW_MS - elapsed);
  }, []);

  const undoAction = useCallback(
    async (action: UndoableAction): Promise<boolean> => {
      try {
        // Delete the activity log
        const { error: deleteError } = await supabase
          .from("activity_logs")
          .delete()
          .eq("id", action.activityId);

        if (deleteError) {
          console.error("Error deleting activity:", deleteError);
          toast.error("Erreur lors de l'annulation");
          return false;
        }

        // Revert the prospect state
        const updateData: Record<string, any> = {};
        
        if (action.previousStatus !== undefined) {
          updateData.status = action.previousStatus;
        }
        
        if (action.previousFollowUpCount !== undefined) {
          updateData.follow_up_count = action.previousFollowUpCount;
        }
        
        if (action.previousFirstMessageDate !== undefined) {
          updateData.first_message_date = action.previousFirstMessageDate;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("prospects")
            .update(updateData)
            .eq("id", action.prospectId);

          if (updateError) {
            console.error("Error reverting prospect:", updateError);
            toast.error("Erreur lors de la restauration du prospect");
            return false;
          }
        }

        // Remove from undoable actions
        setUndoableActions((prev) =>
          prev.filter((a) => a.activityId !== action.activityId)
        );

        toast.success("Action annulée !");
        return true;
      } catch (error) {
        console.error("Error undoing action:", error);
        toast.error("Erreur lors de l'annulation");
        return false;
      }
    },
    []
  );

  return {
    addUndoableAction,
    canUndo,
    getTimeRemaining,
    undoAction,
    undoableActions,
  };
};
