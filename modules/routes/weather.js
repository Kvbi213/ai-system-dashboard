import express from 'express';
import { fetchWeather, logError } from '../scheduler.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const weather = await fetchWeather();
    if (weather) res.json(weather);
    else res.status(503).json({ error: 'Nie udało się pobrać danych pogodowych.' });
  } catch (err) {
    logError('GET /api/weather', err);
    res.status(500).json({ error: 'Błąd serwera pogody.' });
  }
});

router.get('/raw', async (req, res) => {
  try {
    const lat = req.query.lat || 53.96;
    const lon = req.query.lon || 18.53;
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&forecast_days=1&timezone=Europe%2FWarsaw`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

export default router;
