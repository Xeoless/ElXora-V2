export default async function handler(req, res) {
  // ... (keep all CORS and OPTIONS handling the same)

  try {
    // ... (keep everything else)

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...body,
        model: 'llama-3.3-70b-versatile',  // ← updated here
        stream: true
      })
    });

    // ... (keep the rest unchanged)
  } catch (error) {
    // ... (keep error handling)
  }
}
