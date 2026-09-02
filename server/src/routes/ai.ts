import { Router } from 'express';
import { chatWithAI } from '../services/aiService.js';

export const aiRouter = Router();

aiRouter.post('/chat', async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message?.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    const reply = await chatWithAI(message);
    res.json({ reply });
  } catch {
    res.status(500).json({ error: 'AI service unavailable' });
  }
});
