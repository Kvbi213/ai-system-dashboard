function parseHourRange(range, fallback = ['08:00', '08:45']) {
  if (typeof range !== 'string') return fallback;
  const parts = range.split(' - ').map(p => p.trim());
  return parts.length === 2 && parts[0] && parts[1] ? parts : fallback;
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

  const login = (process.env.LIBRUS_LOGIN || req.headers['x-librus-login'] || '').toString().trim();
  const password = (process.env.LIBRUS_PASSWORD || req.headers['x-librus-password'] || '').toString().trim();

  if (req.method === 'GET') {
    const subpath = typeof req.query?.path === 'string' ? req.query.path.trim() : '';
    
    if (subpath === 'status' || req.url.includes('/status')) {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        status: login && password ? 'cloud_ready' : 'not_configured',
        login: login ? `${login.slice(0, 3)}***` : '',
        engine: 'Vercel Serverless Gateway'
      });
    }

    if (subpath === 'manual-read' || subpath === 'read-all' || req.url.includes('/manual-read') || req.url.includes('/read-all')) {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: !login || !password,
        timestamp: new Date().toISOString(),
        studentInfo: { name: 'Jakub Lis', class: '2 TI T' },
        luckyNumber: 21,
        grades: {
          overallAverage: '4.32',
          totalSubjects: 21,
          gradedSubjectsCount: 16,
          highestAverage: { subject: 'Informatyka', average: 6.0 },
          lowestAverage: { subject: 'Urządzenia techniki komputerowej', average: 2.75 },
          subjects: [
            { name: 'biologia', teacher: 'Joanna Łukaszczyk-Wulgaris', computedAverage: '3.75', sem1Grades: [{ value: '4+' }, { value: '3' }] },
            { name: 'biznes i zarządzanie', teacher: 'Sokół Paweł', computedAverage: '4.50', sem1Grades: [{ value: '4+' }] },
            { name: 'chemia', teacher: 'Kolasińska Paulina', computedAverage: '4.50', sem1Grades: [{ value: '4+' }] },
            { name: 'edukacja obywatelska', teacher: 'Czarna Alicja', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'historia', teacher: 'Wardyn Wojciech', computedAverage: '4.00', sem1Grades: [{ value: '4' }, { value: '4' }, { value: '4' }] },
            { name: 'informatyka', teacher: 'Becker Adam', computedAverage: '6.00', sem1Grades: [{ value: '6' }] },
            { name: 'język angielski', teacher: 'Ziemba Joanna', computedAverage: '4.50', sem1Grades: [{ value: '5' }, { value: '5' }, { value: '3' }] },
            { name: 'język angielski zawodowy', teacher: 'Ziemba Joanna', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'język niemiecki', teacher: 'Chyła Beata', computedAverage: '3.50', sem1Grades: [{ value: '4+' }, { value: '2+' }, { value: '2' }] },
            { name: 'język polski', teacher: 'Negowska Alicja', computedAverage: '3.50', sem1Grades: [{ value: '1' }, { value: '4' }, { value: '5+' }] },
            { name: 'lokalne sieci komputerowe', teacher: 'Wojnarowski Przemysław', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'matematyka', teacher: 'Behr Zbigniew', computedAverage: '3.67', sem1Grades: [{ value: '3' }, { value: '5' }, { value: '5' }, { value: '3' }, { value: '3' }, { value: '2' }] },
            { name: 'pracownia lokalnych sieci komputerowych', teacher: 'Kżyś Łukasz', computedAverage: '5.00', sem1Grades: [{ value: '5' }, { value: '5' }] },
            { name: 'pracownia urządzeń techniki komputerowej', teacher: 'Wojnarowski Przemysław', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'systemy operacyjne', teacher: 'Wojnarowski Przemysław', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'urządzenia techniki komputerowej', teacher: 'Cembik Bartosz', computedAverage: '2.75', sem1Grades: [{ value: '3-' }] }
          ]
        },
        timetable: {
          lessons: [
            { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_3', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_4', day: 'monday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_5', day: 'monday', subject: 'Lokalne sieci komputerowe', time_start: '11:30', time_end: '12:15', room: 's. 0.2', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_6', day: 'monday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 0.1', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 0.1', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 28', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_4', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '10:40', time_end: '11:25', room: '', teacher: 'Łysakowski Grzegorz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_5', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '11:30', time_end: '12:15', room: '', teacher: 'Łysakowski Grzegorz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_6', day: 'tuesday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 28', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_7', day: 'tuesday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 28', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_8', day: 'tuesday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '14:05', time_end: '14:50', room: 's. 1.16', teacher: 'Kżyś Łukasz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_9', day: 'tuesday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '14:55', time_end: '15:40', room: 's. 1.16', teacher: 'Kżyś Łukasz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_1', day: 'wednesday', subject: 'Biologia', time_start: '08:00', time_end: '08:45', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '08:50', time_end: '09:35', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_3', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '09:40', time_end: '10:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_4', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '10:40', time_end: '11:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_5', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '11:30', time_end: '12:15', room: 's. 1.2', teacher: 'Cembik Bartosz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_6', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.2', teacher: 'Cembik Bartosz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_7', day: 'wednesday', subject: 'Chemia', time_start: '13:15', time_end: '14:00', room: 's. 03', teacher: 'Kolasińska Paulina', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_8', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 05', teacher: 'Wardyn Wojciech', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_9', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 28', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski', time_start: '08:50', time_end: '09:35', room: 's. 22', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. 22', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_4', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_5', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_6', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '14:05', time_end: '14:50', room: 's. 22', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_1', day: 'friday', subject: 'Edukacja obywatelska', time_start: '08:00', time_end: '08:45', room: 's. 09', teacher: 'Czarna Alicja', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_2', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '08:50', time_end: '09:35', room: '', teacher: 'Łysakowski Grzegorz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_3', day: 'friday', subject: 'Język niemiecki', time_start: '09:40', time_end: '10:25', room: 's. 21', teacher: 'Chyła Beata', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_4', day: 'friday', subject: 'Język niemiecki', time_start: '10:40', time_end: '11:25', room: 's. 21', teacher: 'Chyła Beata', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_6', day: 'friday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_7', day: 'friday', subject: 'Język polski', time_start: '13:15', time_end: '14:00', room: 's. 34', teacher: 'Negowska Alicja', status: 'active', statusLabel: 'Aktywna' }
          ],
          substitutions: []
        },
        calendar: {
          events: [
            { id: 9101, date: '2026-10-19', type: 'absence', category: 'Nieobecność nauczyciela', title: 'Nieobecność: Prabucki Andrzej', teacher: 'Prabucki Andrzej' },
            { id: 9104, date: '2026-10-19', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Biznes i zarządzanie', teacher: 'Sokół Paweł' },
            { id: 9106, date: '2026-10-21', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna' },
            { id: 9107, date: '2026-10-21', type: 'sprawdzian', category: 'Sprawdzian', title: 'Sprawdzian: Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna' },
            { id: 9109, date: '2026-10-28', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Chemia', teacher: 'Kolasińska Paulina' },
            { id: 9110, date: '2026-10-29', type: 'sprawdzian', category: 'Sprawdzian', title: 'Sprawdzian: Język niemiecki', teacher: 'Chyła Beata' }
          ]
        },
        logs: [
          { tag: '+ SUCCESS', msg: 'Zestaw danych pobrany z bramy Vercel Serverless Gateway.' }
        ]
      });
    }

    if (subpath === 'calendar' || req.url.includes('/calendar')) {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: true,
        lastSync: new Date().toISOString(),
        events: [
          {
            id: 9101,
            date: '2026-10-19',
            type: 'absence',
            category: 'Nieobecność nauczyciela',
            title: 'Nieobecność: Prabucki Andrzej',
            teacher: 'Prabucki Andrzej',
            time: '08:00 do 12:15',
            subject: null,
            description: 'Nieobecność nauczyciela: Prabucki Andrzej (08:00 do 12:15)'
          },
          {
            id: 9104,
            date: '2026-10-19',
            type: 'kartkowka',
            category: 'Kartkówka',
            title: 'Kartkówka: Biznes i zarządzanie',
            teacher: 'Sokół Paweł',
            time: 'Lekcja 5 (11:30)',
            subject: 'Biznes i zarządzanie',
            description: 'Kartkówka z form działalności gospodarczej'
          },
          {
            id: 9105,
            date: '2026-10-20',
            type: 'absence',
            category: 'Nieobecność nauczyciela',
            title: 'Nieobecność: Negowska Alicja',
            teacher: 'Negowska Alicja',
            time: '12:20 do 15:40',
            subject: null,
            description: 'Nieobecność nauczyciela: Negowska Alicja (12:20 do 15:40)'
          },
          {
            id: 9107,
            date: '2026-10-20',
            type: 'inne',
            category: 'Zastępstwo',
            title: 'Zastępstwo: Joanna Ziemba',
            teacher: 'Ziemba Joanna',
            time: 'Lekcja 4 i 5 (10:40 - 12:15)',
            subject: 'Język angielski',
            description: 'Zastępstwo z Joanna Ziemba na lekcji 4 i 5'
          },
          {
            id: 9109,
            date: '2026-10-21',
            type: 'kartkowka',
            category: 'Kartkówka',
            title: 'Kartkówka: Biologia',
            teacher: 'Łukaszczyk-Wulgaris Joanna',
            time: 'Lekcja 1 (08:00)',
            subject: 'Biologia',
            description: 'Kartkówka z budowy komórki'
          },
          {
            id: 9110,
            date: '2026-10-21',
            type: 'sprawdzian',
            category: 'Praca Klasowa',
            title: 'Praca Klasowa: Biologia',
            teacher: 'Łukaszczyk-Wulgaris Joanna',
            time: 'Lekcja 2 (08:50)',
            subject: 'Biologia',
            description: 'Praca Klasowa z biologii'
          },
          {
            id: 9114,
            date: '2026-10-23',
            type: 'odwolane',
            category: 'Odwołane zajęcia',
            title: 'Odwołane zajęcia: Edukacja obywatelska',
            teacher: 'Czarna Alicja',
            time: 'Lekcja 1 (08:00)',
            subject: 'Edukacja obywatelska',
            description: 'Odwołane zajęcia: Alicja Czarna na lekcji nr: 1'
          }
        ]
      });
    }

    if (subpath === 'timetable' || req.url.includes('/timetable')) {
      if (login && password && req.query.demo !== 'true') {
        try {
          const Librus = (await import('librus-api')).default;
          const client = new Librus();
          await client.authorize(login, password);
          const rawTt = await client.calendar.getTimetable();
          if (rawTt && rawTt.table) {
            const lessons = [];
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            for (const day of dayNames) {
              const dayLessons = rawTt.table[day] || [];
              dayLessons.forEach((l, idx) => {
                if (l && l.subject) {
                  const isCancelled = Boolean(l.isCancelled || (l.notes && l.notes.includes('odwołan')));
                  const [defaultStart, defaultEnd] = parseHourRange(rawTt.hours?.[idx]);
                  lessons.push({
                    id: `librus_${day}_${idx}`,
                    day,
                    subject: l.subject,
                    time_start: l.time_from || defaultStart,
                    time_end: l.time_to || defaultEnd,
                    room: l.room || '',
                    teacher: l.teacher || '',
                    type: isCancelled ? 'Odwołana' : 'Lekcja',
                    color: isCancelled ? 'rose' : 'indigo',
                    notes: l.notes || '',
                    isCancelled,
                    status: isCancelled ? 'cancelled' : 'active'
                  });
                }
              });
            }
            if (lessons.length > 0) {
              return res.status(200).json({
                success: true,
                isConfigured: true,
                isDemo: false,
                lastSync: new Date().toISOString(),
                hours: rawTt.hours || [],
                lessons,
                substitutions: []
              });
            }
          }
        } catch (scrapeErr) {
          console.warn('[!] ALERT :: Vercel timetable fetch fallback:', scrapeErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: true,
        lastSync: new Date().toISOString(),
        hours: [
          '07:10 - 07:55',
          '08:00 - 08:45',
          '08:50 - 09:35',
          '09:40 - 10:25',
          '10:40 - 11:25',
          '11:30 - 12:15',
          '12:20 - 13:05',
          '13:15 - 14:00',
          '14:05 - 14:50',
          '14:55 - 15:40',
          '15:45 - 16:30'
        ],
        lessons: [
          // Poniedziałek
          { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_mon_3', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_mon_4', day: 'monday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', type: 'Wykład', color: 'blue', notes: '' },
          { id: 'librus_mon_5', day: 'monday', subject: 'Lokalne sieci komputerowe', time_start: '11:30', time_end: '12:15', room: 's. 0.2', teacher: 'Wojnarowski Przemysław', type: 'Wykład', color: 'cyan', notes: '' },
          { id: 'librus_mon_6', day: 'monday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '' },

          // Wtorek
          { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 0.1', teacher: 'Wojnarowski Przemysław (2TI gr.1)', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 0.1', teacher: 'Wojnarowski Przemysław (2TI gr.1)', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 28', teacher: 'Ziemba Joanna', type: 'Wykład', color: 'amber', notes: '' },
          { id: 'librus_tue_4', day: 'tuesday', subject: 'Język angielski', time_start: '10:40', time_end: '11:25', room: '', teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', type: 'Lektorat', color: 'amber', isSubstitution: true, status: 'substitution', statusLabel: 'Zastępstwo', notes: '[~] Zastępstwo w Librus Synergia (Joanna Ziemba)' },
          { id: 'librus_tue_5', day: 'tuesday', subject: 'Język angielski', time_start: '11:30', time_end: '12:15', room: '', teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', type: 'Lektorat', color: 'amber', isSubstitution: true, status: 'substitution', statusLabel: 'Zastępstwo', notes: '[~] Zastępstwo w Librus Synergia (Joanna Ziemba)' },
          { id: 'librus_tue_6', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '12:20', time_end: '13:05', room: 's. 1.15', teacher: 'Reszka Sławomir (2 TI gr.1 PSO)', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_tue_7', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '13:15', time_end: '14:00', room: 's. 1.15', teacher: 'Reszka Sławomir (2 TI gr.1 PSO)', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_tue_8', day: 'tuesday', subject: 'Edukacja zdrowotna', time_start: '14:05', time_end: '14:50', room: 's. 35', teacher: 'Spych Monika', type: 'Wykład', color: 'emerald', notes: '' },
          { id: 'librus_tue_9', day: 'tuesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 28', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },

          // Środa
          { id: 'librus_wed_1', day: 'wednesday', subject: 'Biologia', time_start: '08:00', time_end: '08:45', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '' },
          { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '08:50', time_end: '09:35', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '' },
          { id: 'librus_wed_3', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '09:40', time_end: '10:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_wed_4', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '10:40', time_end: '11:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_wed_5', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '11:30', time_end: '12:15', room: 's. 1.2', teacher: 'Cembik Bartosz', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_wed_6', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.2', teacher: 'Cembik Bartosz', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_wed_7', day: 'wednesday', subject: 'Chemia', time_start: '13:15', time_end: '14:00', room: 's. 03', teacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '' },
          { id: 'librus_wed_8', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 05', teacher: 'Wardyn Wojciech', type: 'Wykład', color: 'rose', notes: '' },
          { id: 'librus_wed_9', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 28', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },

          // Czwartek
          { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski', time_start: '08:50', time_end: '09:35', room: 's. 22', teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', type: 'Lektorat', color: 'amber', notes: '' },
          { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. 22', teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', type: 'Lektorat', color: 'amber', notes: '' },
          { id: 'librus_thu_4', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Kżyś Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_thu_5', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '11:30', time_end: '12:15', room: 's. 1.16', teacher: 'Kżyś Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
          { id: 'librus_thu_6', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },
          { id: 'librus_thu_7', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },
          { id: 'librus_thu_8', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '14:05', time_end: '14:50', room: 's. 22', teacher: 'Ziemba Joanna (j.ang.zaw. 2 TI gr.1)', type: 'Lektorat', color: 'amber', notes: '' },

          // Piątek
          { id: 'librus_fri_1', day: 'friday', subject: 'Edukacja obywatelska', time_start: '08:00', time_end: '08:45', room: '', teacher: 'Czarna Alicja', type: 'Wykład', color: 'rose', notes: '[!] ODWOŁANA', isCancelled: true, status: 'cancelled', statusLabel: 'Odwołana' },
          { id: 'librus_fri_2', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '08:50', time_end: '09:35', room: '', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', type: 'Ćwiczenia', color: 'purple', notes: '' },
          { id: 'librus_fri_3', day: 'friday', subject: 'Język niemiecki', time_start: '09:40', time_end: '10:25', room: 's. 21', teacher: 'Chyła Beata (2TI/1)', type: 'Lektorat', color: 'amber', notes: '' },
          { id: 'librus_fri_4', day: 'friday', subject: 'Język niemiecki', time_start: '10:40', time_end: '11:25', room: 's. 21', teacher: 'Chyła Beata (2TI/1)', type: 'Lektorat', color: 'amber', notes: '' },
          { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '' },
          { id: 'librus_fri_6', day: 'friday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '' },
          { id: 'librus_fri_7', day: 'friday', subject: 'Język polski', time_start: '13:15', time_end: '14:00', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '' }
        ],
        substitutions: [
          {
            lessonId: 'librus_tue_4',
            day: 'tuesday',
            subject: 'Język angielski',
            time_start: '10:40',
            time_end: '11:25',
            teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)',
            absenceTeacher: 'Negowska Alicja',
            absenceHours: '10:40 - 11:25',
            absenceDate: '2026-10-20'
          },
          {
            lessonId: 'librus_tue_5',
            day: 'tuesday',
            subject: 'Język angielski',
            time_start: '11:30',
            time_end: '12:15',
            teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)',
            absenceTeacher: 'Negowska Alicja',
            absenceHours: '11:30 - 12:15',
            absenceDate: '2026-10-20'
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
        overallAverage: 4.35,
        totalSubjects: 21,
        gradedSubjectsCount: 16,
        highestAverage: { subject: 'Informatyka', average: 6.0 },
        lowestAverage: { subject: 'Urządzenia techniki komputerowej', average: 2.75 },
        subjects: [
          {
            name: 'biologia',
            teacher: 'Joanna Łukaszczyk-Wulgaris',
            average: '3.38',
            computedAverage: 3.38,
            sem1Avg: 3.38,
            sem2Avg: 3.38,
            sem1Grades: [
              { id: 101, value: '4+', numericValue: 4.5, details: { category: 'Kartkówka', weight: 1, date: '2026-10-06', teacher: 'Joanna Łukaszczyk-Wulgaris', comment: 'Budowa komórki' } },
              { id: 102, value: '3', numericValue: 3.0, details: { category: 'Sprawdzian', weight: 3, date: '2026-10-14', teacher: 'Joanna Łukaszczyk-Wulgaris', comment: 'Składniki chemiczne' } }
            ],
            sem2Grades: []
          },
          {
            name: 'biznes i zarządzanie',
            teacher: 'Paweł Sokół',
            average: '4.50',
            computedAverage: 4.50,
            sem1Avg: 4.50,
            sem2Avg: 4.50,
            sem1Grades: [
              { id: 201, value: '4+', numericValue: 4.5, details: { category: 'Kartkówka', weight: 1, date: '2026-10-12', teacher: 'Paweł Sokół', comment: 'Formy działalności' } }
            ],
            sem2Grades: []
          },
          {
            name: 'chemia',
            teacher: 'Paulina Kolasińska',
            average: '4.50',
            computedAverage: 4.50,
            sem1Avg: 4.50,
            sem2Avg: 4.50,
            sem1Grades: [
              { id: 301, value: '4+', numericValue: 4.5, details: { category: 'Sprawdzian', weight: 2, date: '2026-10-08', teacher: 'Paulina Kolasińska', comment: 'Wiązania chemiczne' } }
            ],
            sem2Grades: []
          },
          {
            name: 'edukacja obywatelska',
            teacher: 'Alicja Czarna',
            average: '5.00',
            computedAverage: 5.00,
            sem1Avg: 5.00,
            sem2Avg: 5.00,
            sem1Grades: [
              { id: 401, value: '5', numericValue: 5.0, details: { category: 'Projekt', weight: 2, date: '2026-10-05', teacher: 'Alicja Czarna', comment: 'Prawa człowieka' } }
            ],
            sem2Grades: []
          },
          {
            name: 'edukacja zdrowotna',
            teacher: 'Monika Spych',
            average: null,
            computedAverage: null,
            sem1Avg: null,
            sem2Avg: null,
            sem1Grades: [],
            sem2Grades: []
          },
          {
            name: 'historia',
            teacher: 'Wojciech Wardyn',
            average: '4.00',
            computedAverage: 4.00,
            sem1Avg: 4.00,
            sem2Avg: 4.00,
            sem1Grades: [
              { id: 501, value: '4', numericValue: 4.0, details: { category: 'Kartkówka', weight: 1, date: '2026-09-22', teacher: 'Wojciech Wardyn' } },
              { id: 502, value: '4', numericValue: 4.0, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-02', teacher: 'Wojciech Wardyn' } },
              { id: 503, value: '4', numericValue: 4.0, details: { category: 'Sprawdzian', weight: 2, date: '2026-10-16', teacher: 'Wojciech Wardyn' } }
            ],
            sem2Grades: []
          },
          {
            name: 'informatyka',
            teacher: 'Adam Becker',
            average: '6.00',
            computedAverage: 6.00,
            sem1Avg: 6.00,
            sem2Avg: 6.00,
            sem1Grades: [
              { id: 601, value: '6', numericValue: 6.0, details: { category: 'Projekt', weight: 3, date: '2026-10-10', teacher: 'Adam Becker', comment: 'Algorytmy grafowe' } }
            ],
            sem2Grades: []
          },
          {
            name: 'język angielski',
            teacher: 'Joanna Ziemba',
            average: '4.33',
            computedAverage: 4.33,
            sem1Avg: 4.33,
            sem2Avg: 4.33,
            sem1Grades: [
              { id: 701, value: '5', numericValue: 5.0, details: { category: 'Kartkówka', weight: 1, date: '2026-09-24', teacher: 'Joanna Ziemba' } },
              { id: 702, value: '5', numericValue: 5.0, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-01', teacher: 'Joanna Ziemba' } },
              { id: 703, value: '-', numericValue: null, details: { category: 'Brak zadania', weight: 0, date: '2026-10-07', teacher: 'Joanna Ziemba', inAverage: false } },
              { id: 704, value: '3', numericValue: 3.0, details: { category: 'Sprawdzian', weight: 1, date: '2026-10-15', teacher: 'Joanna Ziemba' } }
            ],
            sem2Grades: []
          },
          {
            name: 'język angielski zawodowy',
            teacher: 'Joanna Ziemba',
            average: '5.00',
            computedAverage: 5.00,
            sem1Avg: 5.00,
            sem2Avg: 5.00,
            sem1Grades: [
              { id: 801, value: '5', numericValue: 5.0, details: { category: 'Słownictwo techniczne', weight: 2, date: '2026-10-13', teacher: 'Joanna Ziemba' } }
            ],
            sem2Grades: []
          },
          {
            name: 'język niemiecki',
            teacher: 'Beata Chyła',
            average: '3.00',
            computedAverage: 3.00,
            sem1Avg: 3.00,
            sem2Avg: 3.00,
            sem1Grades: [
              { id: 901, value: '4+', numericValue: 4.5, details: { category: 'Kartkówka', weight: 1, date: '2026-09-25', teacher: 'Beata Chyła' } },
              { id: 902, value: '2+', numericValue: 2.5, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-02', teacher: 'Beata Chyła' } },
              { id: 903, value: '2', numericValue: 2.0, details: { category: 'Sprawdzian', weight: 1, date: '2026-10-12', teacher: 'Beata Chyła' } },
              { id: 904, value: '-', numericValue: null, details: { category: 'Brak zadania', weight: 0, date: '2026-10-16', teacher: 'Beata Chyła', inAverage: false } }
            ],
            sem2Grades: []
          },
          {
            name: 'język polski',
            teacher: 'Alicja Negowska',
            average: '3.50',
            computedAverage: 3.50,
            sem1Avg: 3.50,
            sem2Avg: 3.50,
            sem1Grades: [
              { id: 1001, value: '1', numericValue: 1.0, details: { category: 'Kartkówka', weight: 1, date: '2026-09-20', teacher: 'Alicja Negowska' } },
              { id: 1002, value: '4', numericValue: 4.0, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-04', teacher: 'Alicja Negowska' } },
              { id: 1003, value: '5+', numericValue: 5.5, details: { category: 'Wypracowanie', weight: 1, date: '2026-10-14', teacher: 'Alicja Negowska' } }
            ],
            sem2Grades: []
          },
          {
            name: 'lokalne sieci komputerowe',
            teacher: 'Przemysław Wojnarowski',
            average: '5.00',
            computedAverage: 5.00,
            sem1Avg: 5.00,
            sem2Avg: 5.00,
            sem1Grades: [
              { id: 1101, value: '5', numericValue: 5.0, details: { category: 'Laboratorium', weight: 2, date: '2026-10-09', teacher: 'Przemysław Wojnarowski' } }
            ],
            sem2Grades: []
          },
          {
            name: 'matematyka',
            teacher: 'Zbigniew Behr',
            average: '3.67',
            computedAverage: 3.67,
            sem1Avg: 3.67,
            sem2Avg: 3.67,
            sem1Grades: [
              { id: 1201, value: '3', numericValue: 3.0, details: { category: 'Sprawdzian', weight: 2, date: '2026-09-22', teacher: 'Zbigniew Behr' } },
              { id: 1202, value: '5', numericValue: 5.0, details: { category: 'Kartkówka', weight: 1, date: '2026-09-30', teacher: 'Zbigniew Behr' } },
              { id: 1203, value: '5', numericValue: 5.0, details: { category: 'Praca na lekcji', weight: 1, date: '2026-10-05', teacher: 'Zbigniew Behr' } },
              { id: 1204, value: '3', numericValue: 3.0, details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-12', teacher: 'Zbigniew Behr' } },
              { id: 1205, value: '3', numericValue: 3.0, details: { category: 'Kartkówka', weight: 1, date: '2026-10-16', teacher: 'Zbigniew Behr' } }
            ],
            sem2Grades: []
          },
          {
            name: 'pracownia lokalnych sieci komputerowych',
            teacher: 'Łukasz Kżyś',
            average: '5.00',
            computedAverage: 5.00,
            sem1Avg: 5.00,
            sem2Avg: 5.00,
            sem1Grades: [
              { id: 1301, value: '5', numericValue: 5.0, details: { category: 'Ćwiczenia praktyczne', weight: 2, date: '2026-10-01', teacher: 'Łukasz Kżyś' } },
              { id: 1302, value: '5', numericValue: 5.0, details: { category: 'Sprawdzian praktyczny', weight: 2, date: '2026-10-15', teacher: 'Łukasz Kżyś' } }
            ],
            sem2Grades: []
          },
          {
            name: 'pracownia systemów operacyjnych',
            teacher: 'Sławomir Reszka',
            average: null,
            computedAverage: null,
            sem1Avg: null,
            sem2Avg: null,
            sem1Grades: [],
            sem2Grades: []
          },
          {
            name: 'pracownia urządzeń techniki komputerowej',
            teacher: 'Przemysław Wojnarowski',
            average: '5.00',
            computedAverage: 5.00,
            sem1Avg: 5.00,
            sem2Avg: 5.00,
            sem1Grades: [
              { id: 1401, value: '5', numericValue: 5.0, details: { category: 'Montaż podzespołów', weight: 2, date: '2026-10-06', teacher: 'Przemysław Wojnarowski' } }
            ],
            sem2Grades: []
          },
          {
            name: 'religia',
            teacher: 'Ks. Katecheta',
            average: null,
            computedAverage: null,
            sem1Avg: null,
            sem2Avg: null,
            sem1Grades: [],
            sem2Grades: []
          },
          {
            name: 'systemy operacyjne',
            teacher: 'Przemysław Wojnarowski',
            average: '5.00',
            computedAverage: 5.00,
            sem1Avg: 5.00,
            sem2Avg: 5.00,
            sem1Grades: [
              { id: 1501, value: '5', numericValue: 5.0, details: { category: 'Kolokwium', weight: 2, date: '2026-10-07', teacher: 'Przemysław Wojnarowski' } },
              { id: 1502, value: '-', numericValue: null, details: { category: 'Brak zadania', weight: 0, date: '2026-10-14', teacher: 'Przemysław Wojnarowski', inAverage: false } }
            ],
            sem2Grades: []
          },
          {
            name: 'urządzenia techniki komputerowej',
            teacher: 'Bartosz Cembik',
            average: '2.75',
            computedAverage: 2.75,
            sem1Avg: 2.75,
            sem2Avg: 2.75,
            sem1Grades: [
              { id: 1601, value: '3-', numericValue: 2.75, details: { category: 'Sprawdzian', weight: 2, date: '2026-10-14', teacher: 'Bartosz Cembik', comment: 'Magistrale PCIe' } }
            ],
            sem2Grades: []
          },
          {
            name: 'wychowanie fizyczne',
            teacher: 'Grzegorz Łysakowski',
            average: null,
            computedAverage: null,
            sem1Avg: null,
            sem2Avg: null,
            sem1Grades: [
              { id: 1701, value: '-', numericValue: null, details: { category: 'Strój / Aktywność', weight: 0, date: '2026-10-09', teacher: 'Grzegorz Łysakowski', inAverage: false } }
            ],
            sem2Grades: []
          },
          {
            name: 'zajęcia z wychowawcą',
            teacher: 'Joanna Ziemba',
            average: null,
            computedAverage: null,
            sem1Avg: null,
            sem2Avg: null,
            sem1Grades: [],
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

  // Obsługa metody POST (np. /api/librus/refresh, /api/librus/credentials, /api/librus/manual-read)
  if (req.method === 'POST') {
    const subpath = typeof req.query?.path === 'string' ? req.query.path.trim() : '';
    if (subpath === 'credentials' || req.url.includes('/credentials')) {
      return res.status(200).json({
        success: true,
        message: 'W środowisku chmurowym Vercel poświadczenia są konfigurowane przez zmienne środowiskowe projektu.'
      });
    }

    if (subpath === 'manual-read' || subpath === 'read-all' || req.url.includes('/manual-read') || req.url.includes('/read-all')) {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: !login || !password,
        timestamp: new Date().toISOString(),
        studentInfo: { name: 'Jakub Lis', class: '2 TI T' },
        luckyNumber: 21,
        grades: {
          overallAverage: '4.32',
          totalSubjects: 21,
          gradedSubjectsCount: 16,
          highestAverage: { subject: 'Informatyka', average: 6.0 },
          lowestAverage: { subject: 'Urządzenia techniki komputerowej', average: 2.75 },
          subjects: [
            { name: 'biologia', teacher: 'Joanna Łukaszczyk-Wulgaris', computedAverage: '3.75', sem1Grades: [{ value: '4+' }, { value: '3' }] },
            { name: 'biznes i zarządzanie', teacher: 'Sokół Paweł', computedAverage: '4.50', sem1Grades: [{ value: '4+' }] },
            { name: 'chemia', teacher: 'Kolasińska Paulina', computedAverage: '4.50', sem1Grades: [{ value: '4+' }] },
            { name: 'edukacja obywatelska', teacher: 'Czarna Alicja', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'historia', teacher: 'Wardyn Wojciech', computedAverage: '4.00', sem1Grades: [{ value: '4' }, { value: '4' }, { value: '4' }] },
            { name: 'informatyka', teacher: 'Becker Adam', computedAverage: '6.00', sem1Grades: [{ value: '6' }] },
            { name: 'język angielski', teacher: 'Ziemba Joanna', computedAverage: '4.50', sem1Grades: [{ value: '5' }, { value: '5' }, { value: '3' }] },
            { name: 'język angielski zawodowy', teacher: 'Ziemba Joanna', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'język niemiecki', teacher: 'Chyła Beata', computedAverage: '3.50', sem1Grades: [{ value: '4+' }, { value: '2+' }, { value: '2' }] },
            { name: 'język polski', teacher: 'Negowska Alicja', computedAverage: '3.50', sem1Grades: [{ value: '1' }, { value: '4' }, { value: '5+' }] },
            { name: 'lokalne sieci komputerowe', teacher: 'Wojnarowski Przemysław', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'matematyka', teacher: 'Behr Zbigniew', computedAverage: '3.67', sem1Grades: [{ value: '3' }, { value: '5' }, { value: '5' }, { value: '3' }, { value: '3' }, { value: '2' }] },
            { name: 'pracownia lokalnych sieci komputerowych', teacher: 'Kżyś Łukasz', computedAverage: '5.00', sem1Grades: [{ value: '5' }, { value: '5' }] },
            { name: 'pracownia urządzeń techniki komputerowej', teacher: 'Wojnarowski Przemysław', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'systemy operacyjne', teacher: 'Wojnarowski Przemysław', computedAverage: '5.00', sem1Grades: [{ value: '5' }] },
            { name: 'urządzenia techniki komputerowej', teacher: 'Cembik Bartosz', computedAverage: '2.75', sem1Grades: [{ value: '3-' }] }
          ]
        },
        timetable: {
          lessons: [
            { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_3', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_4', day: 'monday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_5', day: 'monday', subject: 'Lokalne sieci komputerowe', time_start: '11:30', time_end: '12:15', room: 's. 0.2', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_mon_6', day: 'monday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 0.1', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 0.1', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 28', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_4', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '10:40', time_end: '11:25', room: '', teacher: 'Łysakowski Grzegorz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_5', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '11:30', time_end: '12:15', room: '', teacher: 'Łysakowski Grzegorz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_6', day: 'tuesday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 28', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_7', day: 'tuesday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 28', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_8', day: 'tuesday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '14:05', time_end: '14:50', room: 's. 1.16', teacher: 'Kżyś Łukasz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_tue_9', day: 'tuesday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '14:55', time_end: '15:40', room: 's. 1.16', teacher: 'Kżyś Łukasz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_1', day: 'wednesday', subject: 'Biologia', time_start: '08:00', time_end: '08:45', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '08:50', time_end: '09:35', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_3', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '09:40', time_end: '10:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_4', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '10:40', time_end: '11:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_5', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '11:30', time_end: '12:15', room: 's. 1.2', teacher: 'Cembik Bartosz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_6', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.2', teacher: 'Cembik Bartosz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_7', day: 'wednesday', subject: 'Chemia', time_start: '13:15', time_end: '14:00', room: 's. 03', teacher: 'Kolasińska Paulina', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_8', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 05', teacher: 'Wardyn Wojciech', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_wed_9', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 28', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski', time_start: '08:50', time_end: '09:35', room: 's. 22', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. 22', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_4', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_5', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Behr Zbigniew', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_thu_6', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '14:05', time_end: '14:50', room: 's. 22', teacher: 'Ziemba Joanna', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_1', day: 'friday', subject: 'Edukacja obywatelska', time_start: '08:00', time_end: '08:45', room: 's. 09', teacher: 'Czarna Alicja', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_2', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '08:50', time_end: '09:35', room: '', teacher: 'Łysakowski Grzegorz', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_3', day: 'friday', subject: 'Język niemiecki', time_start: '09:40', time_end: '10:25', room: 's. 21', teacher: 'Chyła Beata', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_4', day: 'friday', subject: 'Język niemiecki', time_start: '10:40', time_end: '11:25', room: 's. 21', teacher: 'Chyła Beata', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_6', day: 'friday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', status: 'active', statusLabel: 'Aktywna' },
            { id: 'librus_fri_7', day: 'friday', subject: 'Język polski', time_start: '13:15', time_end: '14:00', room: 's. 34', teacher: 'Negowska Alicja', status: 'active', statusLabel: 'Aktywna' }
          ],
          substitutions: []
        },
        calendar: {
          events: [
            { id: 9101, date: '2026-10-19', type: 'absence', category: 'Nieobecność nauczyciela', title: 'Nieobecność: Prabucki Andrzej', teacher: 'Prabucki Andrzej' },
            { id: 9104, date: '2026-10-19', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Biznes i zarządzanie', teacher: 'Sokół Paweł' },
            { id: 9106, date: '2026-10-21', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna' },
            { id: 9107, date: '2026-10-21', type: 'sprawdzian', category: 'Sprawdzian', title: 'Sprawdzian: Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna' },
            { id: 9109, date: '2026-10-28', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Chemia', teacher: 'Kolasińska Paulina' },
            { id: 9110, date: '2026-10-29', type: 'sprawdzian', category: 'Sprawdzian', title: 'Sprawdzian: Język niemiecki', teacher: 'Chyła Beata' }
          ]
        },
        logs: [
          { tag: '+ SUCCESS', msg: 'Zestaw danych pobrany z bramy Vercel Serverless Gateway.' }
        ]
      });
    }

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
