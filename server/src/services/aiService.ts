const MOCK_RESPONSES: Record<string, string> = {
  'sm batangas': 'To reach SM City Batangas, ride a jeepney from Batangas City Grand Terminal heading to Diversion Road. Travel time is about 15–20 minutes with a fare of ₱13–₱15.',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'restaurant': 'Try Lomi King for authentic Batangas lomi, Café Laguna at SM for Filipino comfort food, or Batangas Seafood Bay for fresh grilled seafood.',
  'fare': 'Jeepney fares in Batangas City typically start at ₱13. Tricycles range from ₱20–₱40 for short trips. Taxis use metered fares starting around ₱40.',
  'jeepney': 'Jeepneys are the main public transport in Batangas City. Look for route signboards at the Grand Terminal and major roads.',
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "I'm LACVAY AI, your Batangas City travel buddy! I can help with routes, fares, tourist spots, and restaurant recommendations. Try asking about SM Batangas, tourist spots, or nearby restaurants.";
}

async function callGemini(message: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are LACVAY AI, a friendly travel assistant for Batangas City, Batangas, Philippines. Help with routes, jeepney/tricycle fares, tourist spots, and local restaurants. Keep answers concise and practical.\n\nUser: ${message}`,
            }],
          }],
        }),
      },
    );

    if (!res.ok) return null;
    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function chatWithAI(message: string): Promise<string> {
  const geminiReply = await callGemini(message);
  if (geminiReply) return geminiReply;
  return getMockResponse(message);
}
