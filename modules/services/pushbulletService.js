/**
 * Moduł bezpośredniej integracji z Pushbullet API (Direct Client-Side Integration)
 * Wspiera autoryzację tokenem Access-Token, natywny CORS, pełną obsługę błędów sieciowych i autoryzacyjnych,
 * toasty systemowe oraz natychmiastowe testowanie łączności ze smartfonem.
 */

export function getPushbulletApiKey() {
  let stored = null;
  try {
    if (typeof localStorage !== 'undefined') {
      stored = localStorage.getItem('system_pushbullet_api_key');
    }
  } catch {}
  if (stored && stored.trim() !== '') return stored.trim();
  
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUSHBULLET_API_KEY) || 
                 (typeof process !== 'undefined' && process.env?.PUSHBULLET_API_KEY) || '';
  if (envKey && envKey !== 'twój_klucz_pushbullet_tutaj' && envKey !== 'your_pushbullet_api_key') {
    return envKey.trim();
  }
  return '';
}

export function setPushbulletApiKey(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (key) {
        localStorage.setItem('system_pushbullet_api_key', key.trim());
      } else {
        localStorage.removeItem('system_pushbullet_api_key');
      }
    }
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pushbulletKeyChanged', { detail: key }));
  }
}

/**
 * Słownik skracania i standaryzacji nazw przedmiotów dla czytelności na smartfonach
 */
export function cleanSubjectName(s) {
  if (!s) return '';
  return s
    .replace(/pracownia urządzeń techniki komputerowej/gi, 'Pracownia UTK')
    .replace(/pracownia systemów operacyjnych/gi, 'Pracownia SO')
    .replace(/wychowanie fizyczne/gi, 'WF')
    .replace(/zajęcia z wychowawcą/gi, 'Godz. wychowawcza')
    .replace(/godzina wychowawcza/gi, 'Godz. wychowawcza')
    .replace(/urządzenia techniki komputerowej/gi, 'Urządzenia TK')
    .replace(/systemy operacyjne/gi, 'Systemy operacyjne')
    .replace(/edukacja dla bezpieczeństwa/gi, 'EDB')
    .replace(/wiedza o społeczeństwie/gi, 'WOS')
    .trim();
}

/**
 * Formatuje i czyści tekst powiadomienia Push na smartfon:
 * - Bezwzględnie usuwa literalne sekwencje "\n", "\\n", "\r\n" na rzeczywisty znak nowej linii (0x0A)
 * - Czyści znaczniki Markdown (**pogrubienie**, _kursywa_, nagłówki #)
 * - Standaryzuje harmonogram lekcji: • Godzina [Sala] Przedmiot (Nauczyciel)
 * - Konwertuje surowe wiersze tabel Markdown na estetyczne punkty listy
 */
export function formatPushText(text) {
  if (!text) return '';
  let clean = String(text)
    .replace(/\\+r\\+n/gi, '\n')
    .replace(/\\+n/gi, '\n')
    .replace(/\\+r/gi, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n');

  // Usuń formatowanie Markdown nieobsługiwane w powiadomieniach mobilnych
  clean = clean
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '');

  const rawLines = clean.split('\n');
  const formatted = [];

  for (const rawLine of rawLines) {
    const line = rawLine.replace(/^(\\n|\\r|[-•\s])+/gi, '').trim();
    if (!line) continue;

    // Pomiń linie separatorów tabel Markdown (|---|---|)
    if (/^\|[-:\s|]+\|$/.test(line)) continue;

    // Przekształć wiersze tabeli Markdown (| a | b | c |) w estetyczne linie
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      // Pomiń nagłówek tabeli
      if (cells.some(c => /^(godzina|przedmiot|dzień|termin|data|czas)$/i.test(c))) {
        continue;
      }
      if (cells.length >= 2) {
        const time = cells[0];
        const subject = cleanSubjectName(cells[1]);
        let room = cells[2] || '';
        if (room && !room.toLowerCase().startsWith('sala') && room.toLowerCase() !== 'hala') {
          room = `Sala ${room}`;
        }
        const roomPart = room ? ` [${room}]` : '';
        const teacher = cells[3] ? ` (${cells[3]})` : '';
        formatted.push(`• ${time}${roomPart} ${subject}${teacher}`);
        continue;
      }
    }

    // Formatuj zakresy godzin (np. 08:00-08:45 Przedmiot (Sala, Nauczyciel))
    const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*(.*)$/);
    if (timeMatch) {
      const [, start, end, rest] = timeMatch;

      // Wyodrębnij nauczyciela z nawiasów (np. PW w '(Sala 1.16, PW, Laboratorium)')
      let teacher = '';
      const parenMatch = rest.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const inside = parenMatch[1];
        const tMatch = inside.match(/(?<![a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])([A-ZĄĆĘŁŃÓŚŹŻ]{2})(?![a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/);
        if (tMatch && tMatch[1] !== 'WF' && tMatch[1] !== 'SO' && tMatch[1] !== 'TK') {
          teacher = tMatch[1];
        }
      }

      // Wyodrębnij salę (zarówno z [Sala ...] jak i surowego tekstu)
      let room = '';
      const bracketMatch = rest.match(/\[([^\]]+)\]/);
      if (bracketMatch) {
        room = bracketMatch[1];
      } else {
        const roomMatch = rest.match(/\b(sala\s+[0-9a-zA-Z.]+|hala|basen|siłownia)\b/i);
        if (roomMatch) room = roomMatch[1];
      }

      // Oczyść przedmiot ze zbędnych metadanych (typy zajęć, sala, nawiasy okrągłe i kwadratowe)
      let subject = cleanSubjectName(rest)
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\b(sala\s+[0-9a-zA-Z.]+|hala|basen|siłownia)\b/gi, '')
        .replace(/\b(laboratorium|wykład|ćwiczenia|inne|zajęcia)\b/gi, '')
        .replace(/[\[\]\-:,•]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      subject = cleanSubjectName(subject);

      if (room && !room.toLowerCase().startsWith('sala') && room.toLowerCase() !== 'hala') {
        room = `Sala ${room}`;
      }

      const roomPart = room ? ` [${room}]` : '';
      const teacherPart = teacher ? ` (${teacher})` : '';
      formatted.push(`• ${start} - ${end}${roomPart} ${subject}${teacherPart}`);
      continue;
    }

    // Standardowe elementy listy (- lub *)
    if (/^[-*+•]\s+/.test(line)) {
      formatted.push('• ' + line.replace(/^[-*+•]\s+/, '').trim());
      continue;
    }

    formatted.push(line);
  }

  return formatted.join('\n');
}

/**
 * Wysyła powiadomienie Push bezpośrednio na konto Pushbullet użytkownika
 */
export async function sendPushNotificationClient(title, body) {
  const apiKey = getPushbulletApiKey();

  if (!apiKey || apiKey === 'twój_klucz_pushbullet_tutaj' || apiKey === 'your_pushbullet_api_key') {
    const errorMsg = 'Brak skonfigurowanego klucza PUSHBULLET_API_KEY w ustawieniach systemu.';
    console.warn('[!] PUSHBULLET:', errorMsg);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toastTriggered', {
        detail: {
          type: 'error',
          message: '[!] Pushbullet: Brak klucza API. Skonfiguruj klucz w Ustawienia -> Zabezpieczenia.'
        }
      }));
    }

    return { success: false, error: errorMsg };
  }

  const payloadTitle = (title || 'OmniDash Powiadomienie').trim();
  const formattedBody = formatPushText(body);
  const payloadBody = formattedBody.trim();

  if (!payloadBody) {
    const errorMsg = 'Pusta treść powiadomienia (body jest wymagane).';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toastTriggered', {
        detail: { type: 'error', message: '[!] Pushbullet: Pusta treść powiadomienia.' }
      }));
    }
    return { success: false, error: errorMsg };
  }

  try {
    const response = await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'note',
        title: payloadTitle,
        body: payloadBody
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[+] PUSHBULLET: Wysłano powiadomienie na smartfon, iden:', data.iden);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('toastTriggered', {
          detail: {
            type: 'info',
            message: ` Wysłano powiadomienie na Twój telefon: ${payloadTitle}`
          }
        }));
      }

      return { success: true, iden: data.iden, data };
    }

    // Obsługa kodów błędów HTTP z Pushbullet API
    let errorDetail = `Błąd HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        errorDetail = errData.error.message;
      }
    } catch {}

    console.error('[!] PUSHBULLET API ERROR:', response.status, errorDetail);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toastTriggered', {
        detail: {
          type: 'error',
          message: `[X] Błąd Pushbullet (${response.status}): ${errorDetail}`
        }
      }));
    }

    return { success: false, status: response.status, error: errorDetail };

  } catch (netErr) {
    console.error('[!] PUSHBULLET NETWORK ERROR:', netErr.message);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toastTriggered', {
        detail: {
          type: 'error',
          message: `[X] Błąd sieci Pushbullet: ${netErr.message}`
        }
      }));
    }

    return { success: false, error: netErr.message };
  }
}

/**
 * Weryfikuje poprawność klucza i wysyła testowe powiadomienie
 */
export async function testPushbulletConnection(customApiKey) {
  const apiKey = customApiKey ? customApiKey.trim() : getPushbulletApiKey();

  if (!apiKey) {
    return { success: false, error: 'Brak klucza API do przetestowania.' };
  }

  try {
    // 1. Sprawdź profil użytkownika w Pushbullet
    const userRes = await fetch('https://api.pushbullet.com/v2/users/me', {
      headers: { 'Access-Token': apiKey }
    });

    if (!userRes.ok) {
      let msg = `Nieprawidłowy klucz API (Status ${userRes.status})`;
      try {
        const d = await userRes.json();
        if (d.error?.message) msg = d.error.message;
      } catch {}
      return { success: false, error: msg };
    }

    const userData = await userRes.json();

    // 2. Wyślij testowe powiadomienie Push
    const pushRes = await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'note',
        title: 'OmniDash: Test Połączenia ',
        body: `Połączenie z telefonem działa poprawnie!\nZalogowano: ${userData.name || userData.email}\nCzas: ${new Date().toLocaleTimeString('pl-PL')}`
      })
    });

    if (!pushRes.ok) {
      let msg = `Nie udało się wysłać powiadomienia testowego (Status ${pushRes.status})`;
      try {
        const d = await pushRes.json();
        if (d.error?.message) msg = d.error.message;
      } catch {}
      return { success: false, error: msg };
    }

    const pushData = await pushRes.json();
    return {
      success: true,
      iden: pushData.iden,
      userName: userData.name,
      userEmail: userData.email
    };
  } catch (err) {
    return { success: false, error: `Błąd sieciowy: ${err.message}` };
  }
}
