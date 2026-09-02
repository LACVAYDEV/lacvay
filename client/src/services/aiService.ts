import type { AIMessage } from '@/types';
import { generateId } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const MOCK_RESPONSES: Record<string, string> = {
  'sm batangas': 'To reach SM City Batangas, ride a jeepney from Batangas City Grand Terminal heading to Diversion Road. Travel time is about 15–20 minutes with a fare of ₱13–₱15.',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'restaurant': 'Try Lomi King for authentic Batangas lomi, Café Laguna at SM for Filipino comfort food, or Batangas Seafood Bay for fresh grilled seafood.',
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "I'm LACVAY AI, your Batangas City travel buddy! I can help with routes, fares, tourist spots, and restaurant recommendations. Try asking about SM Batangas, tourist spots, or nearby restaurants.";
}

export async function sendAIMessage(message: string): Promise<AIMessage> {
  try {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // fall through to mock
  }

  return {
    id: generateId(),
    role: 'assistant',
    content: getMockResponse(message),
    timestamp: new Date().toISOString(),
  };
}

export const AI_SUGGESTIONS = [
  'How to go to SM Batangas?',
  'What are the best tourist spots?',
  'Recommend nearby restaurants',
];
