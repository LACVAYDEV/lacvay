import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { geoRouter } from './routes/geo.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);
app.use('/api/geo', geoRouter);

app.listen(PORT, () => {
  console.log(`LACVAY API running on http://localhost:${PORT}`);
});
