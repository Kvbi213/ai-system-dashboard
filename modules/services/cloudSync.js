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
  finances: [
    { id: 'f1', type: 'income', amount: 8500, category: 'Przychód główny', bucket: 'needs', description: 'Wynagrodzenie kontraktowe', transaction_date: new Date().toISOString().split('T')[0] },
    { id: 'f2', type: 'expense', amount: 120, category: 'Infrastruktura', bucket: 'needs', description: 'Domena i zasoby chmurowe', transaction_date: new Date().toISOString().split('T')[0] },
    { id: 'f3', type: 'expense', amount: 350, category: 'Edukacja & AI', bucket: 'savings', description: 'Subskrypcje badawcze i API', transaction_date: new Date().toISOString().split('T')[0] }
  ],
  workouts: [
    { id: 'w1', title: 'FBW Power Circuit (Góra/Dół)', type: 'Siłowy', description: 'Przysiady 4x8, Wyciskanie sztangi 4x8, Podciąganie 4xMax, Martwy ciąg 3x5', date: new Date().toISOString().split('T')[0] },
    { id: 'w2', title: 'Kondycja & Tlen (Strefa 2)', type: 'Cardio', description: 'Bieg ciągły 45 minut przy tętnie 135-145 bpm', date: new Date().toISOString().split('T')[0] }
  ],
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
        "subject": "Informatyka / Język niemiecki",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala 17 / Sala 14",
        "teacher": "AB / GP",
        "type": "Laboratorium",
        "color": "emerald",
        "notes": "Podział na grupy: Gr 1: Informatyka (AB, s. 17) | Gr 2: J. niemiecki (GP, s. 14)"
    },
    {
        "id": "mon_3",
        "day": "monday",
        "subject": "Informatyka / Język angielski zawodowy",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Sala 17 / Sz1",
        "teacher": "AB / ZJ",
        "type": "Laboratorium",
        "color": "emerald",
        "notes": "Podział na grupy: Gr 1: Informatyka (AB, s. 17) | Gr 2: J. angielski zawodowy (ZJ, Sz1)"
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
        "notes": "Lekcja 4"
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
        "notes": "Lekcja 5"
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
        "notes": "Lekcja 6: Teoria i architektura systemów"
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
        "notes": "Lekcja 7: Warsztaty praktyczne"
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
        "notes": "Lekcja 8"
    },
    {
        "id": "tue_1",
        "day": "tuesday",
        "subject": "Pracownia urządzeń techniki komput. / Pracownia systemów oper.",
        "time_start": "08:00",
        "time_end": "08:45",
        "room": "Sala 1.16 / Sala 1.15",
        "teacher": "PW / SR",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Gr 1: Pracownia urządzeń (PW, 1.16) | Gr 2: Pracownia systemów (SR, 1.15)"
    },
    {
        "id": "tue_2",
        "day": "tuesday",
        "subject": "Pracownia urządzeń techniki komput. / Pracownia systemów oper.",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala 1.16 / Sala 1.15",
        "teacher": "PW / SR",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Gr 1: Pracownia urządzeń (PW, 1.16) | Gr 2: Pracownia systemów (SR, 1.15)"
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
        "subject": "Wychowanie fizyczne / Język angielski",
        "time_start": "10:40",
        "time_end": "11:25",
        "room": "Hala / Sala 18",
        "teacher": "Gł / ZJ",
        "type": "Ćwiczenia",
        "color": "cyan",
        "notes": "Gr 1: WF (Gł, Hala) | Gr 2: J. angielski (ZJ, s. 18)"
    },
    {
        "id": "tue_5",
        "day": "tuesday",
        "subject": "Wychowanie fizyczne / Pracownia urządzeń techniki komput.",
        "time_start": "11:30",
        "time_end": "12:15",
        "room": "Hala / Sala 16",
        "teacher": "Gł / BG",
        "type": "Ćwiczenia",
        "color": "cyan",
        "notes": "Gr 1: WF (Gł, Hala) | Gr 2: Pracownia urządzeń (BG, s. 16)"
    },
    {
        "id": "tue_6",
        "day": "tuesday",
        "subject": "Pracownia systemów oper. / Pracownia urządzeń techniki komput.",
        "time_start": "12:20",
        "time_end": "13:05",
        "room": "Sala 1.2 / Sala 16",
        "teacher": "SR / BG",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Gr 1: Pracownia systemów (SR, 1.2) | Gr 2: Pracownia urządzeń (BG, s. 16)"
    },
    {
        "id": "tue_7",
        "day": "tuesday",
        "subject": "Pracownia systemów oper. / Wychowanie fizyczne",
        "time_start": "13:15",
        "time_end": "14:00",
        "room": "Sala 1.2 / Hala",
        "teacher": "SR / LK",
        "type": "Laboratorium",
        "color": "indigo",
        "notes": "Gr 1: Pracownia systemów (SR, 1.2) | Gr 2: WF (LK, Hala)"
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
        "notes": "Lekcja 8"
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
        "notes": "Lekcja 4"
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
        "notes": "Lekcja 5"
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
        "notes": "Lekcja 6: Sprzęt i diagnostyka"
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
        "notes": "Lekcja 7: Warsztaty sprzętowe"
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
        "notes": "Lekcja 8"
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
        "notes": "Lekcja 9"
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
        "notes": "Lekcja 1"
    },
    {
        "id": "thu_2",
        "day": "thursday",
        "subject": "Język angielski / Wychowanie fizyczne",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala Z2 / Hala",
        "teacher": "ZJ / LK",
        "type": "Ćwiczenia",
        "color": "amber",
        "notes": "Gr 1: J. angielski (ZJ, Z2) | Gr 2: WF (LK, Hala)"
    },
    {
        "id": "thu_3",
        "day": "thursday",
        "subject": "Język angielski zawodowy / Wychowanie fizyczne",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Sala Z2 / Hala",
        "teacher": "ZJ / LK",
        "type": "Ćwiczenia",
        "color": "amber",
        "notes": "Gr 1: J. ang. zawodowy (ZJ, Z2) | Gr 2: WF (LK, Hala)"
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
        "notes": "Lekcja 4: Konfiguracja LAN"
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
        "notes": "Lekcja 5: Protokoły i routing"
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
        "notes": "Lekcja 6"
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
        "notes": "Lekcja 7"
    },
    {
        "id": "thu_8",
        "day": "thursday",
        "subject": "Język niemiecki (Grupy)",
        "time_start": "14:05",
        "time_end": "14:50",
        "room": "Sala Z1 / Sala 01",
        "teacher": "BC / GP",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Gr 1: BC (Z1) | Gr 2: GP (01)"
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
        "notes": "Lekcja 9"
    },
    {
        "id": "fri_1",
        "day": "friday",
        "subject": "Język angielski / Informatyka",
        "time_start": "08:00",
        "time_end": "08:45",
        "room": "Sala Z2 / Sala 1.15",
        "teacher": "ZJ / AP",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Gr 1: J. angielski (ZJ, Z2) | Gr 2: Informatyka (AP, 1.15)"
    },
    {
        "id": "fri_2",
        "day": "friday",
        "subject": "Język niemiecki / Informatyka",
        "time_start": "08:50",
        "time_end": "09:35",
        "room": "Sala Z1 / Sala 1.15",
        "teacher": "BC / AP",
        "type": "Lektorat",
        "color": "amber",
        "notes": "Gr 1: J. niemiecki (BC, Z1) | Gr 2: Informatyka (AP, 1.15)"
    },
    {
        "id": "fri_3",
        "day": "friday",
        "subject": "Wychowanie fizyczne / Język angielski",
        "time_start": "09:40",
        "time_end": "10:25",
        "room": "Hala / Sala 14",
        "teacher": "Gł / ZJ",
        "type": "Ćwiczenia",
        "color": "cyan",
        "notes": "Gr 1: WF (Gł, Hala) | Gr 2: J. angielski (ZJ, s. 14)"
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
        "notes": "Lekcja 4: Architektura sieciowa"
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
        "notes": "Lekcja 5"
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
        "notes": "Lekcja 6"
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
        "notes": "Lekcja 7"
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
        "notes": "Lekcja 8"
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
