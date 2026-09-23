import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseClient.js";
import axios from 'axios';

export const CLOUD_COLLECTIONS = {
  TASKS: 'tasks',
  FINANCES: 'finances',
  WORKOUTS: 'workouts',
  CALENDAR: 'calendar',
  OPERATOR_BRAIN: 'operator_brain',
  CHAT_HISTORY: 'chat_history',
  TIMETABLE: 'timetable',
  NOTES: 'notes',
  LIBRUS_CACHE: 'librus_cache'
};

export const isCloudEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('web.app') || 
         host.includes('firebaseapp.com') || 
         host.includes('vercel.app') || 
         (host !== 'localhost' && host !== '127.0.0.1');
};

export const INITIAL_FIRESTORE_DATA = {
  tasks: [
    { id: '1', title: 'Wdrożenie Cloud Hosting (OmniDash)', priority: 'HIGH', status: 'completed', category: 'system' },
    { id: '2', title: 'Autoryzacja profilu administratora', priority: 'HIGH', status: 'completed', category: 'system' },
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
    { id: 'b1', category: 'Identity', fact: 'Operator: Administrator Systemu — pełne uprawnienia nadrzędne (Root Owner).', created_at: new Date().toISOString() },
    { id: 'b2', category: 'Engine & Model', fact: 'Podstawowy model kognitywny: openai/gpt-oss-120b zasilany przez Vercel Serverless Gateway.', created_at: new Date().toISOString() },
    { id: 'b3', category: 'Architecture', fact: 'Ekosystem rozproszony: Firebase Hosting + Firestore Realtime Database + Vercel Serverless API.', created_at: new Date().toISOString() },
    { id: 'b4', category: 'Preferences', fact: 'Formatowanie odpowiedzi: wyczerpujące, merytoryczne, wieloaspektowe z drzewiastymi strukturami Markdown.', created_at: new Date().toISOString() },
    { id: 'b5', category: 'Wiedza', fact: 'Sale lekcyjne zaczynające się od „Z” oraz „SZ” oraz sale z numerem po kropce (np. 1.2, 1.16) znajdują się w innym budynku niż sale bez takiego oznaczenia (np. sala 34, 17).', created_at: new Date().toISOString() }
  ],
  chat_history: [
    { id: 'm1', role: 'ai', content: 'SYSTEM ONLINE. Silnik openai/gpt-oss-120b połączony przez Vercel Serverless Gateway. Baza Firestore zsynchronizowana.', timestamp: new Date().toISOString() }
  ],
  timetable: [
    // Poniedziałek
    { id: 'librus_mon_1', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 17', teacher: 'Becker Adam', cleanTeacher: 'Becker Adam', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia informatyczna', isLibrus: true },
    { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 17', teacher: 'Becker Adam', cleanTeacher: 'Becker Adam', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia informatyczna', isLibrus: true },
    { id: 'librus_mon_3', day: 'monday', subject: 'Chemia', time_start: '10:40', time_end: '11:25', room: 's. 31', teacher: 'Kolasińska Paulina', cleanTeacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
    { id: 'librus_mon_4', day: 'monday', subject: 'Edukacja zdrowotna', time_start: '11:30', time_end: '12:15', room: 's. 38', teacher: 'Spych Monika', cleanTeacher: 'Spych Monika', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
    { id: 'librus_mon_5', day: 'monday', subject: 'Systemy operacyjne', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Teoria i architektura systemów', isLibrus: true },
    { id: 'librus_mon_6', day: 'monday', subject: 'Systemy operacyjne', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Warsztaty praktyczne', isLibrus: true },

    // Wtorek
    { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 1.16', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Wykład', color: 'amber', notes: 'Godzina wychowawcza', isLibrus: true },
    { id: 'librus_tue_4', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '10:40', time_end: '11:25', room: 's. WF', teacher: 'Łysakowski Grzegorz', cleanTeacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_tue_5', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '11:30', time_end: '12:15', room: 's. WF', teacher: 'Łysakowski Grzegorz', cleanTeacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_tue_6', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Reszka Sławomir', cleanTeacher: 'Reszka Sławomir', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_tue_7', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Reszka Sławomir', cleanTeacher: 'Reszka Sławomir', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_tue_8', day: 'tuesday', subject: 'Matematyka', time_start: '14:05', time_end: '14:50', room: 's. 26', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },
    { id: 'librus_tue_9', day: 'tuesday', subject: 'Religia', time_start: '14:55', time_end: '15:40', room: 's. 24', teacher: 'Gizela Maciej', cleanTeacher: 'Gizela Maciej', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },

    // Środa
    { id: 'librus_wed_1', day: 'wednesday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', cleanTeacher: 'Sokół Paweł', type: 'Wykład', color: 'blue', notes: '', isLibrus: true },
    { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Łukaszczyk-Wulgaris Joanna', cleanTeacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
    { id: 'librus_wed_3', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Gembiak Bartosz', cleanTeacher: 'Gembiak Bartosz', type: 'Laboratorium', color: 'cyan', notes: 'Sprzęt i diagnostyka', isLibrus: true },
    { id: 'librus_wed_4', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Gembiak Bartosz', cleanTeacher: 'Gembiak Bartosz', type: 'Laboratorium', color: 'cyan', notes: 'Warsztaty sprzętowe', isLibrus: true },
    { id: 'librus_wed_5', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 06', teacher: 'Wardyn Wojciech', cleanTeacher: 'Wardyn Wojciech', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
    { id: 'librus_wed_6', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 26', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },

    // Czwartek
    { id: 'librus_thu_1', day: 'thursday', subject: 'Język polski', time_start: '08:00', time_end: '08:45', room: 's. 34', teacher: 'Negowska Alicja', cleanTeacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
    { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '08:50', time_end: '09:35', room: 's. Z2', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. Z2', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_thu_4', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Kryła Łukasz', cleanTeacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: 'Konfiguracja LAN', isLibrus: true },
    { id: 'librus_thu_5', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '11:30', time_end: '12:15', room: 's. 1.16', teacher: 'Kryła Łukasz', cleanTeacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: 'Protokoły i routing', isLibrus: true },
    { id: 'librus_thu_6', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },
    { id: 'librus_thu_7', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },
    { id: 'librus_thu_8', day: 'thursday', subject: 'Język niemiecki', time_start: '14:05', time_end: '14:50', room: 's. Z1', teacher: 'Chyła Beata', cleanTeacher: 'Chyła Beata', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_thu_9', day: 'thursday', subject: 'Biologia', time_start: '14:55', time_end: '15:40', room: 's. 19', teacher: 'Łukaszczyk-Wulgaris Joanna', cleanTeacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },

    // Piątek
    { id: 'librus_fri_1', day: 'friday', subject: 'Język angielski', time_start: '08:00', time_end: '08:45', room: 's. Z2', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_fri_2', day: 'friday', subject: 'Język niemiecki', time_start: '08:50', time_end: '09:35', room: 's. Z1', teacher: 'Chyła Beata', cleanTeacher: 'Chyła Beata', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_fri_3', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '09:40', time_end: '10:25', room: 's. WF', teacher: 'Łysakowski Grzegorz', cleanTeacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: 'Grupa 1', isLibrus: true },
    { id: 'librus_fri_4', day: 'friday', subject: 'Lokalne sieci komputerowe', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Wykład', color: 'cyan', notes: 'Architektura sieciowa', isLibrus: true },
    { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', cleanTeacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
    { id: 'librus_fri_6', day: 'friday', subject: 'Edukacja obywatelska', time_start: '12:20', time_end: '13:05', room: 's. 09', teacher: 'Czarna Alicja', cleanTeacher: 'Czarna Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
    { id: 'librus_fri_7', day: 'friday', subject: 'Język polski', time_start: '13:15', time_end: '14:00', room: 's. 34', teacher: 'Negowska Alicja', cleanTeacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
    { id: 'librus_fri_8', day: 'friday', subject: 'Język polski', time_start: '14:05', time_end: '14:50', room: 's. 34', teacher: 'Negowska Alicja', cleanTeacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true }
  ]
};

const emitCloudDataChanged = (detail) => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail }));
    }, 0);
  }
};

export const subscribeCollection = (collectionName, onData, fallbackData = []) => {
  // Najpierw natychmiast załaduj dane z cache localStorage dla zerowego czasu oczekiwania
  const cacheKey = `cloud_cache_${collectionName}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        onData(parsed);
      }
    } else if (fallbackData.length > 0) {
      onData(fallbackData);
    } else if (INITIAL_FIRESTORE_DATA[collectionName] && INITIAL_FIRESTORE_DATA[collectionName].length > 0) {
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

        // W ARCHITEKTURZE CLOUD-FIRST: Chmura Firestore jest bezwzględnym źródłem prawdy!
        if (items.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(items));
          onData(items);
          emitCloudDataChanged({ collection: collectionName, count: items.length });
        } else {
          // Kolekcja w chmurze jest pusta (np. po czyszczeniu przez użytkownika lub świeża instalacja)
          const isFreshEmptyCol = !localStorage.getItem(`cloud_initialized_${collectionName}`);
          const defaultItems = INITIAL_FIRESTORE_DATA[collectionName];

          // Auto-inicjalizujemy starterami TYLKO jeśli kolekcja ma domyślne dane starterowe (np. tasks, timetable)
          // i nigdy wcześniej nie była inicjalizowana. Dla finances i workouts, które celowo są puste, nic nie seedujemy!
          if (isFreshEmptyCol && Array.isArray(defaultItems) && defaultItems.length > 0) {
            localStorage.setItem(`cloud_initialized_${collectionName}`, 'true');
            localStorage.setItem(cacheKey, JSON.stringify(defaultItems));
            onData(defaultItems);
            defaultItems.forEach(async (item) => {
              try {
                const itemId = String(item.id || Date.now() + Math.random());
                await setDoc(doc(firestore, collectionName, itemId), item, { merge: true });
              } catch (syncErr) {
                console.warn(`[CloudSync] Inicjalizacja ${collectionName}/${item.id}:`, syncErr.message);
              }
            });
            emitCloudDataChanged({ collection: collectionName, count: defaultItems.length });
          } else {
            // Jeśli baza w chmurze jest pusta (np. po celowym wyczyszczeniu), zapisujemy pustą tablicę do cache i UI!
            localStorage.setItem(`cloud_initialized_${collectionName}`, 'true');
            localStorage.setItem(cacheKey, JSON.stringify([]));
            onData([]);
            emitCloudDataChanged({ collection: collectionName, count: 0 });
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
    emitCloudDataChanged({ collection: collectionName, action: 'save', item: itemToSave });
  } catch (e) {
    console.warn(`[CloudSync] Błąd optymistycznego zapisu:`, e);
  }

  // 2. Propagacja do Cloud Firestore (Cloud-First)
  if (firestore) {
    try {
      const sanitizedItem = JSON.parse(JSON.stringify(itemToSave));
      await setDoc(doc(firestore, collectionName, idStr), sanitizedItem, { merge: true });
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
      emitCloudDataChanged({ collection: collectionName, action: 'delete', id: idStr });
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
      emitCloudDataChanged({ collection: collectionName, action: 'update', id: idStr });
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
 * Trwale usuwa historię konwersacji z bazy Cloud Firestore oraz lokalnej pamięci podręcznej (cache).
 * @param {'worker' | 'mentor' | 'all'} targetMode Tryb chatu do wyczyszczenia
 */
export const clearChatHistoryCloud = async (targetMode = 'worker') => {
  const cacheKey = `cloud_cache_${CLOUD_COLLECTIONS.CHAT_HISTORY}`;

  // 1. Natychmiastowe czyszczenie pamięci lokalnej (Optymistyczne UI)
  try {
    const cached = localStorage.getItem(cacheKey);
    let items = cached ? JSON.parse(cached) : [];
    if (Array.isArray(items)) {
      const remaining = targetMode === 'all'
        ? []
        : items.filter(m => (m.chatMode || 'worker') !== targetMode);
      localStorage.setItem(cacheKey, JSON.stringify(remaining));
      emitCloudDataChanged({
        collection: CLOUD_COLLECTIONS.CHAT_HISTORY, action: 'clear_mode', mode: targetMode
      });
    }
  } catch (e) {
    console.warn('[CloudSync] Błąd czyszczenia cache czatu:', e);
  }

  // 2. Usunięcie dokumentów z bazy Cloud Firestore
  if (firestore && typeof collection === 'function') {
    try {
      const colRef = collection(firestore, CLOUD_COLLECTIONS.CHAT_HISTORY);
      const snap = await getDocs(colRef);
      const deletePromises = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const msgMode = data.chatMode || 'worker';
        if (targetMode === 'all' || msgMode === targetMode) {
          deletePromises.push(deleteDoc(doc(firestore, CLOUD_COLLECTIONS.CHAT_HISTORY, docSnap.id)));
        }
      });
      await Promise.allSettled(deletePromises);
    } catch (e) {
      console.warn('[CloudSync] Błąd usuwania historii czatu z Firestore:', e);
    }
  }
};

/**
 * Trwale czyści całą kolekcję z bazy Cloud Firestore oraz lokalnej pamięci podręcznej (cache).
 * @param {string} collectionName Nazwa kolekcji (np. 'tasks', 'finances')
 */
export const clearCloudCollection = async (collectionName) => {
  const cacheKey = `cloud_cache_${collectionName}`;
  const initKey = `cloud_initialized_${collectionName}`;

  // 1. Natychmiastowe czyszczenie pamięci lokalnej (Optymistyczne UI)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify([]));
      localStorage.setItem(initKey, 'true');
    }
    emitCloudDataChanged({ collection: collectionName, action: 'clear', count: 0 });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: collectionName } }));
    }
  } catch (e) {
    console.warn(`[CloudSync] Błąd czyszczenia pamięci lokalnej (${collectionName}):`, e);
  }

  // 2. Usunięcie wszystkich dokumentów z Cloud Firestore
  if (firestore && typeof collection === 'function') {
    try {
      const colRef = collection(firestore, collectionName);
      const snap = await getDocs(colRef);
      const deletePromises = [];
      snap.forEach(docSnap => {
        deletePromises.push(deleteDoc(doc(firestore, collectionName, docSnap.id)));
      });
      await Promise.allSettled(deletePromises);
    } catch (e) {
      console.warn(`[CloudSync] Błąd czyszczenia kolekcji w chmurze Firestore (${collectionName}):`, e);
    }
  }

  // 3. Opcjonalnie: wywołanie lokalnego endpointu Express (Desktop)
  if (typeof window !== 'undefined' && collectionName === 'tasks' && !isCloudEnvironment()) {
    try {
      await axios.delete('/api/tasks/all');
    } catch {}
  }
};

/**
 * Oznacza wszystkie zadania w kolekcji 'tasks' jako wykonane (completed).
 */
export const completeAllCloudTasks = async () => {
  const cacheKey = 'cloud_cache_tasks';
  let items = [];

  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      items = cached ? JSON.parse(cached) : [];
      if (Array.isArray(items)) {
        const now = new Date().toISOString();
        items = items.map(t => ({ ...t, status: 'completed', completed_at: now, updated_at: now }));
        localStorage.setItem(cacheKey, JSON.stringify(items));
        emitCloudDataChanged({ collection: 'tasks', action: 'update_all' });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
        }
      }
    }
  } catch (e) {
    console.warn('[CloudSync] Błąd optymistycznego oznaczania wszystkich zadań:', e);
  }

  if (firestore && typeof collection === 'function') {
    try {
      const colRef = collection(firestore, 'tasks');
      const snap = await getDocs(colRef);
      const updatePromises = [];
      const now = new Date().toISOString();
      snap.forEach(docSnap => {
        updatePromises.push(updateDoc(doc(firestore, 'tasks', docSnap.id), {
          status: 'completed',
          completed_at: now,
          updated_at: now
        }));
      });
      await Promise.allSettled(updatePromises);
    } catch (e) {
      console.warn('[CloudSync] Błąd aktualizacji wszystkich zadań w Firestore:', e);
    }
  }

  return items;
};

/**
 * Przywraca zadanie ze statusu 'completed' na 'pending' (odznaczenie wykonania).
 */
export const uncompleteCloudTask = async (docIdOrTitle) => {
  const cacheKey = 'cloud_cache_tasks';
  const queryStr = String(docIdOrTitle || '').toLowerCase().trim();
  let updatedTask = null;

  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      let items = cached ? JSON.parse(cached) : [];
      if (Array.isArray(items)) {
        const found = items.find(t => 
          String(t.id).toLowerCase() === queryStr || 
          (t.title && t.title.toLowerCase().includes(queryStr))
        );
        if (found) {
          found.status = 'pending';
          found.updated_at = new Date().toISOString();
          delete found.completed_at;
          updatedTask = found;
          localStorage.setItem(cacheKey, JSON.stringify(items));
          emitCloudDataChanged({ collection: 'tasks', action: 'update', id: found.id });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
          }
        }
      }
    }
  } catch (e) {
    console.warn('[CloudSync] Błąd odznaczania zadania:', e);
  }

  if (updatedTask && firestore) {
    try {
      await updateDoc(doc(firestore, 'tasks', String(updatedTask.id)), {
        status: 'pending',
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn(`[CloudSync] Błąd aktualizacji zadania ${updatedTask.id} w Firestore:`, e);
    }
  }

  return updatedTask;
};

/**
 * Usuwa wyłącznie zadania o statusie 'completed'.
 */
export const deleteCompletedCloudTasks = async () => {
  const cacheKey = 'cloud_cache_tasks';
  let removedIds = [];

  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      let items = cached ? JSON.parse(cached) : [];
      if (Array.isArray(items)) {
        const remaining = items.filter(t => {
          if (t.status === 'completed') {
            removedIds.push(String(t.id));
            return false;
          }
          return true;
        });
        localStorage.setItem(cacheKey, JSON.stringify(remaining));
        emitCloudDataChanged({ collection: 'tasks', action: 'delete_completed', count: removedIds.length });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
        }
      }
    }
  } catch (e) {
    console.warn('[CloudSync] Błąd optymistycznego usuwania ukończonych zadań:', e);
  }

  if (firestore && typeof collection === 'function') {
    try {
      const colRef = collection(firestore, 'tasks');
      const snap = await getDocs(colRef);
      const deletePromises = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'completed' || removedIds.includes(docSnap.id)) {
          deletePromises.push(deleteDoc(doc(firestore, 'tasks', docSnap.id)));
        }
      });
      await Promise.allSettled(deletePromises);
    } catch (e) {
      console.warn('[CloudSync] Błąd usuwania ukończonych zadań z Firestore:', e);
    }
  }

  return removedIds;
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
