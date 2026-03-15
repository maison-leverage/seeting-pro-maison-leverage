import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProspectContext {
  fullName: string;
  company: string;
  position: string;
  source: string;
  status: string;
  followUpCount: number;
  messagesSent: string[];
  responseText: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { prospect, responseText, previousMessages } = await req.json() as {
      prospect: ProspectContext;
      responseText: string;
      previousMessages: string[];
    };

    const prenom = prospect.fullName.split(" ")[0];

    const systemPrompt = `Tu es un expert en psychologie de la vente et en communication interpersonnelle. Tu travailles pour Maison Leverage, une agence SEO & GEO.

Ton rôle : analyser les réponses des prospects LinkedIn pour comprendre ce qu'ils ressentent VRAIMENT — pas juste ce qu'ils disent. Tu dois lire entre les lignes, détecter les peurs cachées, les objections non-dites, et les signaux d'achat subtils.

Contexte de l'agence :
- Maison Leverage aide les PME/TPE à se positionner sur Google via le SEO & GEO
- La setteuse contacte les prospects sur LinkedIn pour booker des rendez-vous (R1)
- L'objectif est de passer de la discussion au booking d'un R1

Tu dois répondre UNIQUEMENT en JSON valide, sans texte autour.`;

    const userPrompt = `Analyse cette réponse d'un prospect LinkedIn.

**Prospect :** ${prospect.fullName}
**Poste :** ${prospect.position} chez ${prospect.company}
**Source :** ${prospect.source}
**Stade pipeline :** ${prospect.status}
**Nombre de relances :** ${prospect.followUpCount}

**Messages envoyés précédemment :**
${previousMessages.length > 0 ? previousMessages.map((m, i) => `Message ${i + 1}: "${m}"`).join("\n") : "Aucun historique disponible"}

**Réponse du prospect :**
"${responseText}"

Analyse en profondeur et réponds en JSON :
{
  "dominant_emotion": "L'émotion principale (curiosité, méfiance, intérêt, agacement, politesse froide, enthousiasme, peur, hésitation...)",
  "hidden_objections": ["Liste des objections cachées derrière les mots (prix, timing, manque de confiance, pas le décideur, mauvaise expérience passée, ne comprend pas la valeur...)"],
  "buying_signals": ["Liste des signaux d'achat détectés (pose des questions, mentionne un besoin, demande des détails, partage un problème...)"],
  "temperature": "Score de 1 à 10 (1=glacial/hostile, 5=neutre/poli, 10=prêt à booker)",
  "summary": "Résumé en 2-3 phrases de l'état émotionnel réel du prospect et de ce qu'il pense vraiment",
  "sentiment": "positive|neutral|negative|hesitant",
  "suggested_replies": [
    {
      "tone": "empathique",
      "strategy": "Explication courte de pourquoi cette approche (ex: 'Rassurer sur le ROI car il a peur de l'investissement')",
      "message": "Le message complet à envoyer sur LinkedIn, personnalisé pour ${prenom}. Max 4-5 lignes. Naturel, pas corporate."
    },
    {
      "tone": "direct",
      "strategy": "Explication courte",
      "message": "Le message complet, plus direct et orienté action. Max 4-5 lignes."
    },
    {
      "tone": "valeur",
      "strategy": "Explication courte",
      "message": "Le message qui apporte de la valeur concrète (stat, insight, cas client). Max 4-5 lignes."
    }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response from Claude
    let analysis;
    try {
      // Handle potential markdown code block wrapping
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Failed to parse Claude response as JSON: ${content.substring(0, 200)}`);
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in analyze-response:", error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
