import { describe, it, expect } from 'vitest';
import { 
  calculateDistanceKm, 
  getSavedLocation 
} from '../modules/services/geolocationService.js';
import { 
  KNOWN_POLISH_SPEED_CAMERAS, 
  getSpeedCamerasInRadius, 
  getSpeedCamerasOnRoute, 
  getTrafficAlerts, 
  calculateRoute 
} from '../modules/services/trafficService.js';
import { agentTools } from '../modules/ai/tools.js';

describe('Traffic & Road Intelligence Service (Janosik & Google Maps / CANARD)', () => {
  describe('calculateDistanceKm', () => {
    it('should return 0 when coordinates are identical', () => {
      const dist = calculateDistanceKm(53.9643, 18.5262, 53.9643, 18.5262);
      expect(dist).toBe(0);
    });

    it('should calculate accurate distance between Starogard Gdański and Gdańsk (~44 km)', () => {
      const dist = calculateDistanceKm(53.9643, 18.5262, 54.3520, 18.6466);
      expect(dist).toBeGreaterThan(40);
      expect(dist).toBeLessThan(50);
    });

    it('should handle invalid or missing coordinates safely without throwing', () => {
      expect(calculateDistanceKm(null, null, 50, 20)).toBe(0);
      expect(calculateDistanceKm(undefined, 'abc', 50, 20)).toBe(0);
      expect(calculateDistanceKm(NaN, 18, 50, 20)).toBe(0);
    });
  });

  describe('KNOWN_POLISH_SPEED_CAMERAS Registry', () => {
    it('should contain verified speed cameras and section speed checks', () => {
      expect(Array.isArray(KNOWN_POLISH_SPEED_CAMERAS)).toBe(true);
      expect(KNOWN_POLISH_SPEED_CAMERAS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have required attributes on every camera entry', () => {
      KNOWN_POLISH_SPEED_CAMERAS.forEach(cam => {
        expect(cam.id).toBeDefined();
        expect(cam.name).toBeDefined();
        expect(cam.road).toBeDefined();
        expect(cam.lat).toBeGreaterThan(50);
        expect(cam.lon).toBeGreaterThan(14);
        expect(cam.speedLimit).toBeGreaterThan(0);
        expect(cam.type).toBeDefined();
        expect(cam.category).toBeDefined();
      });
    });

    it('should include key CANARD checkpoints on Starogard -> Gdańsk corridor', () => {
      const ids = KNOWN_POLISH_SPEED_CAMERAS.map(c => c.id);
      expect(ids).toContain('cam_dk91_kolincz');
      expect(ids).toContain('cam_dk91_czarlin');
      expect(ids).toContain('cam_opp_tczew_swierkocin');
      expect(ids).toContain('cam_dk91_pszczolki');
      expect(ids).toContain('cam_dk91_rusocin');
      expect(ids).toContain('cam_pruszcz_gdanski');
      expect(ids).toContain('cam_opp_gdansk_tunel');
    });
  });

  describe('getSpeedCamerasInRadius', () => {
    it('should return cameras within 10 km of Starogard Gdański', async () => {
      const result = await getSpeedCamerasInRadius(53.9643, 18.5262, 10);
      expect(result).toBeDefined();
      expect(result.radiusKm).toBe(10);
      expect(Array.isArray(result.cameras)).toBe(true);
      expect(result.totalCameras).toBeGreaterThanOrEqual(1);

      // Kolincz is ~6-8 km from Starogard and should be in the list
      const hasKolincz = result.cameras.some(c => c.id === 'cam_dk91_kolincz');
      expect(hasKolincz).toBe(true);

      // Tunel pod Martwą Wisłą is ~45 km away and should NOT be in 10 km radius
      const hasTunel = result.cameras.some(c => c.id === 'cam_opp_gdansk_tunel');
      expect(hasTunel).toBe(false);
    });

    it('should calculate distanceKm for each returned camera in radius', async () => {
      const result = await getSpeedCamerasInRadius(53.9643, 18.5262, 15);
      result.cameras.forEach(cam => {
        expect(cam.distanceKm).toBeDefined();
        expect(cam.distanceKm).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('getSpeedCamerasOnRoute', () => {
    it('should return all 9 speed cameras and OPP checkpoints on route to Gdańsk', async () => {
      const routeInfo = await getSpeedCamerasOnRoute('Gdańsk', 53.9643, 18.5262);
      expect(routeInfo).toBeDefined();
      expect(routeInfo.destination).toBe('Gdańsk');
      expect(routeInfo.totalCameras).toBeGreaterThanOrEqual(8);
      expect(Array.isArray(routeInfo.cameras)).toBe(true);

      const hasCzarlin = routeInfo.cameras.some(c => c.id === 'cam_dk91_czarlin');
      const hasOPPSwarozyn = routeInfo.cameras.some(c => c.id === 'cam_opp_tczew_swierkocin');
      const hasPszczolki = routeInfo.cameras.some(c => c.id === 'cam_dk91_pszczolki');
      const hasTunel = routeInfo.cameras.some(c => c.id === 'cam_opp_gdansk_tunel');

      expect(hasCzarlin).toBe(true);
      expect(hasOPPSwarozyn).toBe(true);
      expect(hasPszczolki).toBe(true);
      expect(hasTunel).toBe(true);
    });

    it('should format clean summary string with count and route name', async () => {
      const routeInfo = await getSpeedCamerasOnRoute('Gdańsk');
      expect(routeInfo.summary).toContain('Gdańsk');
      expect(routeInfo.summary).toContain('fotoradar');
    });
  });

  describe('getTrafficAlerts', () => {
    it('should return traffic status and incident analysis for specified radius', async () => {
      const alertsData = await getTrafficAlerts(53.9643, 18.5262, 10);
      expect(alertsData).toBeDefined();
      expect(alertsData.radiusKm).toBe(10);
      expect(Array.isArray(alertsData.alerts)).toBe(true);
      expect(alertsData.trafficStatus).toBeDefined();
      expect(typeof alertsData.totalIncidents).toBe('number');
    });
  });

  describe('calculateRoute', () => {
    it('should compute route details and incorporate speed cameras along the way', async () => {
      const route = await calculateRoute('Gdańsk', 53.9643, 18.5262);
      expect(route).toBeDefined();
      expect(route.destination).toBe('Gdańsk');
      expect(route.distanceKm).toBeGreaterThan(45);
      expect(route.durationMinutes).toBeGreaterThan(30);
      expect(route.speedCameras).toBeDefined();
      expect(route.speedCameras.totalCameras).toBeGreaterThanOrEqual(8);
    });
  });

  describe('AI Tools Registration for Traffic & Geolocation', () => {
    it('should register GET_CURRENT_LOCATION in agentTools', () => {
      const tool = agentTools.find(t => t.function.name === 'GET_CURRENT_LOCATION');
      expect(tool).toBeDefined();
      expect(tool.function.description).toContain('geolokalizacj');
    });

    it('should register GET_TRAFFIC_ALERTS in agentTools', () => {
      const tool = agentTools.find(t => t.function.name === 'GET_TRAFFIC_ALERTS');
      expect(tool).toBeDefined();
      expect(tool.function.parameters.properties.radius_km).toBeDefined();
    });

    it('should register GET_SPEED_CAMERAS in agentTools', () => {
      const tool = agentTools.find(t => t.function.name === 'GET_SPEED_CAMERAS');
      expect(tool).toBeDefined();
      expect(tool.function.parameters.properties.destination).toBeDefined();
    });

    it('should register CALCULATE_ROUTE in agentTools', () => {
      const tool = agentTools.find(t => t.function.name === 'CALCULATE_ROUTE');
      expect(tool).toBeDefined();
      expect(tool.function.parameters.required).toContain('destination');
    });
  });
});
