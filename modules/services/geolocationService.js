/**
 * Geolocation Service - Precyzyjna Geolokalizacja GPS i Odwrócone Geokodowanie
 * Pozwala asystentowi AI i systemowi OmniDash na precyzyjne określenie
 * pozycji operatora (współrzędne GPS, dokładność w metrach, miasto, ulica, powiat).
 */

const STORAGE_KEY = 'system_user_location';
const DEFAULT_FALLBACK_LOCATION = {
  latitude: 53.9643,
  longitude: 18.5262,
  accuracy: 15,
  city: 'Starogard Gdański',
  street: 'Centrum',
  county: 'starogardzki',
  region: 'pomorskie',
  country: 'Polska',
  displayName: 'Starogard Gdański, woj. pomorskie',
  isFallback: true,
  timestamp: new Date().toISOString()
};

/**
 * Oblicza odległość w kilometrach pomiędzy dwoma punktami geograficznymi (Formuła Haversine).
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined ||
      lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) {
    return 0;
  }

  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return 0;

  const R = 6371; // Promień Ziemi w km
  const dLat = (p2 - p1) * (Math.PI / 180);
  const dLon = (l2 - l1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1 * (Math.PI / 180)) * Math.cos(p2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Odwrócone geokodowanie (Reverse Geocoding): konwertuje lat/lon na adres.
 * Wykorzystuje OpenStreetMap Nominatim z bezpiecznym fallbackiem.
 */
export async function reverseGeocode(lat, lon, googleApiKey = null) {
  // Jeśli podano klucz Google Maps API, spróbuj Google Geocoding API
  if (googleApiKey && typeof googleApiKey === 'string' && googleApiKey.trim().length > 10) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=pl&key=${googleApiKey.trim()}`;
      const res = await fetch(gUrl, { timeout: 6000 });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          const comps = first.address_components || [];
          const getComp = (type) => comps.find(c => c.types.includes(type))?.long_name || '';

          const city = getComp('locality') || getComp('postal_town') || getComp('administrative_area_level_2');
          const street = getComp('route');
          const streetNumber = getComp('street_number');
          const county = getComp('administrative_area_level_2');
          const region = getComp('administrative_area_level_1');

          return {
            displayName: first.formatted_address || `${city}, Polska`,
            city: city || 'Polska',
            street: street ? (streetNumber ? `${street} ${streetNumber}` : street) : '',
            county: county || '',
            region: region || '',
            country: getComp('country') || 'Polska'
          };
        }
      }
    } catch (gErr) {
      console.warn('[GeolocationService] Google Reverse Geocoding ostrzeżenie:', gErr.message);
    }
  }

  // Otwarty endpoint OpenStreetMap Nominatim (darmowy, brak wymogu klucza)
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=pl`;
    const res = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'OmniDash-Assistant/2.24 (https://omnidash-509607.web.app)'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || 'Starogard Gdański';
      const street = addr.road || addr.street || '';
      const houseNumber = addr.house_number || '';
      const county = addr.county || '';
      const region = addr.state || '';

      return {
        displayName: data.display_name || `${city}, ${region}, Polska`,
        city,
        street: street ? (houseNumber ? `${street} ${houseNumber}` : street) : '',
        county,
        region,
        country: addr.country || 'Polska'
      };
    }
  } catch (osmErr) {
    console.warn('[GeolocationService] OSM Nominatim ostrzeżenie:', osmErr.message);
  }

  return {
    displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    city: 'Polska',
    street: '',
    county: '',
    region: '',
    country: 'Polska'
  };
}

/**
 * Pobiera zapisaną lokalizację z localStorage lub zwraca domyślną.
 */
export function getSavedLocation() {
  if (typeof localStorage === 'undefined') return DEFAULT_FALLBACK_LOCATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.latitude && parsed.longitude) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_FALLBACK_LOCATION;
}

/**
 * Zapisuje lokalizację w localStorage oraz rozgłasza zdarzenie systemowe.
 */
export function saveLocation(loc) {
  if (typeof localStorage === 'undefined') return;
  try {
    const payload = {
      ...loc,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLocationChanged', { detail: payload }));
    }
  } catch (err) {
    console.warn('[GeolocationService] Błąd zapisu lokalizacji:', err.message);
  }
}

/**
 * Odpytuje przeglądarkowe API geolokalizacji z flagą enableHighAccuracy.
 */
export async function acquireHighAccuracyLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 30000,
    googleApiKey = (typeof localStorage !== 'undefined' && localStorage.getItem('system_google_maps_api_key')) || null
  } = options;

  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    console.warn('[GeolocationService] Geolocation API niedostępne w tym środowisku.');
    return getSavedLocation();
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const altitude = pos.coords.altitude || null;
        const speed = pos.coords.speed || null;

        console.log(`[+] SUCCESS :: GEOLOCATION :: Pozyskano współrzędne: ${lat.toFixed(5)}, ${lon.toFixed(5)} (±${accuracy}m).`);

        // Pobierz adres w języku polskim
        const addr = await reverseGeocode(lat, lon, googleApiKey);

        const locationData = {
          latitude: lat,
          longitude: lon,
          accuracy,
          altitude,
          speed,
          city: addr.city,
          street: addr.street,
          county: addr.county,
          region: addr.region,
          country: addr.country,
          displayName: addr.displayName,
          isHighAccuracy: enableHighAccuracy,
          isFallback: false,
          timestamp: new Date().toISOString()
        };

        saveLocation(locationData);
        resolve(locationData);
      },
      (err) => {
        console.warn(`[!] ALERT :: GEOLOCATION :: Błąd pobierania pozycji (${err.code}): ${err.message}. Używam pamięci podręcznej.`);
        const fallback = getSavedLocation();
        resolve(fallback);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  });
}

export default {
  calculateDistanceKm,
  reverseGeocode,
  getSavedLocation,
  saveLocation,
  acquireHighAccuracyLocation,
  DEFAULT_FALLBACK_LOCATION
};
