export default async function handler(req, res) {
  // CORS
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
      console.error('Missing OPENROUTER_API_KEY');
      return res.status(500).json({ error: 'Server error: API key not configured' });
    }

    console.log('Proxy: Starting streaming request to OpenRouter');

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
        stream: true
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter error:', openRouterResponse.status, errorText);
      return res.status(openRouterResponse.status).json({ 
        error: `OpenRouter error ${openRouterResponse.status}: ${errorText}` 
      });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the web stream correctly in Node.js/Vercel
    const reader = openRouterResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);  // Write chunks directly to the response
    }

    res.end();  // Close the stream when done

  } catch (error) {
    console.error('Proxy streaming error:', error.message, error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy failed: ' + (error.message || 'Unknown error') });
    } else {
      res.end();
    }
  }
        }
