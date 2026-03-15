import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // 1. Activity logs — yesterday (since this runs at midnight)
    const { data: yesterdayActivities } = await supabase
      .from("activity_logs")
      .select("*")
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString());

    // 2. Activity logs — last 7 days
    const { data: weekActivities } = await supabase
      .from("activity_logs")
      .select("*")
      .gte("created_at", weekStart.toISOString());

    // 3. All prospects with their current status
    const { data: prospects } = await supabase
      .from("prospects")
      .select("*")
      .or("is_deleted.is.null,is_deleted.eq.false");

    // 4. Message sends with variant info (last 7 days)
    const { data: recentSends } = await supabase
      .from("message_sends")
      .select("*, message_variants(*)")
      .gte("sent_at", weekStart.toISOString());

    // 5. All active message variants
    const { data: variants } = await supabase
      .from("message_variants")
      .select("*")
      .eq("is_active", true);

    // 6. Prospect responses (last 7 days) — for Claude analysis tracking
    const { data: recentResponses } = await supabase
      .from("prospect_responses")
      .select("*")
      .gte("created_at", weekStart.toISOString());

    // === COMPUTE STATS ===

    const yesterdayActs = yesterdayActivities || [];
    const weekActs = weekActivities || [];
    const allProspects = prospects || [];
    const sends = recentSends || [];
    const responses = recentResponses || [];

    // Yesterday's performance
    const yesterdayFirstDMs = yesterdayActs.filter((a: any) => a.type === "first_dm").length;
    const yesterdayFollowUps = yesterdayActs.filter((a: any) => a.type === "follow_up_dm").length;
    const yesterdayReplies = yesterdayActs.filter((a: any) => a.type === "reply_received").length;
    const yesterdayTotal = yesterdayFirstDMs + yesterdayFollowUps;

    // Weekly performance
    const weekFirstDMs = weekActs.filter((a: any) => a.type === "first_dm").length;
    const weekFollowUps = weekActs.filter((a: any) => a.type === "follow_up_dm").length;
    const weekReplies = weekActs.filter((a: any) => a.type === "reply_received").length;
    const weekTotal = weekFirstDMs + weekFollowUps;

    // Pipeline counts
    const pipelineCounts: Record<string, number> = {};
    for (const p of allProspects) {
      pipelineCounts[p.status] = (pipelineCounts[p.status] || 0) + 1;
    }

    // Source counts
    const sourceCounts: Record<string, number> = {};
    for (const p of allProspects) {
      const src = p.source || "outbound";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }

    // A/B test results — per variant
    const variantStats: Record<string, { name: string; category: string; sent: number; replies: number }> = {};
    for (const s of sends) {
      const vid = s.variant_id;
      if (!variantStats[vid]) {
        const v = s.message_variants;
        variantStats[vid] = {
          name: v?.name || "Unknown",
          category: v?.category || "unknown",
          sent: 0,
          replies: 0,
        };
      }
      variantStats[vid].sent++;
      if (s.got_reply) variantStats[vid].replies++;
    }

    // Stagnating prospects (no activity for 7+ days)
    const stagnating = allProspects.filter((p: any) => {
      if (["signe", "perdu", "nouveau"].includes(p.status)) return false;
      const lastContact = p.last_contact || p.updated_at;
      if (!lastContact) return true;
      const daysSince = Math.floor((now.getTime() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= 7;
    }).map((p: any) => ({
      name: p.full_name,
      company: p.company,
      status: p.status,
      daysSinceContact: Math.floor((now.getTime() - new Date(p.last_contact || p.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    // Prospects needing follow-up today
    const needFollowUp = allProspects.filter((p: any) => {
      if (!p.reminder_date) return false;
      const reminder = new Date(p.reminder_date);
      reminder.setHours(0, 0, 0, 0);
      return reminder <= todayStart && (p.follow_up_count || 0) < 3;
    }).length;

    // Response analysis stats
    const responseStats = {
      total: responses.length,
      positive: responses.filter((r: any) => r.response_sentiment === "positive").length,
      negative: responses.filter((r: any) => r.response_sentiment === "negative").length,
      hesitant: responses.filter((r: any) => r.response_sentiment === "hesitant").length,
      neutral: responses.filter((r: any) => r.response_sentiment === "neutral").length,
    };

    const report = {
      generated_at: now.toISOString(),
      yesterday: {
        first_dms: yesterdayFirstDMs,
        follow_ups: yesterdayFollowUps,
        total_messages: yesterdayTotal,
        replies_received: yesterdayReplies,
        reply_rate: yesterdayTotal > 0 ? Math.round((yesterdayReplies / yesterdayTotal) * 100) : 0,
        target_reached: yesterdayTotal >= 50,
      },
      week: {
        first_dms: weekFirstDMs,
        follow_ups: weekFollowUps,
        total_messages: weekTotal,
        replies_received: weekReplies,
        reply_rate: weekTotal > 0 ? Math.round((weekReplies / weekTotal) * 100) : 0,
        daily_average: Math.round(weekTotal / 7),
      },
      pipeline: pipelineCounts,
      sources: sourceCounts,
      ab_test_results: Object.values(variantStats),
      stagnating_prospects: stagnating,
      follow_ups_pending: needFollowUp,
      response_analysis: responseStats,
      total_prospects: allProspects.length,
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in daily-report:", error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
