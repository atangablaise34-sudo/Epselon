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

    // Verify JWT Auth header
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

    const { prompt, providerId = "system", modelId, history = [] } = await req.json();

    // Fetch user profile & providers to get custom user API keys
    const { data: profile } = await supabase
      .from("users")
      .select("providers")
      .eq("id", user.id)
      .single();

    const userProvider = profile?.providers?.find((p: any) => p.id === providerId);
    const customApiKey = userProvider?.apiKey;

    let responseText = "";

    if (providerId === "gemini" || providerId === "system") {
      const apiKey = customApiKey || Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        throw new Error("No Gemini API key found. Please connect your key in Settings.");
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...history.map((h: any) => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }],
              })),
              { role: "user", parts: [{ text: prompt }] },
            ],
          }),
        }
      );

      const data = await geminiRes.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } else if (providerId === "chatgpt") {
      const apiKey = customApiKey || Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) {
        throw new Error("No OpenAI API key found. Please connect your key in Settings.");
      }

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId || "gpt-4o",
          messages: [
            ...history.map((h: any) => ({ role: h.role, content: h.content })),
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await openaiRes.json();
      responseText = data.choices?.[0]?.message?.content || "No response generated.";
    } else {
      responseText = `Simulated response for ${providerId} model (${modelId}).`;
    }

    // Persist user & assistant chat messages into `chat_messages`
    await supabase.from("chat_messages").insert([
      {
        user_id: user.id,
        session_id: "default-session",
        provider_id: providerId,
        model_id: modelId || "default",
        role: "user",
        content: prompt,
      },
      {
        user_id: user.id,
        session_id: "default-session",
        provider_id: providerId,
        model_id: modelId || "default",
        role: "assistant",
        content: responseText,
      },
    ]);

    return new Response(JSON.stringify({ text: responseText, providerId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
