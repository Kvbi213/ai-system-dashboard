import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseClient.js";

export const CLOUD_COLLECTIONS = {
  TASKS: 'tasks',
  FINANCES: 'finances',
  WORKOUTS: 'workouts',
  CALENDAR: 'calendar',
  OPERATOR_BRAIN: 'operator_brain',
  CHAT_HISTORY: 'chat_history',
  TIMETABLE: 'timetable'
};

export const INITIAL_FIRESTORE_DATA = {
  tasks: [
    { id: '1', title: 'Wdrożenie Firebase Hosting (void-potato-7721)', priority: 'HIGH', status: 'completed', category: 'system' },
    { id: '2', title: 'Autoryzacja właściciela: marektowarek21372137@gmail.com', priority: 'HIGH', status: 'completed', category: 'system' },
    { id: '3', title: 'Aktywacja modelu openai/gpt-oss-120b na Vercel', priority: 'HIGH', status: 'completed', category: 'ai' },
    { id: '4', title: 'Wielomodułowa synchronizacja kategorii Firestore', priority: 'MEDIUM', status: 'completed', category: 'system' },
    { id: '5', title: 'Personalizacja widżetów i analiza przepływów danych', priority: 'MEDIUM', status: 'pending', category: 'dashboard' }
  ],
  finances: [],
  workouts: [],
  calendar: [
    { id: 'c1', title: 'Przegląd Architektury OmniDash & Firestore', event_date: new Date().toISOString().split('T')[0], event_time: '10:00', priority: 'HIGH' },
    { id: 'c2', title: 'Audyt Stabilności Modelu GPT-120B', event_date: new Date().toISOString().split('T')[0], event_time: '14:30', priority: 'MEDIUM' }
  ],
  operator_brain: [
    { id: 'b1', category: 'Identity', fact: 'Operator: marektowarek21372137@gmail.com — pełne uprawnienia nadrzędne (Root Owner).', created_at: new Date().toISOString() },
    { id: 'b2', category: 'Engine & Model', fact: 'Podstawowy model kognitywny: openai/gpt-oss-120b zasilany przez Vercel Serverless Gateway.', created_at: new Date().toISOString() },
    { id: 'b3', category: 'Architecture', fact: 'Ekosystem rozproszony: Firebase Hosting + Firestore Realtime Database + Vercel Serverless API.', created_at: new Date().toISOString() },
    { id: 'b4', category: 'Preferences', fact: 'Formatowanie odpowiedzi: wyczerpujące, merytoryczne, wieloaspektowe z drzewiastymi strukturami Markdown.', created_at: new Date().toISOString() }
  ],
  chat_history: [
    { id: 'm1', role: 'ai', content: 'SYSTEM ONLINE. Silnik openai/gpt-oss-120b połączony przez Vercel Serverless Gateway. Baza Firestore zsynchronizowana.', timestamp: new Date().toISOString() }
  ],
  timetable: [
    {
        "id": "mon_2",
        "day": "monday",
        "subject": "Informatyka",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala 17",
        "teacher": "AB",
        "type": "Laboratorium",
        "color": "emerald",
        "notes": "Grupa 1"
    },
    {
        "id": "mon_3",
        "day": "monday",
        "subject": "Informatyka",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Sala 17",
        "teacher": "AB",
        "type": "Laboratorium",
        "color": "emerald",
        "notes": "Grupa 1"
    },
    {
        "id": "mon_4",
        "day": "monday",
        "subject": "Chemia",
        "time_start": "10:40",
        "time_end": "11:25",
        "room": "Sala 31",
        "teacher": "KP",
        "type": "Wykład",
        "color": "amber",
        "notes": ""
    },
    {
        "id": "mon_5",
        "day": "monday",
        "subject": "Edukacja zdrowotna",
        "time_start": "11:30",
        "time_end": "12:15",
        "room": "Sala 38",
        "teacher": "MS",
        "type": "Wykład",
        "color": "cyan",
        "notes": ""
    },
    {
        "id": "mon_6",
        "day": "monday",
        "subject": "Systemy operacyjne",
        "time_start": "12:20",
        "time_end": "13:05",
        "room": "Sala 1.2",
        "teacher": "PW",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Teoria i architektura systemów"
    },
    {
        "id": "mon_7",
        "day": "monday",
        "subject": "Systemy operacyjne",
        "time_start": "13:15",
        "time_end": "14:00",
        "room": "Sala 1.2",
        "teacher": "PW",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Warsztaty praktyczne"
    },
    {
        "id": "mon_8",
        "day": "monday",
        "subject": "Biznes i zarządzanie",
        "time_start": "14:05",
        "time_end": "14:50",
        "room": "Sala 0.2",
        "teacher": "PS",
        "type": "Wykład",
        "color": "purple",
        "notes": ""
    },
    {
        "id": "tue_1",
        "day": "tuesday",
        "subject": "Pracownia urządzeń techniki komputerowej",
        "time_start": "08:00",
        "time_end": "08:45",
        "room": "Sala 1.16",
        "teacher": "PW",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Grupa 1"
    },
    {
        "id": "tue_2",
        "day": "tuesday",
        "subject": "Pracownia urządzeń techniki komputerowej",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala 1.16",
        "teacher": "PW",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Grupa 1"
    },
    {
        "id": "tue_3",
        "day": "tuesday",
        "subject": "Zajęcia z wychowawcą",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Sala 1.16",
        "teacher": "ZJ",
        "type": "Inne",
        "color": "blue",
        "notes": "Godzina wychowawcza"
    },
    {
        "id": "tue_4",
        "day": "tuesday",
        "subject": "Wychowanie fizyczne",
        "time_start": "10:40",
        "time_end": "11:25",
        "room": "Hala",
        "teacher": "Gł",
        "type": "Ćwiczenia",
        "color": "cyan",
        "notes": "Grupa 1"
    },
    {
        "id": "tue_5",
        "day": "tuesday",
        "subject": "Wychowanie fizyczne",
        "time_start": "11:30",
        "time_end": "12:15",
        "room": "Hala",
        "teacher": "Gł",
        "type": "Ćwiczenia",
        "color": "cyan",
        "notes": "Grupa 1"
    },
    {
        "id": "tue_6",
        "day": "tuesday",
        "subject": "Pracownia systemów operacyjnych",
        "time_start": "12:20",
        "time_end": "13:05",
        "room": "Sala 1.2",
        "teacher": "SR",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Grupa 1"
    },
    {
        "id": "tue_7",
        "day": "tuesday",
        "subject": "Pracownia systemów operacyjnych",
        "time_start": "13:15",
        "time_end": "14:00",
        "room": "Sala 1.2",
        "teacher": "SR",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Grupa 1"
    },
    {
        "id": "tue_8",
        "day": "tuesday",
        "subject": "Matematyka",
        "time_start": "14:05",
        "time_end": "14:50",
        "room": "Sala 24",
        "teacher": "ZB",
        "type": "Wykład",
        "color": "rose",
        "notes": ""
    },
    {
        "id": "wed_4",
        "day": "wednesday",
        "subject": "Religia",
        "time_start": "10:40",
        "time_end": "11:25",
        "room": "Sala 1.16",
        "teacher": "R3",
        "type": "Wykład",
        "color": "amber",
        "notes": ""
    },
    {
        "id": "wed_5",
        "day": "wednesday",
        "subject": "Biologia",
        "time_start": "11:30",
        "time_end": "12:15",
        "room": "Sala 19",
        "teacher": "JŁ",
        "type": "Wykład",
        "color": "emerald",
        "notes": ""
    },
    {
        "id": "wed_6",
        "day": "wednesday",
        "subject": "Urządzenia techniki komputerowej",
        "time_start": "12:20",
        "time_end": "13:05",
        "room": "Sala 1.16",
        "teacher": "BG",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Sprzęt i diagnostyka"
    },
    {
        "id": "wed_7",
        "day": "wednesday",
        "subject": "Urządzenia techniki komputerowej",
        "time_start": "13:15",
        "time_end": "14:00",
        "room": "Sala 1.16",
        "teacher": "BG",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Warsztaty sprzętowe"
    },
    {
        "id": "wed_8",
        "day": "wednesday",
        "subject": "Historia",
        "time_start": "14:05",
        "time_end": "14:50",
        "room": "Sala 06",
        "teacher": "WW",
        "type": "Wykład",
        "color": "purple",
        "notes": ""
    },
    {
        "id": "wed_9",
        "day": "wednesday",
        "subject": "Matematyka",
        "time_start": "14:55",
        "time_end": "15:40",
        "room": "Sala 24",
        "teacher": "ZB",
        "type": "Wykład",
        "color": "rose",
        "notes": ""
    },
    {
        "id": "thu_1",
        "day": "thursday",
        "subject": "Język polski",
        "time_start": "08:00",
        "time_end": "08:45",
        "room": "Sala 34",
        "teacher": "AN",
        "type": "Wykład",
        "color": "blue",
        "notes": ""
    },
    {
        "id": "thu_2",
        "day": "thursday",
        "subject": "Język angielski",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala Z2",
        "teacher": "ZJ",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Grupa 1"
    },
    {
        "id": "thu_3",
        "day": "thursday",
        "subject": "Język angielski zawodowy",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Sala Z2",
        "teacher": "ZJ",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Grupa 1"
    },
    {
        "id": "thu_4",
        "day": "thursday",
        "subject": "Pracownia lokalnych sieci komputerowych",
        "time_start": "10:40",
        "time_end": "11:25",
        "room": "Sala 1.16",
        "teacher": "KŁ",
        "type": "Laboratorium",
        "color": "cyan",
        "notes": "Konfiguracja LAN"
    },
    {
        "id": "thu_5",
        "day": "thursday",
        "subject": "Pracownia lokalnych sieci komputerowych",
        "time_start": "11:30",
        "time_end": "12:15",
        "room": "Sala 1.16",
        "teacher": "KŁ",
        "type": "Laboratorium",
        "color": "cyan",
        "notes": "Protokoły i routing"
    },
    {
        "id": "thu_6",
        "day": "thursday",
        "subject": "Matematyka",
        "time_start": "12:20",
        "time_end": "13:05",
        "room": "Sala 35",
        "teacher": "ZB",
        "type": "Wykład",
        "color": "rose",
        "notes": ""
    },
    {
        "id": "thu_7",
        "day": "thursday",
        "subject": "Matematyka",
        "time_start": "13:15",
        "time_end": "14:00",
        "room": "Sala 35",
        "teacher": "ZB",
        "type": "Wykład",
        "color": "rose",
        "notes": ""
    },
    {
        "id": "thu_8",
        "day": "thursday",
        "subject": "Język niemiecki",
        "time_start": "14:05",
        "time_end": "14:50",
        "room": "Sala Z1",
        "teacher": "BC",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Grupa 1"
    },
    {
        "id": "thu_9",
        "day": "thursday",
        "subject": "Biologia",
        "time_start": "14:55",
        "time_end": "15:40",
        "room": "Sala 19",
        "teacher": "JŁ",
        "type": "Wykład",
        "color": "emerald",
        "notes": ""
    },
    {
        "id": "fri_1",
        "day": "friday",
        "subject": "Język angielski",
        "time_start": "08:00",
        "time_end": "08:45",
        "room": "Sala Z2",
        "teacher": "ZJ",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Grupa 1"
    },
    {
        "id": "fri_2",
        "day": "friday",
        "subject": "Język niemiecki",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala Z1",
        "teacher": "BC",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Grupa 1"
    },
    {
        "id": "fri_3",
        "day": "friday",
        "subject": "Wychowanie fizyczne",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Hala",
        "teacher": "Gł",
        "type": "Ćwiczenia",
        "color": "cyan",
        "notes": "Grupa 1"
    },
    {
        "id": "fri_4",
        "day": "friday",
        "subject": "Lokalne sieci komputerowe",
        "time_start": "10:40",
        "time_end": "11:25",
        "room": "Sala 1.16",
        "teacher": "PW",
        "type": "Laboratorium",
        "color": "cyan",
        "notes": "Architektura sieciowa"
    },
    {
        "id": "fri_5",
        "day": "friday",
        "subject": "Chemia",
        "time_start": "11:30",
        "time_end": "12:15",
        "room": "Sala 31",
        "teacher": "KP",
        "type": "Wykład",
        "color": "amber",
        "notes": ""
    },
    {
        "id": "fri_6",
        "day": "friday",
        "subject": "Edukacja obywatelska",
        "time_start": "12:20",
        "time_end": "13:05",
        "room": "Sala 09",
        "teacher": "AC",
        "type": "Wykład",
        "color": "purple",
        "notes": ""
    },
    {
        "id": "fri_7",
        "day": "friday",
        "subject": "Język polski",
        "time_start": "13:15",
        "time_end": "14:00",
        "room": "Sala 34",
        "teacher": "AN",
        "type": "Wykład",
        "color": "blue",
        "notes": ""
    },
    {
        "id": "fri_8",
        "day": "friday",
        "subject": "Język polski",
        "time_start": "14:05",
        "time_end": "14:50",
        "room": "Sala 34",
        "teacher": "AN",
        "type": "Wykład",
        "color": "blue",
        "notes": ""
    }
]
};

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
    } else if (INITIAL_FIRESTORE_DATA[collectionName]) {
      onData(INITIAL_FIRESTORE_DATA[collectionName]);
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
          // Jeśli kolekcja w chmurze jest pusta, użyj starter data lub cache do auto-inicjalizacji
          const defaultItems = INITIAL_FIRESTORE_DATA[collectionName] || fallbackData;
          const cached = localStorage.getItem(cacheKey);
          const toSeed = (cached && JSON.parse(cached)?.length > 0) ? JSON.parse(cached) : defaultItems;

          if (Array.isArray(toSeed) && toSeed.length > 0) {
            onData(toSeed);
            localStorage.setItem(cacheKey, JSON.stringify(toSeed));
            toSeed.forEach(async (item) => {
              try {
                const itemId = String(item.id || Date.now() + Math.random());
                await setDoc(doc(firestore, collectionName, itemId), item, { merge: true });
              } catch (syncErr) {
                console.warn(`[CloudSync] Inicjalizacja ${collectionName}/${item.id}:`, syncErr.message);
              }
            });
          }
        }
      },
      (error) => {
        console.warn(`[CloudSync] Firestore listener fallback dla ${collectionName}:`, error.message);
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

/**
 * Inicjalizuje wszystkie kolekcje Firestore (tasks, finances, workouts, calendar, operator_brain, chat_history)
 * sprawdzając ich stan i wysyłając dane starterowe.
 */
export const initializeAllFirestoreCollections = async () => {
  const results = {};
  const colKeys = Object.keys(INITIAL_FIRESTORE_DATA);

  for (const key of colKeys) {
    const defaultData = INITIAL_FIRESTORE_DATA[key];
    const cacheKey = `cloud_cache_${key}`;
    let count = 0;

    // Zapis do cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        localStorage.setItem(cacheKey, JSON.stringify(defaultData));
      }
    } catch {}

    // Zapis do Firestore
    if (firestore) {
      try {
        const colRef = collection(firestore, key);
        const snapshot = await getDocs(colRef);
        count = snapshot.size;

        if (count === 0) {
          for (const item of defaultData) {
            const itemId = String(item.id || Date.now() + Math.random());
            await setDoc(doc(firestore, key, itemId), item, { merge: true });
            count++;
          }
        }
      } catch (err) {
        console.warn(`[CloudSync] Błąd inicjalizacji kolekcji ${key}:`, err.message);
      }
    }
    results[key] = count;
  }

  return results;
};
