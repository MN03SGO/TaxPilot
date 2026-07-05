import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context, systemInstruction } = await req.json()

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openrouterKey && !geminiKey && !openaiKey) {
      // Fallback response if no API key is configured yet on Supabase Secrets
      return new Response(
        JSON.stringify({
          response: `¡Hola! Soy tu asistente de auditoría TaxPilot. Los datos están almacenados de forma segura en Supabase.
          
Actualmente tienes ${context?.stats?.totalProcessed || 0} DTEs procesados, de los cuales ${context?.stats?.errorCount || 0} tienen observaciones.

(Nota: Configura la variable GEMINI_API_KEY, OPENAI_API_KEY o la gratuita OPENROUTER_API_KEY en tus secretos de Supabase para habilitar respuestas completas con IA).`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let answer = "";

    // 1. Prioritize OpenRouter if key is set (excellent for free/affordable LLM keys)
    if (openrouterKey) {
      console.log("Calling OpenRouter API with openrouter/free model...");
      
      // Using openrouter/free which auto-routes to the best available free model dynamically
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://supabase.com", // Optional metadata for OpenRouter rankings
          "X-Title": "TaxPilot AI Assistant SV"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: systemInstruction || "Responde siempre en español de manera concisa y profesional."
            },
            {
              role: "user",
              content: `Contexto del panel y documentos DTE del contribuyente:\n${JSON.stringify(context, null, 2)}\n\nPregunta del usuario:\n${message}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error en API de OpenRouter: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || "No he podido generar una respuesta a través de OpenRouter.";
      
    } else {
      // 2. Direct Gemini/OpenAI API fallback
      const apiKey = geminiKey || openaiKey;
      console.log("Calling Gemini API directly...");
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemInstruction}\n\nContexto del panel y documentos DTE del contribuyente:\n${JSON.stringify(
                      context,
                      null,
                      2
                    )}\n\nPregunta del usuario:\n${message}`
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error en API de Gemini: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No he podido generar una respuesta.";
    }

    return new Response(
      JSON.stringify({ response: answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Chat function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
