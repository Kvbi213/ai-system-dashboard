import { Router, Request, Response } from 'express';
import { rulesEngine, AutomationRuleSchema } from './ruleEngine.js';

export const rulesRouter = Router();

rulesRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    engine: 'OmniDash Declarative Rule Engine v4.0 (KeepHQ Pattern)',
    rules: rulesEngine.getRules()
  });
});

rulesRouter.post('/evaluate', (req: Request, res: Response) => {
  const { trigger, data } = req.body;
  if (!trigger || !data || typeof data !== 'object') {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'Wymagane pola trigger (string) oraz data (object).' });
    return;
  }

  const result = rulesEngine.evaluateEvent(trigger, data);
  res.json({
    trigger,
    matchedCount: result.matchedRules.length,
    matchedRules: result.matchedRules.map((r) => r.name),
    executedActions: result.executedActions
  });
});

rulesRouter.post('/', (req: Request, res: Response) => {
  try {
    const validated = AutomationRuleSchema.parse(req.body);
    rulesEngine.addRule(validated);
    res.status(201).json({ success: true, rule: validated });
  } catch (err: any) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: err.message });
  }
});
