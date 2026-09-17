const MOCK_RESPONSES: Record<string, string> = {
  'sm batangas': 'From Batangas City Grand Terminal to SM City Batangas, the documented regular fare is ₱32 across two jeepney legs. From Batangas Pier to SM City Batangas, the regular fare is ₱14.',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'restaurant': 'Try Lomi King for authentic Batangas lomi, Café Laguna at SM for Filipino comfort food, or Batangas Seafood Bay for fresh grilled seafood.',
  'fare': 'Traditional jeepneys charge ₱14 for the first 4 km plus ₱2 for every succeeding km. Tricycles range from ₱20–₱40 for short trips, motorcycle taxis (habal-habal) from ₱25–₱70, and taxis use metered fares starting around ₱40.',
  'jeepney': 'Jeepneys are the main public transport in Batangas City. Look for route signboards at the Grand Terminal and major roads.',
  'tricycle': 'Tricycles handle short trips inside barangays and to places jeepneys do not pass. Expect ₱20–₱40, and agree on the fare before boarding.',
  'motorcycle': 'Motorcycle taxis — habal-habal, or app-based riders — are the fastest way around traffic for a solo passenger. Fares usually run ₱25–₱70 in the city. Wear a helmet and travel light.',
  'habal': 'Habal-habal riders are motorcycle taxis common in Batangas. They are quick and cheap for one passenger, typically ₱25–₱70 depending on distance.',
  'taxi': 'Taxis in Batangas City are metered, starting around ₱40 plus roughly ₱15 per kilometre. They are the best pick for groups, luggage, or bad weather.',
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "I'm LACVAY AI, your Batangas City travel buddy! I can help with routes, fares, tourist spots, and restaurant recommendations. Try asking about SM Batangas, tourist spots, or nearby restaurants.";
}

const SYSTEM_INSTRUCTION = `You are the LACVAY AI Travel & Transit Assistant, dedicated exclusively to Batangas City. Your purpose is to help users find tourist spots, local restaurants, commuting routes (jeepneys, tricycles), and explain local transport guidelines.

STRICT RULE: You must explicitly refuse to answer any questions, perform any tasks, or generate any content that is unrelated to Batangas City tourism, commuting, or the LACVAY platform. If a user asks about general knowledge, coding, writing essays, politics, or other locations, you must decline.

If the user goes off-topic, always reply with a polite refusal similar to: "I am the LACVAY Travel Assistant. I am specifically designed to help you explore and commute within Batangas City. I cannot assist with other topics. Where would you like to go in Batangas today?"

Additional context you may use when relevant:
- Traditional jeepneys charge PHP14 for the first 4 km plus PHP2 for every succeeding km.
- Local transport includes jeepneys, tricycles, motorcycle taxis (habal-habal riders), metered taxis, and private car hire.
- Keep answers concise and practical, and remind users to verify fares with the operator.`;

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
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [{
            role: 'user',
            parts: [{ text: message }],
          }],
        }),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Gemini API returned status ${res.status}:`, errorText);
      return null;
    }
    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (error) {
    console.error('Failed to call Gemini API:', error);
    return null;
  }
}

export async function chatWithAI(message: string): Promise<string> {
  const geminiReply = await callGemini(message);
  if (geminiReply) return geminiReply;
  return getMockResponse(message);
}
