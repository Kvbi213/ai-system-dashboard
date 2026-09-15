function cleanSubjectName(s) {
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

function formatPushText(text) {
  if (!text) return '';
  let clean = String(text)
    .replace(/\\+r\\+n/gi, '\n')
    .replace(/\\+n/gi, '\n')
    .replace(/\\+r/gi, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n');

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

    if (/^\|[-:\s|]+\|$/.test(line)) continue;

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
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

    const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*(.*)$/);
    if (timeMatch) {
      const [, start, end, rest] = timeMatch;

      let teacher = '';
      const parenMatch = rest.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const inside = parenMatch[1];
        const tMatch = inside.match(/(?<![a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])([A-ZĄĆĘŁŃÓŚŹŻ]{2})(?![a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/);
        if (tMatch && tMatch[1] !== 'WF' && tMatch[1] !== 'SO' && tMatch[1] !== 'TK') {
          teacher = tMatch[1];
        }
      }

      let room = '';
      const roomMatch = rest.match(/\b(sala\s+[0-9a-zA-Z.]+|hala|basen|siłownia)\b/i);
      if (roomMatch) room = roomMatch[1];

      let subject = cleanSubjectName(rest)
        .replace(/\([^)]*\)/g, '')
        .replace(/\b(sala\s+[0-9a-zA-Z.]+|hala|basen|siłownia)\b/gi, '')
        .replace(/\b(laboratorium|wykład|ćwiczenia|inne|zajęcia)\b/gi, '')
        .replace(/[-:,•]+/g, ' ')
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

    if (/^[-*+•]\s+/.test(line)) {
      formatted.push('• ' + line.replace(/^[-*+•]\s+/, '').trim());
      continue;
    }

    formatted.push(line);
  }

  return formatted.join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.PUSHBULLET_API_KEY || req.body?.customApiKey;

  if (req.method === 'GET') {
    const isConfigured = Boolean(apiKey && apiKey !== 'your_pushbullet_api_key' && apiKey !== 'twój_klucz_pushbullet_tutaj');
    return res.status(200).json({
      service: 'pushbullet',
      configured: isConfigured,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const { title, body } = req.body || {};
    if (!body) {
      return res.status(400).json({ error: 'Treść wiadomości (body) jest wymagana.' });
    }

    if (!apiKey || apiKey === 'your_pushbullet_api_key' || apiKey === 'twój_klucz_pushbullet_tutaj') {
      return res.status(400).json({ error: 'Brak klucza PUSHBULLET_API_KEY w konfiguracji Vercel.' });
    }

    try {
      const formattedBody = formatPushText(body);
      const response = await fetch('https://api.pushbullet.com/v2/pushes', {
        method: 'POST',
        headers: {
          'Access-Token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'note',
          title: title || 'OmniDash System',
          body: formattedBody
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.status(200).json({
          success: true,
          iden: data.iden,
          message: 'Pomyślnie wysłano powiadomienie Push na smartfon.'
        });
      } else {
        return res.status(response.status).json({
          success: false,
          error: data.error?.message || 'Błąd dostarczenia Pushbullet API.'
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Wewnętrzny błąd serwera podczas wysyłki do Pushbullet.',
        details: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
