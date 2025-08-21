import { createClient } from 'npm:@supabase/supabase-js@2';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

async function openaiChat(messages: any[]): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: OPENAI_MODEL, messages })
  });
  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { input, lang = 'en', system = 'You are a helpful assistant.' } = payload ?? {};
    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'No input provided' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const needsTranslation = String(lang).toLowerCase().startsWith('es');
    let promptEnglish = input as string;

    if (needsTranslation) {
      promptEnglish = await openaiChat([
        { role: 'system', content: "You are a translator. Translate the user's input from Spanish to English, preserving meaning and any technical terms. Only provide the translation." },
        { role: 'user', content: input }
      ]);
    }

    const answerEnglish = await openaiChat([
      { role: 'system', content: system },
      { role: 'user', content: promptEnglish }
    ]);

    let finalAnswer = answerEnglish;
    if (needsTranslation) {
      finalAnswer = await openaiChat([
        { role: 'system', content: 'Translate the assistant's answer from English to Spanish in a natural way, without adding extra explanations.' },
        { role: 'user', content: answerEnglish }
      ]);
    }

    // Return the content directly as expected by the client
    return new Response(JSON.stringify(finalAnswer), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});