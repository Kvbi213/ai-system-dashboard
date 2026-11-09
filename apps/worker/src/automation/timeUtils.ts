/**
 * Narzędzia czasu autorytatywnego dla strefy czasowej Europe/Warsaw.
 * Gwarantuje deterministyczny odczyt czasu polskiego niezależnie od lokalnej
 * konfiguracji serwera, kontenera Docker czy maszyny wirtualnej (UTC/GMT/innej).
 */

export interface WarsawTime {
  hours: number;
  minutes: number;
  day: number; // 0 = Niedziela, 1 = Poniedziałek, ..., 6 = Sobota
  year: number;
  month: number;
  date: number;
  dateKey: string; // YYYY-MM-DD
  formattedTime: string; // HH:MM
}

export function getWarsawTime(date = new Date()): WarsawTime {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  });

  const parts = formatter.formatToParts(date);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let dayOfMonth = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let weekdayStr = '';

  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10);
    if (p.type === 'month') month = parseInt(p.value, 10);
    if (p.type === 'day') dayOfMonth = parseInt(p.value, 10);
    if (p.type === 'hour') hours = parseInt(p.value, 10);
    if (p.type === 'minute') minutes = parseInt(p.value, 10);
    if (p.type === 'weekday') weekdayStr = p.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  const day = weekdayMap[weekdayStr] ?? date.getDay();
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    hours,
    minutes,
    day,
    year,
    month,
    date: dayOfMonth,
    dateKey,
    formattedTime
  };
}
