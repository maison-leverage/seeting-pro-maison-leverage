import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Send,
  Loader2,
  ThermometerSun,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Prospect } from "@/types/prospect";

interface EmotionalAnalysis {
  dominant_emotion: string;
  hidden_objections: string[];
  buying_signals: string[];
  temperature: number;
  summary: string;
  sentiment: string;
  suggested_replies: {
    tone: string;
    strategy: string;
    message: string;
  }[];
}

interface ResponseAnalyzerProps {
  prospect: Prospect;
  onClose: () => void;
  onReplyChosen: (prospect: Prospect) => void;
}

const sentimentConfig: Record<string, { label: string; color: string; icon: typeof Heart }> = {
  positive: { label: "Positif", color: "text-green-600 bg-green-50 border-green-200", icon: Heart },
  neutral: { label: "Neutre", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Eye },
  negative: { label: "Négatif", color: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle },
  hesitant: { label: "Hésitant", color: "text-amber-600 bg-amber-50 border-amber-200", icon: ShieldAlert },
};

const toneEmoji: Record<string, string> = {
  empathique: "💜",
  direct: "🎯",
  valeur: "💎",
};

const ResponseAnalyzer = ({ prospect, onClose, onReplyChosen }: ResponseAnalyzerProps) => {
  const [responseText, setResponseText] = useState("");
  const [analysis, setAnalysis] = useState<EmotionalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);

  const analyzeResponse = async () => {
    if (!responseText.trim()) {
      toast.error("Colle la réponse du prospect d'abord !");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-response", {
        body: {
          prospect: {
            fullName: prospect.fullName,
            company: prospect.company,
            position: prospect.position,
            source: prospect.source,
            status: prospect.status,
            followUpCount: prospect.followUpCount,
          },
          responseText: responseText.trim(),
          previousMessages: [], // TODO: load from message_sends history
        },
      });

      if (error) throw error;

      setAnalysis(data);

      // Save to prospect_responses table
      await supabase.from("prospect_responses" as any).insert({
        prospect_id: prospect.id,
        response_text: responseText.trim(),
        response_sentiment: data.sentiment || "neutral",
        emotional_analysis: {
          dominant_emotion: data.dominant_emotion,
          hidden_objections: data.hidden_objections,
          buying_signals: data.buying_signals,
          temperature: data.temperature,
          summary: data.summary,
        },
        suggested_replies: data.suggested_replies || [],
        analyzed_at: new Date().toISOString(),
      });

      toast.success("Analyse terminée !");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error("Erreur d'analyse : " + (error.message || "Réessaie"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Message copié !");
  };

  const handleChooseReply = async (index: number) => {
    setChosenIndex(index);

    // Update the prospect_responses record with chosen reply
    try {
      const { data: lastResponse } = await supabase
        .from("prospect_responses" as any)
        .select("id")
        .eq("prospect_id", prospect.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastResponse) {
        await supabase
          .from("prospect_responses" as any)
          .update({ chosen_reply_index: index })
          .eq("id", (lastResponse as any).id);
      }
    } catch (error) {
      console.error("Failed to save chosen reply:", error);
    }

    // Move prospect to "discussion" status
    await supabase
      .from("prospects")
      .update({ status: "discussion", last_contact: new Date().toISOString() })
      .eq("id", prospect.id);

    toast.success("Réponse choisie ! Prospect passé en Discussion.");
    onReplyChosen(prospect);
  };

  const temperatureColor = (temp: number) => {
    if (temp <= 3) return "text-blue-500";
    if (temp <= 5) return "text-amber-500";
    if (temp <= 7) return "text-orange-500";
    return "text-red-500";
  };

  const temperatureLabel = (temp: number) => {
    if (temp <= 2) return "Glacial";
    if (temp <= 4) return "Froid";
    if (temp <= 6) return "Tiède";
    if (temp <= 8) return "Chaud";
    return "Brûlant";
  };

  const prenom = prospect.fullName.split(" ")[0];

  return (
    <Card className="p-6 border-2 border-purple-300 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200">
            Analyse Claude — {prenom}
          </h3>
          <Badge className="bg-purple-600 text-white text-xs">IA</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
          Fermer ✕
        </Button>
      </div>

      {/* Input zone */}
      <div className="mb-4">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Colle la réponse de {prenom} ici :
        </label>
        <Textarea
          placeholder={`Ex: "Salut, merci pour ton message ! C'est intéressant mais on travaille déjà avec une agence pour le SEO..."`}
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          className="min-h-[100px] border-purple-200 focus:border-purple-400 bg-background"
          rows={4}
        />
        <Button
          onClick={analyzeResponse}
          disabled={loading || !responseText.trim()}
          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claude analyse...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Analyser la réponse
            </>
          )}
        </Button>
      </div>

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-4 animate-fade-in">
          {/* Sentiment + Temperature bar */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sentiment */}
            <div className={`p-3 rounded-lg border ${sentimentConfig[analysis.sentiment]?.color || sentimentConfig.neutral.color}`}>
              <div className="text-xs font-medium opacity-70 mb-1">Sentiment détecté</div>
              <div className="text-lg font-bold">
                {sentimentConfig[analysis.sentiment]?.label || analysis.sentiment}
              </div>
              <div className="text-sm mt-1">{analysis.dominant_emotion}</div>
            </div>

            {/* Temperature */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="text-xs font-medium text-muted-foreground mb-1">Température</div>
              <div className="flex items-center gap-2">
                <ThermometerSun className={`w-6 h-6 ${temperatureColor(analysis.temperature)}`} />
                <span className={`text-2xl font-bold ${temperatureColor(analysis.temperature)}`}>
                  {analysis.temperature}/10
                </span>
                <span className="text-sm text-muted-foreground">
                  {temperatureLabel(analysis.temperature)}
                </span>
              </div>
              {/* Visual bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    analysis.temperature <= 3
                      ? "bg-blue-500"
                      : analysis.temperature <= 6
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${analysis.temperature * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/30">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Ce que {prenom} pense vraiment
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Details toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground"
          >
            {showDetails ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {showDetails ? "Masquer les détails" : "Voir les détails"}
          </Button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-3">
              {/* Hidden objections */}
              <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-center gap-1 mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">Objections cachées</span>
                </div>
                {analysis.hidden_objections.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {analysis.hidden_objections.map((obj, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-red-300 text-red-600 bg-red-100/50">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Aucune détectée</span>
                )}
              </div>

              {/* Buying signals */}
              <div className="p-3 rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Signaux d'achat</span>
                </div>
                {analysis.buying_signals.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {analysis.buying_signals.map((sig, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-green-300 text-green-600 bg-green-100/50">
                        {sig}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Aucun détecté</span>
                )}
              </div>
            </div>
          )}

          {/* Suggested replies */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-foreground">Réponses suggérées par Claude</span>
            </div>
            <div className="space-y-3">
              {analysis.suggested_replies.map((reply, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all ${
                    chosenIndex === index
                      ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 ring-2 ring-green-300"
                      : "border-border bg-card hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{toneEmoji[reply.tone] || "💬"}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {reply.tone}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(reply.message, index)}
                        className="h-7 text-xs"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 mr-1 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 mr-1" />
                        )}
                        {copiedIndex === index ? "Copié !" : "Copier"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleChooseReply(index)}
                        disabled={chosenIndex !== null}
                        className={`h-7 text-xs ${
                          chosenIndex === index
                            ? "bg-green-600 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      >
                        {chosenIndex === index ? "✓ Choisi" : "Utiliser"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic mb-2">{reply.strategy}</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{reply.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResponseAnalyzer;
