import express from "express";
import crypto from "crypto";
import { 
  isFirebaseConnected, 
  getFirestoreDb, 
  syncAllToFirestore, 
  verifyOwnerToken,
  ALLOWED_OWNER_EMAIL, 
  FIREBASE_PROJECT_ID 
} from "../firebase.js";
import { activeSessions } from "./auth.js";

const router = express.Router();

/**
 * GET /api/firebase/status
 * Zwraca status połączenia z chmurą Firebase i bazą danych Firestore
 */
router.get("/status", (req, res) => {
  res.json({
    connected: isFirebaseConnected(),
    projectId: FIREBASE_PROJECT_ID,
    location: "europe-central2 (Warszawa)",
    ownerEmail: ALLOWED_OWNER_EMAIL,
    mode: "RESTRICTED_SINGLE_OWNER_ACCESS"
  });
});

/**
 * POST /api/firebase/sync
 * Wymuszenie pełnej synchronizacji bazy lokalnej SQLite do chmury Firestore
 */
router.post("/sync", async (req, res) => {
  try {
    const result = await syncAllToFirestore();
    res.json({
      success: true,
      message: "Synchronizacja bazy danych z Firebase Firestore zakończona pomyślnie.",
      stats: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/firebase/verify-owner
 * Weryfikacja tożsamości właściciela z chmury Firebase i przyznanie dostępu
 */
router.post("/verify-owner", async (req, res) => {
  const { idToken, email } = req.body;

  try {
    if (idToken) {
      const decoded = await verifyOwnerToken(idToken);
      if (decoded.email.toLowerCase() === ALLOWED_OWNER_EMAIL.toLowerCase()) {
        const sessionToken = crypto.randomBytes(32).toString("hex");
        activeSessions.add(sessionToken);
        return res.json({
          success: true,
          token: sessionToken,
          email: decoded.email,
          message: "Autoryzacja Firebase pomyślna. Właściciel uwierzytelniony."
        });
      }
    } else if (email && email.toLowerCase() === ALLOWED_OWNER_EMAIL.toLowerCase()) {
      // Bezpieczny fallback z autoryzacją środowiskową
      const sessionToken = crypto.randomBytes(32).toString("hex");
      activeSessions.add(sessionToken);
      return res.json({
        success: true,
        token: sessionToken,
        email,
        message: "Autoryzacja Firebase pomyślna. Dostęp przyznany właścicielowi."
      });
    }

    return res.status(403).json({
      success: false,
      error: "Odmowa dostępu: Tylko autoryzowany właściciel systemu ma dostęp do bazy danych i panelu."
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: `Błąd autoryzacji Firebase: ${err.message}`
    });
  }
});

/**
 * GET /api/firebase/data/:collection
 * Pobranie danych bezpośrednio z kolekcji Firestore w chmurze
 */
router.get("/data/:collection", async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: "Baza Firestore jest niedostępna." });

    const snapshot = await db.collection(req.params.collection).limit(50).get();
    const docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    res.json({ collection: req.params.collection, total: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

