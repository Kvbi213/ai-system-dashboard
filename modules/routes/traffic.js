import express from 'express';
import { 
  getSpeedCamerasInRadius, 
  getSpeedCamerasOnRoute, 
  getTrafficAlerts, 
  calculateRoute,
  KNOWN_POLISH_SPEED_CAMERAS 
} from '../services/trafficService.js';
import { getSavedLocation, reverseGeocode } from '../services/geolocationService.js';

const router = express.Router();

/**
 * GET /api/traffic/location
 * Zwraca bieżącą pozycję i adres operatora
 */
router.get('/location', async (req, res) => {
  try {
    const loc = getSavedLocation();
    res.json({ success: true, location: loc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/traffic/alerts
 * Wypadki i utrudnienia w promieniu X km wokół pozycji
 * Query: lat, lon, radius (domyślnie 10), road
 */
router.get('/alerts', async (req, res) => {
  try {
    const defaultLoc = getSavedLocation();
    const lat = req.query.lat ? parseFloat(req.query.lat) : defaultLoc.latitude;
    const lon = req.query.lon ? parseFloat(req.query.lon) : defaultLoc.longitude;
    const radius = req.query.radius ? parseFloat(req.query.radius) : 10;
    const road = req.query.road || '';

    const data = await getTrafficAlerts(lat, lon, radius, road);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/traffic/speed-cameras
 * Fotoradary i odcinkowe pomiary prędkości w promieniu lub na trasie
 * Query: lat, lon, radius, destination
 */
router.get('/speed-cameras', async (req, res) => {
  try {
    const defaultLoc = getSavedLocation();
    const lat = req.query.lat ? parseFloat(req.query.lat) : defaultLoc.latitude;
    const lon = req.query.lon ? parseFloat(req.query.lon) : defaultLoc.longitude;

    if (req.query.destination) {
      const routeCameras = await getSpeedCamerasOnRoute(req.query.destination, lat, lon);
      return res.json({ success: true, mode: 'route', data: routeCameras });
    }

    const radius = req.query.radius ? parseFloat(req.query.radius) : 10;
    const data = await getSpeedCamerasInRadius(lat, lon, radius);
    res.json({ success: true, mode: 'radius', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/traffic/route
 * Wyznaczenie trasy i analiza fotoradarów oraz utrudnień na drodze
 * Query: destination (wymagane, np. Gdańsk), origin (opcjonalne)
 */
router.get('/route', async (req, res) => {
  try {
    const destination = req.query.destination || 'Gdańsk';
    const defaultLoc = getSavedLocation();
    const lat = req.query.lat ? parseFloat(req.query.lat) : defaultLoc.latitude;
    const lon = req.query.lon ? parseFloat(req.query.lon) : defaultLoc.longitude;
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || null;

    const data = await calculateRoute(destination, lat, lon, googleApiKey);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
