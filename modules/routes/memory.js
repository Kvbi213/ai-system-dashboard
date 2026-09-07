import express from 'express';
import { getAllFacts, deleteFact } from '../memory.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const facts = await getAllFacts();
  res.json({ facts });
});

router.delete('/:id', async (req, res) => {
  const result = await deleteFact(req.params.id);
  if (result.success) res.json(result);
  else res.status(500).json(result);
});

export default router;
