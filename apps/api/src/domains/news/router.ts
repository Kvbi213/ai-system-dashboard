import { Router, Request, Response } from 'express';

export const newsRouter = Router();

const NEWS_FEED = [
  { id: '1', title: 'Linux Kernel 6.12 wydany z oficjalnym wsparciem PREEMPT_RT i łatkami bezpieczeństwa' },
  { id: '2', title: 'Nowa podatność zero-day w silnikach przeglądarek Chromium — zalecana natychmiastowa aktualizacja' },
  { id: '3', title: 'PostgreSQL 17 wprowadza ulepszenia partycjonowania i natywną optymalizację JSON query' },
  { id: '4', title: 'OpenAI i Google ogłaszają nowe modele agentowe z autonomicznym planowaniem zadań' },
  { id: '5', title: 'Standard HTTP/3 (QUIC) osiąga 32% globalnego ruchu w sieciach szkieletowych Cloudflare' }
];

newsRouter.get('/ticker', (_req: Request, res: Response) => {
  res.json({ news: NEWS_FEED });
});

newsRouter.get('/public', (_req: Request, res: Response) => {
  res.json({ news: NEWS_FEED });
});
