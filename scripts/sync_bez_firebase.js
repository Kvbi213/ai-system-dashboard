import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('modules/services/cloudSync.js', 'utf8');
content = content.replace(
  /import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, getDocs } from "firebase\/firestore";\s*import { firestore } from "\.\.\/firebaseClient\.js";/,
  'export const firestore = null;'
);
fs.writeFileSync('../AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE/modules/services/cloudSync.js', content, 'utf8');
console.log('[+] BEZ FIREBASE cloudSync.js updated successfully with real timetable.');
