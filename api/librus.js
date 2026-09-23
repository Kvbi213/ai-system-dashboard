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

    // Jeśli brak poświadczeń na Vercel lub żądanie demo
    if (!login || !password || req.query.demo === 'true') {
      return res.status(200).json({
        success: true,
        isConfigured: !!(login && password),
        isDemo: true,
        luckyNumber: 17,
        lastSync: new Date().toISOString(),
        overallAverage: 5.39,
        totalSubjects: 6,
        gradedSubjectsCount: 6,
        highestAverage: { subject: 'Informatyka', average: 6.0 },
        lowestAverage: { subject: 'Fizyka', average: 4.75 },
        subjects: [
          {
            name: 'Język polski',
            average: '4.80',
            computedAverage: 4.8,
            sem1Avg: 4.8,
            sem2Avg: 4.8,
            sem1Grades: [
              { id: 101, value: '5', numericValue: 5, details: { category: 'Sprawdzian', weight: 3, date: '2026-02-14', teacher: 'M. Nowak', comment: 'Romantyzm' } },
              { id: 102, value: '4+', numericValue: 4.5, details: { category: 'Kartkówka', weight: 1, date: '2026-03-02', teacher: 'M. Nowak', comment: 'Kordian' } }
            ],
            sem2Grades: [
              { id: 104, value: '5-', numericValue: 4.75, details: { category: 'Wypracowanie', weight: 3, date: '2026-04-10', teacher: 'M. Nowak' } }
            ]
          },
          {
            name: 'Matematyka',
            average: '5.20',
            computedAverage: 5.2,
            sem1Avg: 5.2,
            sem2Avg: 5.2,
            sem1Grades: [
              { id: 201, value: '5', numericValue: 5, details: { category: 'Sprawdzian', weight: 3, date: '2026-02-18', teacher: 'A. Wiśniewski', comment: 'Ciągi liczbowe' } },
              { id: 202, value: '6', numericValue: 6, details: { category: 'Zadanie olimpijskie', weight: 2, date: '2026-03-24', teacher: 'A. Wiśniewski' } }
            ],
            sem2Grades: [
              { id: 204, value: '5', numericValue: 5, details: { category: 'Sprawdzian', weight: 3, date: '2026-04-15', teacher: 'A. Wiśniewski' } }
            ]
          },
          {
            name: 'Informatyka',
            average: '6.00',
            computedAverage: 6.0,
            sem1Avg: 6.0,
            sem2Avg: 6.0,
            sem1Grades: [
              { id: 401, value: '6', numericValue: 6, details: { category: 'Projekt', weight: 3, date: '2026-02-20', teacher: 'P. Zieliński' } }
            ],
            sem2Grades: [
              { id: 403, value: '6', numericValue: 6, details: { category: 'Projekt AI', weight: 3, date: '2026-04-25', teacher: 'P. Zieliński' } }
            ]
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

  return res.status(405).json({ error: 'Method not allowed' });
}
