import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 50,
  message: { error: 'Przekroczono limit zapytań API. Zwolnij.' },
  standardHeaders: true,
  legacyHeaders: false,
});
