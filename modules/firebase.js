import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { executeQuery } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../");

export const ALLOWED_OWNER_EMAIL = process.env.FIREBASE_OWNER_EMAIL || "owner@omnidash.local";
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "void-potato-7721";

let db = null;
let auth = null;
let isConnected = false;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
    ? path.resolve(rootDir, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(rootDir, "firebase-service-account.json");

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
    }
    db = getFirestore();
    auth = getAuth();
    isConnected = true;
    console.log("[+] SUCCESS: Połączono z Firebase Firestore (" + FIREBASE_PROJECT_ID + " / europe-central2).");
  } else {
    console.warn("[!] WARN: Brak pliku firebase-service-account.json. Firebase nieaktywny.");
  }
} catch (error) {
  console.error("[!] ERROR: Błąd inicjalizacji Firebase:", error.message);
}

export const getFirestoreDb = () => db;
export const getFirebaseAuth = () => auth;
export const isFirebaseConnected = () => isConnected;

/**
 * Weryfikacja tokena tożsamości Firebase i sprawdzenie czy użytkownik to zdefiniowany właściciel
 */
export const verifyOwnerToken = async (idToken) => {
  if (!isConnected || !auth) {
    throw new Error("Moduł Firebase Auth nie jest zainicjalizowany.");
  }
  const decodedToken = await auth.verifyIdToken(idToken);
  if (decodedToken.email !== ALLOWED_OWNER_EMAIL) {
    throw new Error("Odmowa dostępu: Wykryto nieautoryzowany adres e-mail.");
  }
  return decodedToken;
};

/**
 * Pełna synchronizacja bazy lokalnej SQLite z chmurą Firestore
 */
export const syncAllToFirestore = async () => {
  if (!isConnected || !db) {
    throw new Error("Firebase nie jest połączony.");
  }

  const results = {
    tasksSynced: 0,
    financesSynced: 0,
    calendarSynced: 0,
    timestamp: new Date().toISOString()
  };

  try {
    const tasks = await executeQuery("SELECT * FROM tasks");
    if (tasks && tasks.length > 0) {
      const batch = db.batch();
      for (const task of tasks) {
        const docRef = db.collection("tasks").doc(String(task.id));
        batch.set(docRef, { ...task, synced_at: results.timestamp }, { merge: true });
        results.tasksSynced++;
      }
      await batch.commit();
    }
  } catch (err) {
    console.error("[!] Błąd synchronizacji zadań do Firestore:", err.message);
  }

  try {
    const finances = await executeQuery("SELECT * FROM finances");
    if (finances && finances.length > 0) {
      const batch = db.batch();
      for (const item of finances) {
        const docRef = db.collection("finances").doc(String(item.id));
        batch.set(docRef, { ...item, synced_at: results.timestamp }, { merge: true });
        results.financesSynced++;
      }
      await batch.commit();
    }
  } catch (err) {
    console.error("[!] Błąd synchronizacji finansów do Firestore:", err.message);
  }

  try {
    const events = await executeQuery("SELECT * FROM calendar_events");
    if (events && events.length > 0) {
      const batch = db.batch();
      for (const ev of events) {
        const docRef = db.collection("calendar_events").doc(String(ev.id));
        batch.set(docRef, { ...ev, synced_at: results.timestamp }, { merge: true });
        results.calendarSynced++;
      }
      await batch.commit();
    }
  } catch (err) {
    console.error("[!] Błąd synchronizacji kalendarza do Firestore:", err.message);
  }

  // Synchronizacja pamięci podręcznej Librus Synergia (oceny, terminarz, plan lekcji)
  try {
    const librusGradesRow = await executeQuery("SELECT data, lucky_number, last_sync FROM librus_cache WHERE id = 1");
    if (librusGradesRow && librusGradesRow[0]?.data) {
      const gradesData = JSON.parse(librusGradesRow[0].data);
      await db.collection("librus_cache").doc("latest").set({
        ...gradesData,
        luckyNumber: librusGradesRow[0].lucky_number,
        synced_at: results.timestamp,
        updated_at: new Date().toISOString()
      }, { merge: true });
      results.librusGradesSynced = 1;
      console.log("[+] SUCCESS :: FIREBASE :: Zsynchronizowano oceny Librus (librus_cache/latest).");
    }
  } catch (err) {
    console.error("[!] Błąd synchronizacji ocen Librus do Firestore:", err.message);
  }

  try {
    const librusCalRow = await executeQuery("SELECT data, last_sync FROM librus_calendar_cache WHERE id = 1");
    if (librusCalRow && librusCalRow[0]?.data) {
      const calData = JSON.parse(librusCalRow[0].data);
      await db.collection("librus_cache").doc("calendar").set({
        ...calData,
        synced_at: results.timestamp,
        updated_at: new Date().toISOString()
      }, { merge: true });
      results.librusCalendarSynced = 1;
      console.log("[+] SUCCESS :: FIREBASE :: Zsynchronizowano terminarz Librus (librus_cache/calendar).");
    }
  } catch (err) {
    console.error("[!] Błąd synchronizacji terminarza Librus do Firestore:", err.message);
  }

  try {
    const librusTtRow = await executeQuery("SELECT data, last_sync FROM librus_timetable_cache WHERE id = 1");
    if (librusTtRow && librusTtRow[0]?.data) {
      const ttData = JSON.parse(librusTtRow[0].data);
      await db.collection("librus_cache").doc("timetable").set({
        ...ttData,
        synced_at: results.timestamp,
        updated_at: new Date().toISOString()
      }, { merge: true });
      results.librusTimetableSynced = 1;
      console.log("[+] SUCCESS :: FIREBASE :: Zsynchronizowano plan lekcji Librus (librus_cache/timetable).");
    }
  } catch (err) {
    console.error("[!] Błąd synchronizacji planu lekcji Librus do Firestore:", err.message);
  }

  // Zapis metadanych synchronizacji
  await db.collection("system_metadata").doc("last_sync").set(results, { merge: true });

  return results;
};

export default {
  db,
  auth,
  isFirebaseConnected,
  getFirestoreDb,
  getFirebaseAuth,
  verifyOwnerToken,
  syncAllToFirestore,
  ALLOWED_OWNER_EMAIL,
  FIREBASE_PROJECT_ID
};

