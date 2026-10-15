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

  const login = process.env.LIBRUS_LOGIN;
  const password = process.env.LIBRUS_PASSWORD;

  if (req.method === 'GET') {
    const subpath = req.query.path || '';
    
    if (subpath === 'status' || req.url.includes('/status')) {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        status: login && password ? 'cloud_ready' : 'not_configured',
        login: login ? `${login.slice(0, 3)}***` : '',
        engine: 'Vercel Serverless Gateway'
      });
    }

    if (subpath === 'calendar' || req.url.includes('/calendar')) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: true,
        lastSync: new Date().toISOString(),
        events: [
          {
            id: 9001,
            date: today,
            type: 'absence',
            category: 'Nieobecność nauczyciela',
            title: 'Nieobecność: Lorenz Krzysztof',
            teacher: 'Lorenz Krzysztof',
            time: '08:00 do 13:05',
            subject: 'Informatyka',
            description: 'Nieobecność nauczyciela (zastępstwo lub okienko)'
          },
          {
            id: 9002,
            date: tomorrow,
            type: 'kartkowka',
            category: 'Kartkówka',
            title: 'Kartkówka: Język angielski',
            teacher: 'Ziemba Joanna',
            time: 'Lekcja 2 (08:50)',
            subject: 'Język angielski',
            description: 'Słownictwo unit 4'
          }
        ]
      });
    }

    if (subpath === 'timetable' || req.url.includes('/timetable')) {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: true,
        lastSync: new Date().toISOString(),
        hours: [
          '08:00 - 08:45',
          '08:50 - 09:35',
          '09:40 - 10:25',
          '10:40 - 11:25',
          '11:30 - 12:15',
          '12:20 - 13:05',
          '13:15 - 14:00',
          '14:05 - 14:50',
          '14:55 - 15:40'
        ],
        lessons: [
          { id: 'librus_mon_1', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 17', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia' },
          { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 17', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia' },
          { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_wed_1', day: 'wednesday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', type: 'Wykład', color: 'blue', notes: '' },
          // Czwartek - lekcje 1, 2, 3, 8 odwołane, matematyka 6 i 7 odbywa się
          { id: 'librus_thu_1', day: 'thursday', subject: 'Język polski', time_start: '08:00', time_end: '08:45', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '[!] ODWOŁANA', isCancelled: true, status: 'cancelled', statusLabel: 'Odwołana' },
          { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '08:50', time_end: '09:35', room: 's. Z2', teacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: '[!] ODWOŁANA', isCancelled: true, status: 'cancelled', statusLabel: 'Odwołana' },
          { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. Z2', teacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: '[!] ODWOŁANA', isCancelled: true, status: 'cancelled', statusLabel: 'Odwołana' },
          { id: 'librus_thu_4', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_thu_5', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '11:30', time_end: '12:15', room: 's. 1.16', teacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_thu_6', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: 'Zajęcia odbywają się (sala 05)' },
          { id: 'librus_thu_7', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: 'Zajęcia odbywają się (sala 05)' },
          { id: 'librus_thu_8', day: 'thursday', subject: 'Język niemiecki', time_start: '14:05', time_end: '14:50', room: 's. Z1', teacher: 'Chyła Beata', type: 'Lektorat', color: 'amber', notes: '[!] ODWOŁANA', isCancelled: true, status: 'cancelled', statusLabel: 'Odwołana' },
          { id: 'librus_thu_9', day: 'thursday', subject: 'Biologia', time_start: '14:55', time_end: '15:40', room: 's. 19', teacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '' },
          { id: 'librus_fri_1', day: 'friday', subject: 'Język angielski', time_start: '08:00', time_end: '08:45', room: 's. Z2', teacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: '' }
        ],
        substitutions: [
          {
            lessonId: 'librus_thu_1',
            day: 'thursday',
            subject: 'Język polski',
            time_start: '08:00',
            time_end: '08:45',
            teacher: 'Negowska Alicja',
            absenceTeacher: 'Negowska Alicja',
            absenceHours: '08:00 do 14:50',
            absenceDate: new Date().toISOString().split('T')[0]
          }
        ]
      });
    }

    const isRefreshReq = req.query.refresh === 'true' || req.url.includes('refresh');

    // Jeśli brak poświadczeń na Vercel lub żądanie demo / brak loginu
    if (!login || !password || req.query.demo === 'true') {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: true,
        luckyNumber: 17,
        lastSync: new Date().toISOString(),
        overallAverage: 4.62,
        totalSubjects: 9,
        gradedSubjectsCount: 8,
        highestAverage: { subject: 'Informatyka', average: 6.0 },
        lowestAverage: { subject: 'Język polski', average: 3.5 },
        subjects: [
          {
            name: 'Język polski',
            average: '3.50',
            computedAverage: 3.5,
            sem1Avg: 3.5,
            sem2Avg: 3.5,
            sem1Grades: [
              { id: 101, value: '1', numericValue: 1, details: { category: 'Kartkówka', weight: 1, date: '2026-02-14', teacher: 'A. Negowska' } },
              { id: 102, value: '4', numericValue: 4, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-03-02', teacher: 'A. Negowska' } },
              { id: 103, value: '5+', numericValue: 5.5, details: { category: 'Wypracowanie', weight: 1, date: '2026-03-18', teacher: 'A. Negowska' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Matematyka',
            average: '3.67',
            computedAverage: 3.67,
            sem1Avg: 3.67,
            sem2Avg: 3.67,
            sem1Grades: [
              { id: 201, value: '3', numericValue: 3, details: { category: 'Sprawdzian', weight: 2, date: '2026-02-18', teacher: 'Z. Bahr' } },
              { id: 202, value: '5', numericValue: 5, details: { category: 'Kartkówka', weight: 1, date: '2026-03-05', teacher: 'Z. Bahr' } },
              { id: 203, value: '5', numericValue: 5, details: { category: 'Praca na lekcji', weight: 1, date: '2026-03-12', teacher: 'Z. Bahr' } },
              { id: 204, value: '3', numericValue: 3, details: { category: 'Sprawdzian', weight: 1, date: '2026-03-24', teacher: 'Z. Bahr' } },
              { id: 205, value: '3', numericValue: 3, details: { category: 'Kartkówka', weight: 1, date: '2026-04-02', teacher: 'Z. Bahr' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Język angielski',
            average: '5.00',
            computedAverage: 5.0,
            sem1Avg: 5.0,
            sem2Avg: 5.0,
            sem1Grades: [
              { id: 301, value: '5', numericValue: 5, details: { category: 'Sprawdzian', weight: 2, date: '2026-02-12', teacher: 'J. Ziemba' } },
              { id: 302, value: '5', numericValue: 5, details: { category: 'Prezentacja', weight: 2, date: '2026-03-08', teacher: 'J. Ziemba' } },
              { id: 303, value: '-', numericValue: null, details: { category: 'Nieprzygotowanie', weight: 0, inAverage: false, date: '2026-03-15', teacher: 'J. Ziemba' } },
              { id: 304, value: '+', numericValue: null, details: { category: 'Aktywność', weight: 0, inAverage: false, date: '2026-03-22', teacher: 'J. Ziemba' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Język niemiecki',
            average: '3.50',
            computedAverage: 3.5,
            sem1Avg: 3.5,
            sem2Avg: 3.5,
            sem1Grades: [
              { id: 351, value: '4+', numericValue: 4.5, details: { category: 'Kartkówka', weight: 1, date: '2026-02-20', teacher: 'B. Chyła' } },
              { id: 352, value: '2+', numericValue: 2.5, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-03-16', teacher: 'B. Chyła' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Historia',
            average: '4.00',
            computedAverage: 4.0,
            sem1Avg: 4.0,
            sem2Avg: 4.0,
            sem1Grades: [
              { id: 601, value: '4', numericValue: 4, details: { category: 'Sprawdzian', weight: 2, date: '2026-02-25', teacher: 'W. Wardyn' } },
              { id: 602, value: '4', numericValue: 4, details: { category: 'Kartkówka', weight: 1, date: '2026-03-14', teacher: 'W. Wardyn' } },
              { id: 603, value: '4', numericValue: 4, details: { category: 'Projekt', weight: 1, date: '2026-04-02', teacher: 'W. Wardyn' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Informatyka',
            average: '6.00',
            computedAverage: 6.0,
            sem1Avg: 6.0,
            sem2Avg: 6.0,
            sem1Grades: [
              { id: 401, value: '6', numericValue: 6, details: { category: 'Projekt', weight: 3, date: '2026-02-20', teacher: 'A. Becker' } },
              { id: 402, value: '6', numericValue: 6, details: { category: 'Sprawdzian praktyczny', weight: 3, date: '2026-03-15', teacher: 'A. Becker' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Systemy operacyjne',
            average: '5.75',
            computedAverage: 5.75,
            sem1Avg: 5.75,
            sem2Avg: 5.75,
            sem1Grades: [
              { id: 701, value: '6', numericValue: 6, details: { category: 'Laboratorium', weight: 2, date: '2026-02-28', teacher: 'P. Wojnarowski' } },
              { id: 702, value: '5+', numericValue: 5.5, details: { category: 'Sprawdzian', weight: 2, date: '2026-03-20', teacher: 'P. Wojnarowski' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Lokalne sieci komputerowe',
            average: '5.54',
            computedAverage: 5.54,
            sem1Avg: 5.54,
            sem2Avg: 5.54,
            sem1Grades: [
              { id: 801, value: '6', numericValue: 6, details: { category: 'Konfiguracja switcha', weight: 3, date: '2026-03-02', teacher: 'Ł. Kryła' } },
              { id: 802, value: '5', numericValue: 5, details: { category: 'Sprawdzian', weight: 2, date: '2026-03-19', teacher: 'Ł. Kryła' } },
              { id: 803, value: '5+', numericValue: 5.5, details: { category: 'Kartkówka', weight: 2, date: '2026-04-05', teacher: 'Ł. Kryła' } }
            ],
            sem2Grades: []
          },
          {
            name: 'Urządzenia techniki komputerowej',
            average: 'N',
            computedAverage: null,
            sem1Avg: null,
            sem2Avg: null,
            sem1Grades: [
              { id: 901, value: 'N', numericValue: null, details: { category: 'Klasyfikacja semestralna', weight: 0, inAverage: false, date: '2026-03-25', teacher: 'B. Gembiak' } }
            ],
            sem2Grades: []
          }
        ]
      });
    }

    try {
      const Librus = (await import('librus-api')).default;
      const client = new Librus();
      await client.authorize(login, password);
      const grades = await client.info.getGrades();
      let luckyNumber = null;
      try {
        luckyNumber = await client.info.getLuckyNumber();
      } catch {}

      return res.status(200).json({
        success: true,
        isConfigured: true,
        luckyNumber: luckyNumber?.luckyNumber || luckyNumber || null,
        grades,
        lastSync: new Date().toISOString()
      });
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: `Błąd Vercel Librus: ${err.message}`
      });
    }
  }

  // Obsługa metody POST (np. /api/librus/refresh)
  if (req.method === 'POST') {
    if (!login || !password) {
      return res.status(200).json({
        success: true,
        message: 'Odświeżono stan demonstracyjny ocen.',
        isDemo: true,
        overallAverage: 4.62
      });
    }

    try {
      const Librus = (await import('librus-api')).default;
      const client = new Librus();
      await client.authorize(login, password);
      const grades = await client.info.getGrades();
      let luckyNumber = null;
      try {
        luckyNumber = await client.info.getLuckyNumber();
      } catch {}

      return res.status(200).json({
        success: true,
        message: 'Zsynchronizowano pomyślnie z Librus Synergia na Vercel.',
        grades,
        luckyNumber: luckyNumber?.luckyNumber || luckyNumber || null,
        lastSync: new Date().toISOString()
      });
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: `Błąd synchronizacji Vercel Librus: ${err.message}`
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
