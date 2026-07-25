import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify User JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user knowledge nodes
    const { data: nodes, error: fetchErr } = await supabase
      .from("knowledge_nodes")
      .select("*")
      .eq("user_id", user.id);

    if (fetchErr) throw fetchErr;

    const now = new Date();
    const updatedNodes = [];

    for (const node of nodes || []) {
      const lastInteraction = new Date(node.last_interaction);
      const hoursElapsed = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

      // Ebbinghaus forgetting curve decay: R = e^(-t/S)
      const stability = 24 / (node.decay_rate || 0.05);
      const decayedMastery = Math.max(0.1, node.mastery_level * Math.exp(-hoursElapsed / stability));

      const { data: updated } = await supabase
        .from("knowledge_nodes")
        .update({
          mastery_level: Math.round(decayedMastery * 100) / 100,
        })
        .eq("id", node.id)
        .select()
        .single();

      if (updated) updatedNodes.push(updated);
    }

    return new Response(
      JSON.stringify({
        message: "Knowledge graph decay recalculated successfully",
        nodes: updatedNodes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
