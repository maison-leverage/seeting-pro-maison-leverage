import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Template } from "@/types/template";

interface ProspectMessage {
  id: string;
  templateId?: string;
  messageContent: string;
  createdAt: string;
}

interface ProspectMessageManagerProps {
  prospectId: string;
}

export const ProspectMessageManager = ({ prospectId }: ProspectMessageManagerProps) => {
  const [messages, setMessages] = useState<ProspectMessage[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newMessage, setNewMessage] = useState({
    templateId: "",
    messageContent: "",
  });

  useEffect(() => {
    loadMessages();
    loadTemplates();
  }, [prospectId]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('prospect_messages')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const loadedMessages: ProspectMessage[] = data.map((m: any) => ({
      id: m.id,
      templateId: m.template_id,
      messageContent: m.message_content,
      createdAt: m.created_at,
    }));

    setMessages(loadedMessages);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading templates:', error);
      return;
    }

    const loadedTemplates: Template[] = data.map((t: any) => ({
      id: t.id,
      name: t.name,
      category: "premier_contact",
      content: t.content,
      status: "actif",
      targetProfile: {
        types: t.target_types || [],
        sectors: t.target_sectors || [],
        sizes: t.target_sizes || []
      },
      metrics: {
        sends: t.sent_count || 0,
        responses: t.response_count || 0,
        calls: 0,
        responseRate: 0,
        callRate: 0,
        rating: 1
      },
      tags: t.tags || [],
      notes: t.notes || "",
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      usageHistory: [],
    }));

    setTemplates(loadedTemplates);
  };

  const handleAddMessage = async () => {
    if (!newMessage.messageContent.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    const { error } = await supabase
      .from('prospect_messages')
      .insert({
        prospect_id: prospectId,
        template_id: newMessage.templateId || null,
        message_content: newMessage.messageContent,
      });

    if (error) {
      console.error('Error adding message:', error);
      toast.error("Erreur lors de l'ajout du message");
      return;
    }

    toast.success("Message ajouté !");
    setNewMessage({ templateId: "", messageContent: "" });
    loadMessages();
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('prospect_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Message supprimé !");
    loadMessages();
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewMessage({
        templateId: templateId,
        messageContent: template.content,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Messages existants */}
      {messages.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground">Messages envoyés :</h4>
          {messages.map((message) => (
            <div key={message.id} className="p-3 bg-muted rounded-md flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="text-sm text-foreground whitespace-pre-wrap">{message.messageContent}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(message.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMessage(message.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Nouveau message */}
      <div className="space-y-3 p-4 border border-border rounded-md bg-card">
        <div className="flex items-center gap-2">
          <Select value={newMessage.templateId} onValueChange={handleTemplateSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sélectionner un template (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          placeholder="Écrire le message envoyé..."
          value={newMessage.messageContent}
          onChange={(e) => setNewMessage({ ...newMessage, messageContent: e.target.value })}
          className="min-h-[100px]"
        />

        <Button onClick={handleAddMessage} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Ajouter le message
        </Button>
      </div>
    </div>
  );
};
