import type { AIMessage } from '@/types';
import { generateId } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const MOCK_RESPONSES: Record<string, string> = {
  'sm batangas': 'From Batangas City Grand Terminal to SM City Batangas, the documented regular fare is ₱32 across two jeepney legs. From Batangas Pier to SM City Batangas, the regular fare is ₱14.',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'fare': 'Jeepney fares are based on fixed pricing: Standard Trip and Extended Trip (with discounts for students, seniors, and PWDs). Extended trip prices are cumulative totals, not per-kilometer additive. Tricycles run ₱20–₱40 for short trips, motorcycle taxis (habal-habal) ₱25–₱70, and taxis are metered from around ₱40.',
  'habal': 'Habal-habal riders are motorcycle taxis. Fast and affordable for one passenger, typically ₱25–₱70 depending on distance.',
  'taxi': 'Taxis here are metered, starting around ₱40 plus roughly ₱15 per kilometre — best for groups, luggage, or rainy days.',
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
