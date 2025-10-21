import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types/template";
import { toast } from "sonner";

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform database format to app format
      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        sequence: parseInt(t.sequence),
        content: t.content,
        notes: t.notes || "",
        targetProfile: {
          types: Array.isArray(t.target_types) ? t.target_types : [],
          sectors: Array.isArray(t.target_sectors) ? t.target_sectors : [],
          sizes: Array.isArray(t.target_sizes) ? t.target_sizes : [],
        },
        metrics: {
          sends: t.sent_count || 0,
          responses: t.response_count || 0,
          calls: 0,
          responseRate: t.sent_count > 0 ? (t.response_count / t.sent_count) * 100 : 0,
          callRate: 0,
          rating: 0,
        },
        tags: Array.isArray(t.tags) ? t.tags : [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        usageHistory: [],
      })) as Template[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Partial<Template>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("templates")
        .insert([{
          user_id: user.id,
          name: templateData.name!,
          sequence: templateData.sequence?.toString()!,
          content: templateData.content!,
          notes: templateData.notes,
          target_types: JSON.stringify(templateData.targetProfile?.types || []),
          target_sectors: JSON.stringify(templateData.targetProfile?.sectors || []),
          target_sizes: JSON.stringify(templateData.targetProfile?.sizes || []),
          tags: JSON.stringify(templateData.tags || []),
          sent_count: 0,
          response_count: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template créé avec succès");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Erreur lors de la création du template");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Template> }) => {
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.sequence) updateData.sequence = data.sequence.toString();
      if (data.content) updateData.content = data.content;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.targetProfile) {
        updateData.target_types = JSON.stringify(data.targetProfile.types);
        updateData.target_sectors = JSON.stringify(data.targetProfile.sectors);
        updateData.target_sizes = JSON.stringify(data.targetProfile.sizes);
      }
      if (data.tags) updateData.tags = JSON.stringify(data.tags);
      if (data.metrics) {
        updateData.sent_count = data.metrics.sends;
        updateData.response_count = data.metrics.responses;
      }

      const { error } = await supabase
        .from("templates")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template mis à jour");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template supprimé");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
  };
};
