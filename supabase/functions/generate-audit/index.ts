import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prospect_id, website_url, prenom, company, secteur, ville } = await req.json();

    if (!prospect_id || !website_url) {
      return new Response(
        JSON.stringify({ error: "prospect_id and website_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user_id from the prospect
    const { data: prospect, error: prospectError } = await supabase
      .from("prospects")
      .select("user_id")
      .eq("id", prospect_id)
      .single();

    if (prospectError || !prospect) {
      return new Response(
        JSON.stringify({ error: "Prospect not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update prospect status to "generating"
    await supabase
      .from("prospects")
      .update({ audit_status: "generating" })
      .eq("id", prospect_id);

    // ============================================
    // STEP 1: Fetch PageSpeed Insights (FREE API)
    // ============================================
    let pageSpeedData: any = null;
    try {
      const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(website_url)}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices`;
      const psResponse = await fetch(pageSpeedUrl);
      if (psResponse.ok) {
        pageSpeedData = await psResponse.json();
      }
    } catch (e) {
      console.error("PageSpeed fetch error:", e);
    }

    // Extract scores from PageSpeed
    const scores = {
      performance: pageSpeedData?.lighthouseResult?.categories?.performance?.score
        ? Math.round(pageSpeedData.lighthouseResult.categories.performance.score * 100) : null,
      seo: pageSpeedData?.lighthouseResult?.categories?.seo?.score
        ? Math.round(pageSpeedData.lighthouseResult.categories.seo.score * 100) : null,
      accessibility: pageSpeedData?.lighthouseResult?.categories?.accessibility?.score
        ? Math.round(pageSpeedData.lighthouseResult.categories.accessibility.score * 100) : null,
      bestPractices: pageSpeedData?.lighthouseResult?.categories?.["best-practices"]?.score
        ? Math.round(pageSpeedData.lighthouseResult.categories["best-practices"].score * 100) : null,
    };

    // Extract key metrics
    const audits = pageSpeedData?.lighthouseResult?.audits || {};
    const metrics = {
      fcp: audits["first-contentful-paint"]?.displayValue || "N/A",
      lcp: audits["largest-contentful-paint"]?.displayValue || "N/A",
      cls: audits["cumulative-layout-shift"]?.displayValue || "N/A",
      tbt: audits["total-blocking-time"]?.displayValue || "N/A",
      si: audits["speed-index"]?.displayValue || "N/A",
    };

    // ============================================
    // STEP 2: Scrape the website HTML
    // ============================================
    let siteHtml = "";
    try {
      const siteResponse = await fetch(website_url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MaisonLeverage-Audit/1.0)" },
      });
      if (siteResponse.ok) {
        const fullHtml = await siteResponse.text();
        // Limit to first 15000 chars to avoid token limits
        siteHtml = fullHtml.substring(0, 15000);
      }
    } catch (e) {
      console.error("Site scrape error:", e);
    }

    // ============================================
    // STEP 3: Generate audit HTML with Claude
    // ============================================
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      await supabase.from("prospects").update({ audit_status: "error" }).eq("id", prospect_id);
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es un expert SEO et GEO (Generative Engine Optimization) senior travaillant pour Maison Leverage, agence specialisee en referencement Google et visibilite IA.
Tu generes des audits personnalises ultra-professionnels au format HTML complet.
Ton role est d'analyser des donnees REELLES (PageSpeed + HTML source) et de produire un rapport visuel impressionnant.
Chaque donnee du rapport doit etre REELLE et extraite des sources fournies. Ne jamais inventer de chiffres.
RETOURNE UNIQUEMENT DU HTML COMPLET (<!DOCTYPE html>...</html>). Pas de markdown, pas d'explication.`;

    const userPrompt = `Genere un audit SEO & GEO complet au format HTML standalone.

## INFORMATIONS PROSPECT
- Prenom : ${prenom || "N/A"}
- Entreprise : ${company || "N/A"}
- Secteur : ${secteur || "Non specifie"}
- Ville : ${ville || "Non specifiee"}
- URL : ${website_url}

## SCORES PAGESPEED (reels)
- Performance : ${scores.performance ?? "Non disponible"}/100
- SEO : ${scores.seo ?? "Non disponible"}/100
- Accessibilite : ${scores.accessibility ?? "Non disponible"}/100
- Best Practices : ${scores.bestPractices ?? "Non disponible"}/100
- FCP : ${metrics.fcp}
- LCP : ${metrics.lcp}
- CLS : ${metrics.cls}
- TBT : ${metrics.tbt}

## CODE SOURCE DU SITE (extrait)
${siteHtml}

## GENERE UN HTML COMPLET AVEC :

1. HEADER : Logo MAISON LEVERAGE - Agence SEO & GEO, titre "Audit SEO & IA - ${company}", date du jour

2. SCORES DE PERFORMANCE : 4 cercles SVG colores (vert >89, orange 50-89, rouge <50) pour Performance, SEO, Accessibilite, Best Practices. Affiche les vrais scores.

3. METRIQUES VITALES : FCP, LCP, CLS, TBT avec badges colores

4. ANALYSE SEO ON-PAGE (depuis le HTML) :
- Title tag (present? contenu? longueur?)
- Meta description (presente? contenu? longueur?)
- H1 (combien? contenu?)
- Structure H2/H3
- Images sans alt
- Schema markup / JSON-LD
- Open Graph tags
- Canonical tag
- Mobile-friendly (viewport)
Badge VERT/ORANGE/ROUGE pour chaque element

5. SCORE VISIBILITE IA (GEO) : evalue 0-100 si le site est optimise pour ChatGPT/Perplexity/Google AI Overview

6. TOP 3 OPPORTUNITES : actions les plus impactantes

7. CTA : bouton violet "Discutons de ces resultats" avec lien https://app.iclosed.io/e/oceane/30m

8. FOOTER : Maison Leverage - Document confidentiel - oceane@maison-leverage.com

## CSS : fond blanc, couleur primaire #6C5CE7, secondaire #FF6B6B, vert #00B894, orange #FDCB6E, rouge #E17055. Font system-ui. Sections avec border-radius 12px, box-shadow. Max-width 800px centre. @media print optimise.`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      await supabase.from("prospects").update({ audit_status: "error" }).eq("id", prospect_id);
      return new Response(
        JSON.stringify({ error: "Claude API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    const htmlContent = claudeData.content?.[0]?.text || "";

    // ============================================
    // STEP 4: Store the audit in the database
    // ============================================

    // Estimate GEO score based on available data
    const hasSchemaMarkup = siteHtml.includes("application/ld+json") || siteHtml.includes("schema.org");
    const hasFaq = siteHtml.toLowerCase().includes("faq") || siteHtml.includes("itemtype=\"https://schema.org/FAQPage\"");
    const hasStructuredContent = (siteHtml.match(/<h2/gi) || []).length >= 3;
    const geoScore = Math.min(100, (hasSchemaMarkup ? 30 : 0) + (hasFaq ? 25 : 0) + (hasStructuredContent ? 20 : 0) + (scores.seo ? Math.round(scores.seo * 0.25) : 10));

    const { error: insertError } = await supabase.from("audit_reports").insert({
      prospect_id,
      user_id: prospect.user_id,
      website_url,
      html_content: htmlContent,
      score_performance: scores.performance,
      score_seo: scores.seo,
      score_accessibility: scores.accessibility,
      score_best_practices: scores.bestPractices,
      score_geo: geoScore,
      status: "ready",
    });

    if (insertError) {
      console.error("Error storing audit:", insertError);
      await supabase.from("prospects").update({ audit_status: "error" }).eq("id", prospect_id);
      return new Response(
        JSON.stringify({ error: "Error storing audit", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update prospect status to "ready"
    await supabase
      .from("prospects")
      .update({ audit_status: "ready" })
      .eq("id", prospect_id);

    return new Response(
      JSON.stringify({
        success: true,
        scores,
        geoScore,
        message: "Audit generated successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
