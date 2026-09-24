import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const serviceAccountPath = path.resolve(rootDir, 'firebase-service-account.json');

console.log('[*] DEPLOY: Inicjalizacja wdrożenia Firebase Hosting...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

const env = {
  ...process.env,
  GOOGLE_APPLICATION_CREDENTIALS: serviceAccountPath
};

const targetProject = process.env.FIREBASE_PROJECT_ID || 'omnidash-509607';

console.log(`[*] DEPLOY: Wypychanie pakietu do ${targetProject}.web.app...`);
execSync(`firebase deploy --only hosting --project ${targetProject}`, { cwd: rootDir, env, stdio: 'inherit' });
console.log(`[+] SUCCESS: Pomyślnie wdrożono nową wersję do chmury Firebase Hosting (${targetProject})!`);
