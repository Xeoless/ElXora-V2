export default async function handler(req, res) {
  // Allow CORS from anywhere (for testing)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the request body (messages + model from frontend)
    const body = req.body;

    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY in environment variables');
      return res.status(500).json({ error: 'Server configuration error: missing API key' });
    }

    console.log('Sending request to Groq with model: llama-3.1-8b-instant');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',   // fast & free model
        messages: body.messages,          // pass messages from frontend
        temperature: 0.7,
        max_tokens: 2048,
        stream: false                     // no streaming = full reply at once
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq error:', groqResponse.status, errorText);
      return res.status(groqResponse.status).json({ 
        error: `Groq API error ${groqResponse.status}: ${errorText}` 
      });
    }

    // Get the full JSON response
    const data = await groqResponse.json();

    // Return the assistant's reply
    const assistantReply = data.choices?.[0]?.message?.content || '';

    if (!assistantReply) {
      return res.status(500).json({ error: 'No reply received from Groq' });
    }

    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: assistantReply
        }
      }]
    });

  } catch (error) {
    console.error('Proxy crash:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Proxy failed: ' + (error.message || 'Unknown error') 
    });
  }
}
