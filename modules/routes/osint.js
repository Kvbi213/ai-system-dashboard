import express from 'express';
import { performOSINTScan } from '../osint.js';
import { apiLimiter } from './middleware.js';

const router = express.Router();

router.post('/', apiLimiter, async (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ error: 'Brak podanego celu (target).' });
  const result = await performOSINTScan(target);
  res.json(result);
});

export default router;
