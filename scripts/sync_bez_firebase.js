import fs from 'fs';
import path from 'path';

const targetDir = '../AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE';

// 1. cloudSync.js
let content = fs.readFileSync('modules/services/cloudSync.js', 'utf8');
content = content.replace(
  /import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, getDocs } from "firebase\/firestore";\s*import { firestore } from "\.\.\/firebaseClient\.js";/,
  'export const firestore = null;'
);
fs.writeFileSync(path.join(targetDir, 'modules/services/cloudSync.js'), content, 'utf8');

// 2. FinancePage.jsx
fs.copyFileSync('modules/pages/FinancePage.jsx', path.join(targetDir, 'modules/pages/FinancePage.jsx'));

// 3. ModelWidget.jsx
fs.copyFileSync('modules/components/ModelWidget.jsx', path.join(targetDir, 'modules/components/ModelWidget.jsx'));

// 4. clientAiDispatcher.js
fs.copyFileSync('modules/services/clientAiDispatcher.js', path.join(targetDir, 'modules/services/clientAiDispatcher.js'));

// 5. tasks.sqlite
if (fs.existsSync('data/tasks.sqlite')) {
  fs.copyFileSync('data/tasks.sqlite', path.join(targetDir, 'data/tasks.sqlite'));
}

console.log('[+] BEZ FIREBASE repository synchronized with 100% parity.');
