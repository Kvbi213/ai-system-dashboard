import express from 'express';
import { 
  getCachedGrades, 
  syncLibrusGrades, 
  getLibrusCredentials, 
  saveLibrusCredentials, 
  testLibrusAuth,
  getDemoGradesData,
  getCachedCalendar,
  syncLibrusCalendar,
  getDemoCalendarData
} from '../services/librusService.js';

const router = express.Router();

/**
 * GET /api/librus/grades
 * Pobiera aktualne oceny (z pamięci podręcznej lub dane demo jeśli włączone/brak poświadczeń).
 */
router.get('/grades', async (req, res) => {
  const creds = getLibrusCredentials();
  const forceDemo = req.query.demo === 'true';

  if (forceDemo) {
    return res.json({
      success: true,
      isConfigured: creds.isConfigured,
      ...getDemoGradesData()
    });
  }

  const cached = await getCachedGrades();
  if (cached) {
    return res.json({
      success: true,
      isConfigured: creds.isConfigured,
      ...cached
    });
  }

  // Jeśli brak danych w cache, ale są poświadczenia — zainicjuj synchronizację
  if (creds.isConfigured) {
    const syncRes = await syncLibrusGrades();
    if (syncRes.success) {
      return res.json({
        success: true,
        isConfigured: true,
        ...syncRes.data
      });
    } else {
      return res.status(502).json({
        success: false,
        isConfigured: true,
        error: syncRes.error,
        demoFallback: getDemoGradesData()
      });
    }
  }

  // Brak poświadczeń i brak cache — zwróć status nie-skonfigurowano z danymi demonstracyjnymi
  res.json({
    success: true,
    isConfigured: false,
    message: 'Librus Synergia nie został jeszcze skonfigurowany.',
    ...getDemoGradesData()
  });
});

/**
 * POST /api/librus/refresh
 * Wymusza natychmiastowe pobranie nowych danych z serwerów Librusa.
 */
router.post('/refresh', async (req, res) => {
  const creds = getLibrusCredentials();
  if (!creds.isConfigured) {
    return res.status(400).json({
      success: false,
      error: 'Brak skonfigurowanych poświadczeń Librus Synergia w systemie.'
    });
  }

  const result = await syncLibrusGrades();
  if (result.success) {
    res.json({
      success: true,
      message: 'Zsynchronizowano pomyślnie z Librus Synergia.',
      data: result.data
    });
  } else {
    res.status(502).json({
      success: false,
      error: result.error
    });
  }
});

/**
 * GET /api/librus/calendar
 * Pobiera terminarz szkolny (sprawdziany, kartkówki, nieobecności nauczycieli).
 */
router.get('/calendar', async (req, res) => {
  const creds = getLibrusCredentials();
  const forceDemo = req.query.demo === 'true';

  if (forceDemo) {
    return res.json({
      success: true,
      isConfigured: creds.isConfigured,
      ...getDemoCalendarData()
    });
  }

  const cached = await getCachedCalendar();
  if (cached) {
    return res.json({
      success: true,
      isConfigured: creds.isConfigured,
      ...cached
    });
  }

  // Jeśli brak w cache, ale są poświadczenia — zsynchronizuj
  if (creds.isConfigured) {
    const syncRes = await syncLibrusCalendar();
    if (syncRes.success) {
      return res.json({
        success: true,
        isConfigured: true,
        ...syncRes.data
      });
    }
  }

  // Fallback demo
  res.json({
    success: true,
    isConfigured: creds.isConfigured,
    ...getDemoCalendarData()
  });
});

/**
 * POST /api/librus/calendar/refresh
 * Wymusza natychmiastowe odświeżenie terminarza szkolnego.
 */
router.post('/calendar/refresh', async (req, res) => {
  const creds = getLibrusCredentials();
  if (!creds.isConfigured) {
    return res.status(400).json({
      success: false,
      error: 'Brak skonfigurowanych poświadczeń Librus Synergia.'
    });
  }

  const result = await syncLibrusCalendar();
  if (result.success) {
    res.json({
      success: true,
      message: 'Zsynchronizowano terminarz z Librus Synergia.',
      data: result.data
    });
  } else {
    res.status(502).json({
      success: false,
      error: result.error
    });
  }
});

/**
 * GET /api/librus/status
 * Sprawdza stan konfiguracji i ostatniej synchronizacji.
 */
router.get('/status', async (req, res) => {
  const creds = getLibrusCredentials();
  const cached = await getCachedGrades();

  res.json({
    success: true,
    isConfigured: creds.isConfigured,
    login: creds.login ? `${creds.login.slice(0, 3)}***` : '',
    lastSync: cached?.lastSync || null,
    status: cached?.status || (creds.isConfigured ? 'pending' : 'not_configured'),
    luckyNumber: cached?.luckyNumber || null,
    totalSubjects: cached?.totalSubjects || 0,
    overallAverage: cached?.overallAverage || 0
  });
});

/**
 * POST /api/librus/credentials
 * Aktualizuje poświadczenia w środowisku systemowym.
 */
router.post('/credentials', async (req, res) => {
  const { login, password, syncNow } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, error: 'Login i hasło są wymagane.' });
  }

  try {
    saveLibrusCredentials(login, password);

    let syncResult = null;
    if (syncNow) {
      syncResult = await syncLibrusGrades();
    }

    res.json({
      success: true,
      message: 'Poświadczenia Librus Synergia zostały zapisane.',
      syncResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/librus/test-auth
 * Testuje poprawność danych logowania bez ich trwałego zapisu.
 */
router.post('/test-auth', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, error: 'Podaj login i hasło.' });
  }

  try {
    const testRes = await testLibrusAuth(login, password);
    res.json(testRes);
  } catch (err) {
    res.status(401).json({
      success: false,
      error: `Błąd autoryzacji Librus: ${err.message}`
    });
  }
});

export default router;
