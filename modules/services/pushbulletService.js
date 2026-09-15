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
          message: '⚠️ Pushbullet: Brak klucza API. Skonfiguruj klucz w Ustawienia -> Zabezpieczenia.'
        }
      }));
    }

    return { success: false, error: errorMsg };
  }

  const payloadTitle = (title || 'OmniDash Powiadomienie').trim();
  const payloadBody = (body || '').trim();

  if (!payloadBody) {
    const errorMsg = 'Pusta treść powiadomienia (body jest wymagane).';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toastTriggered', {
        detail: { type: 'error', message: '⚠️ Pushbullet: Pusta treść powiadomienia.' }
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
            message: `📱 Wysłano powiadomienie na Twój telefon: ${payloadTitle}`
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
          message: `❌ Błąd Pushbullet (${response.status}): ${errorDetail}`
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
          message: `❌ Błąd sieci Pushbullet: ${netErr.message}`
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
        title: 'OmniDash: Test Połączenia 📲',
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
