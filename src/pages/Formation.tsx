import { useState, useEffect } from "react";
import { GraduationCap, Search, Target, Users, Calendar, Save, Plus, Trash2, Play, CalendarCheck, Lock, Loader2, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Liste des emails admin qui peuvent modifier le contenu
const ADMIN_EMAILS = [
  "maxime@maison-leverage.com",
  "oceane@maison-leverage.com",
];

interface VideoItem {
  id: string;
  url: string;
  title: string;
}

interface SectionContent {
  text: string;
  videos: VideoItem[];
}

interface FormationData {
  cadrage: SectionContent;
  crm: SectionContent;
  seo: SectionContent;
  avatar: SectionContent;
  leads: SectionContent;
  daily: SectionContent;
  booking: SectionContent;
}

const defaultData: FormationData = {
  cadrage: { text: "", videos: [] },
  crm: { text: "", videos: [] },
  seo: { text: "", videos: [] },
  avatar: { text: "", videos: [] },
  leads: { text: "", videos: [] },
  daily: { text: "", videos: [] },
  booking: { text: "", videos: [] },
};

const sections = [
  { key: "cadrage", title: "Cadrage — Ce qu'il faut savoir avant de commencer", icon: ShieldCheck },
  { key: "crm", title: "Comment fonctionne le CRM ?", icon: MonitorSmartphone },
  { key: "seo", title: "Comprendre le SEO", icon: Search },
  { key: "avatar", title: "Qui est notre avatar ?", icon: Target },
  { key: "leads", title: "Trouver des leads qualifiés", icon: Users },
  { key: "daily", title: "Que faire quotidiennement ?", icon: Calendar },
  { key: "booking", title: "Comment booker un RDV ?", icon: CalendarCheck },
] as const;

const extractVideoInfo = (url: string): { type: 'youtube' | 'loom'; id: string } | null => {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
  if (loomMatch) return { type: 'loom', id: loomMatch[1] };
  return null;
};

const getEmbedUrl = (url: string): string | null => {
  const info = extractVideoInfo(url);
  if (!info) return null;
  if (info.type === 'youtube') return `https://www.youtube.com/embed/${info.id}`;
  if (info.type === 'loom') return `https://www.loom.com/embed/${info.id}`;
  return null;
};

const Formation = () => {
  const [data, setData] = useState<FormationData>(defaultData);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVideoUrls, setNewVideoUrls] = useState<Record<string, string>>({
    cadrage: "",
    crm: "",
    seo: "",
    avatar: "",
    leads: "",
    daily: "",
    booking: "",
  });
  const [newVideoTitles, setNewVideoTitles] = useState<Record<string, string>>({
    cadrage: "",
    crm: "",
    seo: "",
    avatar: "",
    leads: "",
    daily: "",
    booking: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        setIsAdmin(true);
      }

      const { data: dbData, error } = await supabase
        .from('formation_content')
        .select('section_key, text_content, videos');

      if (error) {
        console.error('Error loading formation content:', error);
        toast.error("Erreur lors du chargement");
        setLoading(false);
        return;
      }

      if (dbData && dbData.length > 0) {
        const newData: FormationData = { ...defaultData };
        dbData.forEach((row) => {
          const key = row.section_key as keyof FormationData;
          if (key in newData) {
            newData[key] = {
              text: row.text_content || "",
              videos: (row.videos as VideoItem[]) || [],
            };
          }
        });
        setData(newData);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const saveData = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const sectionData = data[section.key];
        const { error } = await supabase
          .from('formation_content')
          .update({
            text_content: sectionData.text,
            videos: sectionData.videos,
          })
          .eq('section_key', section.key);

        if (error) throw error;
      }
      toast.success("Formation sauvegardée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updateText = (key: keyof FormationData, text: string) => {
    setData((prev) => ({
      ...prev,
      [key]: { ...prev[key], text },
    }));
  };

  const addVideo = async (key: keyof FormationData) => {
    const url = newVideoUrls[key];
    const title = newVideoTitles[key];
    const videoInfo = extractVideoInfo(url);

    if (!videoInfo) {
      toast.error("URL invalide (YouTube ou Loom supportés)");
      return;
    }

    if (!title.trim()) {
      toast.error("Veuillez ajouter un titre pour la vidéo");
      return;
    }

    const newVideo: VideoItem = {
      id: crypto.randomUUID(),
      url,
      title,
    };

    const updatedVideos = [...data[key].videos, newVideo];

    setData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        videos: updatedVideos,
      },
    }));

    setNewVideoUrls((prev) => ({ ...prev, [key]: "" }));
    setNewVideoTitles((prev) => ({ ...prev, [key]: "" }));

    // Sauvegarde automatique de la vidéo
    try {
      await supabase
        .from('formation_content')
        .update({ videos: updatedVideos })
        .eq('section_key', key);
      toast.success("Vidéo ajoutée et sauvegardée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const removeVideo = async (key: keyof FormationData, videoId: string) => {
    const updatedVideos = data[key].videos.filter((v) => v.id !== videoId);
    
    setData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        videos: updatedVideos,
      },
    }));

    // Sauvegarde automatique
    try {
      await supabase
        .from('formation_content')
        .update({ videos: updatedVideos })
        .eq('section_key', key);
      toast.success("Vidéo supprimée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Formation</h1>
                <p className="text-muted-foreground">
                  Ressources et guides pour maîtriser la prospection
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button onClick={saveData} className="gap-2" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </Button>
            )}
          </div>

          {!isAdmin && (
            <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Seul l'administrateur peut modifier le contenu de cette page.
              </p>
            </div>
          )}

          {/* Sections */}
          <Accordion type="multiple" className="space-y-4" defaultValue={["seo"]}>
            {sections.map((section) => {
              const Icon = section.icon;
              const sectionData = data[section.key];

              return (
                <AccordionItem
                  key={section.key}
                  value={section.key}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-lg">{section.title}</span>
                      {sectionData.videos.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {sectionData.videos.length} vidéo{sectionData.videos.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-6">
                      {/* Videos en premier - plus visible */}
                      {sectionData.videos.length > 0 && (
                        <div className="space-y-4">
                          <label className="text-sm font-medium text-foreground block">
                            📺 Vidéos
                          </label>
                          <div className="grid gap-4">
                            {sectionData.videos.map((video) => {
                              const embedUrl = getEmbedUrl(video.url);
                              return (
                                <Card key={video.id} className="overflow-hidden">
                                  <div className="flex flex-col sm:flex-row">
                                    <div className="relative aspect-video sm:w-80 flex-shrink-0">
                                      {embedUrl && (
                                        <iframe
                                          src={embedUrl}
                                          title={video.title}
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          className="absolute inset-0 w-full h-full"
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Play className="w-5 h-5 text-primary" />
                                        <span className="font-medium">{video.title}</span>
                                      </div>
                                      {isAdmin && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeVideo(section.key, video.id)}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Add video form - only for admin */}
                      {isAdmin && (
                        <div className="border border-dashed border-border rounded-lg p-4 bg-muted/30">
                          <label className="text-sm font-medium text-muted-foreground mb-3 block">
                            ➕ Ajouter une vidéo YouTube
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                              value={newVideoTitles[section.key]}
                              onChange={(e) =>
                                setNewVideoTitles((prev) => ({
                                  ...prev,
                                  [section.key]: e.target.value,
                                }))
                              }
                              placeholder="Titre de la vidéo"
                              className="sm:w-48"
                            />
                            <Input
                              value={newVideoUrls[section.key]}
                              onChange={(e) =>
                                setNewVideoUrls((prev) => ({
                                  ...prev,
                                  [section.key]: e.target.value,
                                }))
                              }
                              placeholder="https://youtube.com/watch?v=..."
                              className="flex-1"
                            />
                            <Button onClick={() => addVideo(section.key)} variant="outline" className="gap-2">
                              <Plus className="w-4 h-4" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Text content */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          📝 Contenu
                        </label>
                        {isAdmin ? (
                          <Textarea
                            value={sectionData.text}
                            onChange={(e) => updateText(section.key, e.target.value)}
                            placeholder="Écrivez votre contenu ici..."
                            className="min-h-[150px] resize-y"
                          />
                        ) : (
                          <div className="p-4 rounded-lg bg-muted/30 border border-border whitespace-pre-wrap text-sm leading-relaxed">
                            {sectionData.text ? (
                              sectionData.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                                part.startsWith('**') && part.endsWith('**') ? (
                                  <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )
                            ) : (
                              <span className="text-muted-foreground italic">Aucun contenu</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </main>
    </div>
  );
};

export default Formation;