import { Router, Request, Response } from 'express';
import { dbStore } from '../../db/store.js';

export const trafficRouter = Router();

trafficRouter.get('/cameras', (_req: Request, res: Response) => {
  res.json({ cameras: dbStore.getTrafficCameras() });
});

trafficRouter.get('/radars', (_req: Request, res: Response) => {
  res.json({ radars: dbStore.getSpeedRadars() });
});

trafficRouter.get('/alerts', (_req: Request, res: Response) => {
  res.json({
    roadTemperature: 12.5,
    weatherCondition: 'Umiarkowane opady deszczu',
    routes: [
      {
        name: 'Trasa Miejska Codzienna (Odcinek Północny DK)',
        distanceKm: 8.5,
        estimatedTimeMin: 14,
        condition: 'Płynny ruch bez zatorów',
        roadTemp: 13.0,
        hasAlert: false
      },
      {
        name: 'Korytarz Tranzytowy Regionalny (Autostrada A1)',
        distanceKm: 58.0,
        estimatedTimeMin: 46,
        condition: 'Zwężenie na pasie włączeniowym (roboty drogowe)',
        roadTemp: 12.0,
        hasAlert: true
      }
    ]
  });
});
