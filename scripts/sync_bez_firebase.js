import fs from 'fs';
import path from 'path';

const targetDir = '../AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE';

// 1. cloudSync.js (with firebase stubbed out)
let content = fs.readFileSync('modules/services/cloudSync.js', 'utf8');
content = content.replace(
  /import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, getDocs } from "firebase\/firestore";\s*import { firestore } from "\.\.\/firebaseClient\.js";/,
  'export const firestore = null;'
);
fs.writeFileSync(path.join(targetDir, 'modules/services/cloudSync.js'), content, 'utf8');

// 1b. firebaseClient.js stub
const firebaseClientStub = `export const app = null;
export const auth = null;
export const googleProvider = null;
export const firestore = null;
export const signInWithPopup = async () => null;
export const signOut = async () => {};
export const ALLOWED_OWNER_EMAIL = "marektowarek21372137@gmail.com";
`;
fs.writeFileSync(path.join(targetDir, 'modules/firebaseClient.js'), firebaseClientStub, 'utf8');

// 2. Updated pages & components
const filesToSync = [
  'modules/pages/Dashboard.jsx',
  'modules/pages/ChatPage.jsx',
  'modules/pages/TimetablePage.jsx',
  'modules/pages/FinancePage.jsx',
  'modules/pages/WorkoutsPage.jsx',
  'modules/pages/CalendarPage.jsx',
  'modules/pages/SettingsPage.jsx',
  'modules/pages/WidgetsPage.jsx',
  'modules/pages/MemoryPage.jsx',
  'modules/pages/OSINTPage.jsx',
  'modules/pages/ServerPage.jsx',
  'modules/pages/SearchPage.jsx',
  'modules/pages/LockScreen.jsx',
  'modules/components/Sidebar.jsx',
  'modules/components/Terminal.jsx',
  'modules/components/ChatInlineWidgets.jsx',
  'modules/components/SystemMonitor.jsx',
  'modules/components/NetworkMonitor.jsx',
  'modules/components/ModelStatus.jsx',
  'modules/components/AgentQueue.jsx',
  'modules/components/WeatherWidget.jsx',
  'modules/components/ModelWidget.jsx',
  'modules/components/SetupWizard.jsx',
  'modules/components/ITNewsTicker.jsx',
  'modules/components/CommandPalette.jsx',
  'modules/context/ChatContext.jsx',
  'modules/config/constants.js',
  'modules/services/clientAiDispatcher.js',
  'api/news.js',
  'api/agent.js',
  'api/status.js',
  'api/osint.js',
  'core.client.jsx',
  'assets/styles/index.css',
  'package.json',
  'HISTORY.md',
  'ARCHITECTURE.md',
  'docs/versions/v2.11.0.md',
  'docs/versions/v2.11.1.md',
  'docs/versions/v2.11.2.md',
  'docs/versions/v2.11.3.md',
  'docs/versions/v2.11.4.md',
  'docs/versions/v2.11.5.md'
];

filesToSync.forEach(relPath => {
  const src = relPath;
  const dest = path.join(targetDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
});

// 3. tasks.sqlite
if (fs.existsSync('data/tasks.sqlite')) {
  fs.copyFileSync('data/tasks.sqlite', path.join(targetDir, 'data/tasks.sqlite'));
}

console.log('[+] BEZ FIREBASE repository synchronized with 100% parity.');
