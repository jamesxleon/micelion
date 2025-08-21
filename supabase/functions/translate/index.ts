Deno.serve(async (req) => {
  const { text, target_lang } = await req.json().catch(() => ({}));
  if (!text || !target_lang) {
    return new Response(JSON.stringify({ error: 'Missing text or target_lang' }), { status: 400 });
  }
  const resp = await fetch('https://api.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${Deno.env.get('DEEPL_API_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ text, target_lang })
  });
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: 'Translation failed' }), { status: 502 });
  }
  const data = await resp.json();
  return new Response(JSON.stringify(data.translations?.[0] ?? {}), {
    headers: { 'Content-Type': 'application/json' }
  });
});

