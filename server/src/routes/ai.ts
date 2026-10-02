import { Router } from 'express';
import { chatWithAI } from '../services/aiService.js';
import { requireUser } from '../middleware/requireUser.js';
import { incrementPromptCount } from '../services/usageService.js';

export const aiRouter = Router();

aiRouter.post('/chat', requireUser, async (req, res) => {
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

  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const lat = typeof originLat === 'number' ? originLat : Number(originLat);
  const lng = typeof originLng === 'number' ? originLng : Number(originLng);

  try {
    // Increment prompt count and get usage info
    const usageInfo = await incrementPromptCount(req.authUser.id);
    
    if (!usageInfo) {
      res.status(500).json({ error: 'Failed to track usage' });
      return;
    }

    const { reply, plan } = await chatWithAI(message, {
      origin: origin?.trim() || undefined,
      originLat: Number.isFinite(lat) ? lat : undefined,
      originLng: Number.isFinite(lng) ? lng : undefined,
    });

    res.json({ 
      reply, 
      plan,
      usage: usageInfo,
    });
  } catch {
    res.status(500).json({ error: 'AI service unavailable' });
  }
});
