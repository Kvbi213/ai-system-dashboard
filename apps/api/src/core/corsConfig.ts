const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://omnidash.internal'
];

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // allow mobile apps, curl, server-to-server calls
  if (origin === '*') return false; // strictly forbid wildcard

  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const whitelist = new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
  if (whitelist.has(origin)) return true;

  // Regex pattern matching localhost/127.0.0.1 on any port in development
  const localRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  return localRegex.test(origin);
};
