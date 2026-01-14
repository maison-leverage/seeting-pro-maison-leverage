import { createContext, useContext, ReactNode } from "react";
import { useUndoableAction } from "@/hooks/useUndoableAction";

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

interface UndoableActionContextType {
  addUndoableAction: (action: Omit<UndoableAction, "createdAt">) => void;
  canUndo: (prospectId: string, currentUserId: string) => UndoableAction | null;
  getTimeRemaining: (action: UndoableAction) => number;
  undoAction: (action: UndoableAction) => Promise<boolean>;
  undoableActions: UndoableAction[];
}

const UndoableActionContext = createContext<UndoableActionContextType | undefined>(undefined);

export const UndoableActionProvider = ({ children }: { children: ReactNode }) => {
  const undoableAction = useUndoableAction();

  return (
    <UndoableActionContext.Provider value={undoableAction}>
      {children}
    </UndoableActionContext.Provider>
  );
};

export const useUndoableActionContext = () => {
  const context = useContext(UndoableActionContext);
  if (!context) {
    throw new Error("useUndoableActionContext must be used within UndoableActionProvider");
  }
  return context;
};
