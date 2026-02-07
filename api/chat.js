// api/chat.js
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.referer || 'https://elxora-chat.vercel.app',
        'X-Title': 'ElXora Chat'
      },
      body: JSON.stringify(req.body)
    });

    // Stream the response back
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the streaming body
    response.body.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proxy error' });
  }
}
