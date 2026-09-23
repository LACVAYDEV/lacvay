import { Router } from 'express';
import { chatWithAI } from '../services/aiService.js';

export const aiRouter = Router();

aiRouter.post('/chat', async (req, res) => {
  const { message, origin, originLat, originLng } = req.body as {
    message?: string;
    origin?: string;
    originLat?: number | string;
    originLng?: number | string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const lat = typeof originLat === 'number' ? originLat : Number(originLat);
  const lng = typeof originLng === 'number' ? originLng : Number(originLng);

  try {
    const { reply, plan } = await chatWithAI(message, {
      origin: origin?.trim() || undefined,
      originLat: Number.isFinite(lat) ? lat : undefined,
      originLng: Number.isFinite(lng) ? lng : undefined,
    });
    res.json({ reply, plan });
  } catch {
    res.status(500).json({ error: 'AI service unavailable' });
  }
});
