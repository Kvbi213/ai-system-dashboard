import { Router, Request, Response } from 'express';
import { semanticMemory } from './semanticRecall.js';

export const memoryRouter = Router();

memoryRouter.get('/facts', (_req: Request, res: Response) => {
  const facts = semanticMemory.getFacts();
  res.json({
    count: facts.length,
    facts
  });
});

memoryRouter.post('/recall', (req: Request, res: Response) => {
  const { query, limit, minScore } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'Wymagane pole query (string).' });
    return;
  }

  const result = semanticMemory.recall(query, limit || 4, minScore ?? 0.2);
  res.json(result);
});

memoryRouter.post('/facts', (req: Request, res: Response) => {
  const { category, content, tags } = req.body;
  if (!category || !content) {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'Wymagane pola category i content.' });
    return;
  }

  const created = semanticMemory.addFact({
    category,
    content,
    tags: Array.isArray(tags) ? tags : []
  });

  res.status(201).json({
    success: true,
    fact: created
  });
});

memoryRouter.get('/status', (_req: Request, res: Response) => {
  const facts = semanticMemory.getFacts();
  res.json({
    engine: 'Lab-Zero Lightweight Semantic Recall v4.0',
    vectorDimensions: 128,
    isOffline: true,
    totalFacts: facts.length,
    categories: ['HABIT', 'WORKOUT', 'FINANCE', 'SCHOOL', 'SYSTEM', 'PREFERENCE']
  });
});
