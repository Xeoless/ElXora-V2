export default async function handler(req, res) {
  // CORS - allow from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {
      console.error('OPENROUTER_API_KEY missing');
      return res.status(500).json({ error: 'Server error: API key not set' });
    }

    console.log('Proxy: Streaming request to OpenRouter with model z-ai/glm-4.5-air:free');

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://elxora.frii.site',
        'X-Title': 'ElXora Chat'
      },
      body: JSON.stringify({
        model: 'z-ai/glm-4.5-air:free',
        messages: body.messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true   // ← Streaming enabled for typing effect
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter error:', openRouterResponse.status, errorText);
      return res.status(openRouterResponse.status).json({ 
        error: `OpenRouter error ${openRouterResponse.status}: ${errorText}` 
      });
    }

    // Stream the response directly to the client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the streaming body from OpenRouter to the client
    openRouterResponse.body.pipe(res);

  } catch (error) {
    console.error('Proxy streaming error:', error.message, error.stack);
    return res.status(500).json({ error: 'Proxy failed: ' + (error.message || 'Unknown error') });
  }
}
