import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query } from "firebase/firestore";
import { firestore } from "../firebaseClient.js";

export const subscribeCollection = (collectionName, onData, fallbackData = []) => {
  // Najpierw natychmiast załaduj dane z cache localStorage dla zerowego czasu oczekiwania
  const cacheKey = `cloud_cache_${collectionName}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onData(parsed);
      }
    } else if (fallbackData.length > 0) {
      onData(fallbackData);
    }
  } catch (e) {
    console.warn(`[CloudSync] Błąd odczytu cache dla ${collectionName}:`, e);
  }

  // Jeśli brak instancji Firestore, pozostań na cache
  if (!firestore) return () => {};

  try {
    const colRef = collection(firestore, collectionName);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Jeśli w Firestore są dane, aktualizuj widok i cache
        if (items.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(items));
          onData(items);
        } else {
          // Jeśli kolekcja w chmurze jest pusta, sprawdź czy mamy dane w cache do zainicjowania
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onData(parsed);
              // Automatyczna synchronizacja wsteczna do pustej chmury
              parsed.forEach(async (item) => {
                try {
                  const itemId = String(item.id || Date.now() + Math.random());
                  await setDoc(doc(firestore, collectionName, itemId), item);
                } catch (syncErr) {
                  console.warn(`[CloudSync] Sync initial error:`, syncErr);
                }
              });
            }
          } else if (fallbackData.length > 0) {
            onData(fallbackData);
          }
        }
      },
      (error) => {
        console.warn(`[CloudSync] Firestore listener fallback dla ${collectionName}:`, error.message);
        // W razie błędu uprawnień lub braku sieci użyj cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try { onData(JSON.parse(cached)); } catch {}
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`[CloudSync] Inicjalizacja subskrypcji ${collectionName} nie powiodła się:`, err);
    return () => {};
  }
};

export const saveCloudDocument = async (collectionName, docId, data) => {
  const cacheKey = `cloud_cache_${collectionName}`;
  const idStr = String(docId || Date.now());
  const itemToSave = { ...data, id: idStr, updated_at: new Date().toISOString() };

  // 1. Zapis natychmiastowy w pamięci lokalnej (Optymistyczny UI)
  try {
    const cached = localStorage.getItem(cacheKey);
    let items = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(items)) items = [];
    const existingIndex = items.findIndex((i) => String(i.id) === idStr);
    if (existingIndex >= 0) {
      items[existingIndex] = itemToSave;
    } else {
      items.unshift(itemToSave);
    }
    localStorage.setItem(cacheKey, JSON.stringify(items));
  } catch (e) {
    console.warn(`[CloudSync] Błąd optymistycznego zapisu:`, e);
  }

  // 2. Propagacja do Cloud Firestore
  if (firestore) {
    try {
      await setDoc(doc(firestore, collectionName, idStr), itemToSave, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Błąd zapisu do chmury Firestore (${collectionName}/${idStr}):`, e.message);
    }
  }

  return itemToSave;
};

export const deleteCloudDocument = async (collectionName, docId) => {
  const cacheKey = `cloud_cache_${collectionName}`;
  const idStr = String(docId);

  // 1. Usunięcie natychmiastowe z pamięci lokalnej
  try {
    const cached = localStorage.getItem(cacheKey);
    let items = cached ? JSON.parse(cached) : [];
    if (Array.isArray(items)) {
      items = items.filter((i) => String(i.id) !== idStr);
      localStorage.setItem(cacheKey, JSON.stringify(items));
    }
  } catch (e) {
    console.warn(`[CloudSync] Błąd optymistycznego usunięcia:`, e);
  }

  // 2. Usunięcie z Cloud Firestore
  if (firestore) {
    try {
      await deleteDoc(doc(firestore, collectionName, idStr));
    } catch (e) {
      console.warn(`[CloudSync] Błąd usunięcia z chmury (${collectionName}/${idStr}):`, e.message);
    }
  }
};

export const updateCloudDocumentField = async (collectionName, docId, fields) => {
  const cacheKey = `cloud_cache_${collectionName}`;
  const idStr = String(docId);

  // 1. Aktualizacja optymistyczna lokalnie
  try {
    const cached = localStorage.getItem(cacheKey);
    let items = cached ? JSON.parse(cached) : [];
    if (Array.isArray(items)) {
      items = items.map((i) => (String(i.id) === idStr ? { ...i, ...fields, updated_at: new Date().toISOString() } : i));
      localStorage.setItem(cacheKey, JSON.stringify(items));
    }
  } catch (e) {
    console.warn(`[CloudSync] Błąd optymistycznej aktualizacji:`, e);
  }

  // 2. Aktualizacja w Cloud Firestore
  if (firestore) {
    try {
      await updateDoc(doc(firestore, collectionName, idStr), {
        ...fields,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(`[CloudSync] Błąd aktualizacji w chmurze (${collectionName}/${idStr}):`, e.message);
    }
  }
};
