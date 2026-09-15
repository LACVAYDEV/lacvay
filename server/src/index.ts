import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { adminRouter } from './routes/admin.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`LACVAY API running on http://localhost:${PORT}`);
});
