import { useState, useEffect } from "react";
import { GraduationCap, Search, Target, Users, Calendar, Save, Plus, Trash2, Play, CalendarCheck, Lock, Loader2, MonitorSmartphone, ChevronRight } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  crm: SectionContent;
  seo: SectionContent;
  avatar: SectionContent;
  leads: SectionContent;
  daily: SectionContent;
  booking: SectionContent;
}

const defaultData: FormationData = {
  crm: { text: "", videos: [] },
  seo: { text: "", videos: [] },
  avatar: { text: "", videos: [] },
  leads: { text: "", videos: [] },
  daily: { text: "", videos: [] },
  booking: { text: "", videos: [] },
};

const sections = [
  { key: "crm", title: "Comment fonctionne le CRM ?", icon: MonitorSmartphone },
  { key: "seo", title: "Comprendre le SEO", icon: Search },
  { key: "avatar", title: "Qui est notre avatar ?", icon: Target },
  { key: "leads", title: "Trouver des leads qualifiés", icon: Users },
  { key: "daily", title: "Que faire quotidiennement ?", icon: Calendar },
  { key: "booking", title: "Comment booker un RDV ?", icon: CalendarCheck },
] as const;

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const Formation = () => {
  const [data, setData] = useState<FormationData>(defaultData);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof FormationData>("crm");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");

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
        
        // Auto-select first video if available
        const firstSection = sections[0].key;
        if (newData[firstSection].videos.length > 0) {
          setSelectedVideo(newData[firstSection].videos[0]);
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Auto-select first video when changing section
  useEffect(() => {
    const sectionVideos = data[activeSection].videos;
    if (sectionVideos.length > 0) {
      setSelectedVideo(sectionVideos[0]);
    } else {
      setSelectedVideo(null);
    }
  }, [activeSection, data]);

  const saveSection = async (sectionKey: keyof FormationData) => {
    const sectionData = data[sectionKey];
    const { error } = await supabase
      .from('formation_content')
      .update({
        text_content: sectionData.text,
        videos: sectionData.videos,
      })
      .eq('section_key', sectionKey);

    if (error) {
      console.error(`Error saving section ${sectionKey}:`, error);
      throw error;
    }
  };

  const saveData = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        await saveSection(section.key);
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

  const addVideo = async () => {
    const videoId = extractYouTubeId(newVideoUrl);

    if (!videoId) {
      toast.error("URL YouTube invalide");
      return;
    }

    if (!newVideoTitle.trim()) {
      toast.error("Veuillez ajouter un titre pour la vidéo");
      return;
    }

    const newVideo: VideoItem = {
      id: crypto.randomUUID(),
      url: newVideoUrl,
      title: newVideoTitle,
    };

    const updatedData = {
      ...data,
      [activeSection]: {
        ...data[activeSection],
        videos: [...data[activeSection].videos, newVideo],
      },
    };

    setData(updatedData);
    setNewVideoUrl("");
    setNewVideoTitle("");
    setSelectedVideo(newVideo);

    // Sauvegarde automatique
    try {
      await supabase
        .from('formation_content')
        .update({
          videos: updatedData[activeSection].videos,
        })
        .eq('section_key', activeSection);
      toast.success("Vidéo ajoutée et sauvegardée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const removeVideo = async (videoId: string) => {
    const updatedVideos = data[activeSection].videos.filter((v) => v.id !== videoId);
    const updatedData = {
      ...data,
      [activeSection]: {
        ...data[activeSection],
        videos: updatedVideos,
      },
    };

    setData(updatedData);
    
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(updatedVideos[0] || null);
    }

    // Sauvegarde automatique
    try {
      await supabase
        .from('formation_content')
        .update({
          videos: updatedVideos,
        })
        .eq('section_key', activeSection);
      toast.success("Vidéo supprimée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-muted-foreground italic">Aucun contenu</span>;
    
    return text.split('\n').map((line, i) => {
      if (line.includes('━━━')) {
        return <hr key={i} className="my-3 border-border/50" />;
      }
      if (line.startsWith('📋') || line.startsWith('🔹')) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        return <h3 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('→')) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="ml-3 my-0.5 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (/^\d+\./.test(line.trim())) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="ml-3 my-0.5 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (line.trim().startsWith('⚠️') || line.trim().startsWith('💡')) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="ml-3 my-1 px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (line.includes('|') && !line.includes('---')) {
        const cells = line.split('|').filter(c => c.trim());
        if (cells.length >= 2) {
          return (
            <div key={i} className="flex gap-3 ml-3 my-0.5 text-xs">
              {cells.map((cell, j) => (
                <span key={j} className={j === 0 ? "font-medium min-w-[60px] text-foreground" : "text-muted-foreground"}>
                  {cell.trim()}
                </span>
              ))}
            </div>
          );
        }
      }
      if (!line.trim()) return <div key={i} className="h-1" />;
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="my-0.5 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
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

  const currentSection = sections.find(s => s.key === activeSection)!;
  const sectionData = data[activeSection];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header compact */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Formation</h1>
              <p className="text-xs text-muted-foreground">Ressources pour la prospection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Lecture seule</span>
              </div>
            )}
            {isAdmin && (
              <Button onClick={saveData} size="sm" className="gap-2" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - sections navigation */}
          <div className="w-64 border-r border-border bg-card/50 flex flex-col">
            <div className="p-3 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modules</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.key;
                  const videoCount = data[section.key].videos.length;
                  
                  return (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">{section.title}</span>
                      {videoCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? "bg-primary-foreground/20" : "bg-muted-foreground/20"}`}>
                          {videoCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Center - Video player */}
          <div className="flex-1 flex flex-col bg-black/5 dark:bg-black/20">
            {/* Video */}
            <div className="flex-1 flex items-center justify-center p-4">
              {selectedVideo ? (
                <div className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideo.url)}`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Aucune vidéo dans ce module</p>
                  {isAdmin && <p className="text-sm mt-2">Ajoutez une vidéo ci-dessous</p>}
                </div>
              )}
            </div>

            {/* Video list */}
            {sectionData.videos.length > 0 && (
              <div className="border-t border-border bg-card p-3">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sectionData.videos.map((video) => {
                    const isSelected = selectedVideo?.id === video.id;
                    return (
                      <button
                        key={video.id}
                        onClick={() => setSelectedVideo(video)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        <span className="text-sm font-medium whitespace-nowrap">{video.title}</span>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVideo(video.id);
                            }}
                            className="ml-2 p-1 rounded hover:bg-destructive/20 text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add video form for admin */}
            {isAdmin && (
              <div className="border-t border-border bg-card p-3">
                <div className="flex gap-2">
                  <Input
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="Titre de la vidéo"
                    className="w-48"
                  />
                  <Input
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button onClick={addVideo} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar - Text content */}
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <currentSection.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium truncate">{currentSection.title}</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {isAdmin ? (
                  <Textarea
                    value={sectionData.text}
                    onChange={(e) => updateText(activeSection, e.target.value)}
                    placeholder="Écrivez votre contenu ici...&#10;&#10;Utilisez:&#10;🔹 pour les titres&#10;• pour les puces&#10;**texte** pour le gras&#10;━━━ pour les séparateurs"
                    className="min-h-[400px] resize-none text-sm"
                  />
                ) : (
                  <div className="text-sm">
                    {renderFormattedText(sectionData.text)}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Formation;