import './config/env.js';
import express from 'express';
import cors from 'cors';
import { adminRouter } from './routes/admin.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { accountRouter } from './routes/account.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/account', accountRouter);

app.listen(PORT, () => {
  console.log(`LACVAY API running on http://localhost:${PORT}`);
});
