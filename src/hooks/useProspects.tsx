import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/types/prospect";
import { toast } from "sonner";

export const useProspects = () => {
  const queryClient = useQueryClient();

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("prospects")
        .select(`
          *,
          prospect_notes(id, content, created_by, created_at),
          prospect_history(id, action, details, created_by, created_at)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform database format to app format
      return data.map((p: any) => ({
        id: p.id,
        fullName: p.full_name,
        company: p.company,
        position: p.position || "",
        linkedinUrl: p.linkedin_url || "",
        status: p.status,
        priority: p.priority,
        qualification: p.qualification,
        hype: p.hype,
        tags: Array.isArray(p.tags) ? p.tags : [],
        reminderDate: p.reminder_date,
        assignedTo: p.assigned_to || user.id,
        followUpCount: p.follow_up_count || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        notes: (p.prospect_notes || []).map((n: any) => ({
          id: n.id,
          content: n.content,
          createdBy: n.created_by,
          createdAt: n.created_at,
        })),
        history: (p.prospect_history || []).map((h: any) => ({
          id: h.id,
          action: h.action,
          details: h.details,
          createdBy: h.created_by,
          createdAt: h.created_at,
        })),
      })) as Prospect[];
    },
  });

  const createProspect = useMutation({
    mutationFn: async (prospectData: Partial<Prospect>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("prospects")
        .insert([{
          user_id: user.id,
          full_name: prospectData.fullName!,
          company: prospectData.company!,
          position: prospectData.position,
          linkedin_url: prospectData.linkedinUrl,
          status: prospectData.status || "premier_message",
          priority: prospectData.priority || "2",
          qualification: prospectData.qualification || "loom",
          hype: prospectData.hype || "tiede",
          tags: JSON.stringify(prospectData.tags || []),
          reminder_date: prospectData.reminderDate,
          assigned_to: user.id,
          follow_up_count: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast.success("Prospect créé avec succès");
    },
    onError: (error) => {
      console.error("Error creating prospect:", error);
      toast.error("Erreur lors de la création du prospect");
    },
  });

  const updateProspect = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prospect> }) => {
      const updateData: any = {};
      
      if (data.fullName) updateData.full_name = data.fullName;
      if (data.company) updateData.company = data.company;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.linkedinUrl !== undefined) updateData.linkedin_url = data.linkedinUrl;
      if (data.status) updateData.status = data.status;
      if (data.priority) updateData.priority = data.priority;
      if (data.qualification) updateData.qualification = data.qualification;
      if (data.hype) updateData.hype = data.hype;
      if (data.tags) updateData.tags = JSON.stringify(data.tags);
      if (data.reminderDate !== undefined) updateData.reminder_date = data.reminderDate;
      if (data.followUpCount !== undefined) updateData.follow_up_count = data.followUpCount;

      const { error } = await supabase
        .from("prospects")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast.success("Prospect mis à jour");
    },
    onError: (error) => {
      console.error("Error updating prospect:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteProspect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prospects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast.success("Prospect supprimé");
    },
    onError: (error) => {
      console.error("Error deleting prospect:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ prospectId, content, createdBy }: { prospectId: string; content: string; createdBy: string }) => {
      const { error } = await supabase
        .from("prospect_notes")
        .insert({
          prospect_id: prospectId,
          content,
          created_by: createdBy,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });

  const addHistory = useMutation({
    mutationFn: async ({ prospectId, action, details, createdBy }: { prospectId: string; action: string; details: string; createdBy: string }) => {
      const { error } = await supabase
        .from("prospect_history")
        .insert({
          prospect_id: prospectId,
          action,
          details,
          created_by: createdBy,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });

  return {
    prospects,
    isLoading,
    createProspect: createProspect.mutate,
    updateProspect: updateProspect.mutate,
    deleteProspect: deleteProspect.mutate,
    addNote: addNote.mutate,
    addHistory: addHistory.mutate,
  };
};
