import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.js';
import os from 'os';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export class InternalMcpServer {
  private tools: McpToolDefinition[] = [
    {
      name: 'get_system_metrics',
      description: 'Zwraca parametry wydajnościowe serwera (RAM, CPU, uptime, load avg) w formacie telemetrii Beszel.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'query_timetable',
      description: 'Odpytuje zsynchronizowany plan lekcji Librus dla zadanego dnia tygodnia (1=Pon, 2=Wt, ..., 5=Pt).',
      parameters: {
        type: 'object',
        properties: {
          day: {
            type: 'number',
            description: 'Numer dnia tygodnia (1 do 5)'
          }
        },
        required: ['day']
      }
    },
    {
      name: 'get_active_alerts',
      description: 'Zwraca aktywne ostrzeżenia drogowe CANARD, fotoradary oraz alerty systemowe.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'trigger_workout_sync',
      description: 'Pobiera lub wymusza synchronizację aktualnego postępu sesji kalisteniki FBW.',
      parameters: {
        type: 'object',
        properties: {
          cycle: {
            type: 'string',
            description: 'Identyfikator cyklu FBW (np. "Cykl A")'
          }
        }
      }
    }
  ];

  public listTools(): McpToolDefinition[] {
    return this.tools;
  }

  public async callTool(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'get_system_metrics': {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryPercent = Math.round((usedMem / totalMem) * 100);

        return {
          status: 'HEALTHY',
          uptimeSeconds: Math.round(os.uptime()),
          memory: {
            totalMb: Math.round(totalMem / (1024 * 1024)),
            usedMb: Math.round(usedMem / (1024 * 1024)),
            percent: memoryPercent
          },
          cpus: os.cpus().length,
          loadAvg: os.loadavg(),
          platform: os.platform(),
          timestamp: new Date().toISOString()
        };
      }

      case 'query_timetable': {
        const day = Number(args.day || 2);
        const lessons = dbStore.getTimetable(day);
        return {
          day,
          count: lessons.length,
          lessons: lessons.map((l) => ({
            order: l.order,
            time: l.timeRange,
            subject: l.subject,
            teacher: l.teacher,
            classroom: l.classroom
          }))
        };
      }

      case 'get_active_alerts': {
        const radars = dbStore.getSpeedRadars();
        const cameras = dbStore.getTrafficCameras();
        return {
          timestamp: new Date().toISOString(),
          canardRadarsCount: radars.length,
          trafficCamerasCount: cameras.length,
          hazards: [
            { id: 'hz_1', type: 'RADAR', location: 'DK22 / Czarlin', active: true },
            { id: 'hz_2', type: 'ROADWORK', location: 'Węzeł Stanisławie A1', status: 'płynny' }
          ]
        };
      }

      case 'trigger_workout_sync': {
        const exercises = dbStore.getExercises();
        const completedSets = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
        const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0);
        return {
          cycle: args.cycle || 'FBW Podciąganie A',
          exercisesCount: exercises.length,
          completedSets,
          totalSets,
          isFinished: totalSets > 0 && completedSets >= totalSets,
          lastSynced: new Date().toISOString()
        };
      }

      default:
        throw new Error(`[!] McpServer: Nieznane narzędzie "${name}".`);
    }
  }
}

export const mcpServer = new InternalMcpServer();

export const mcpRouter = Router();

mcpRouter.get('/tools', (_req: Request, res: Response) => {
  res.json({
    server: 'OmniDash Internal MCP Server v4.0.0',
    version: '1.0.0',
    tools: mcpServer.listTools()
  });
});

mcpRouter.post('/call', async (req: Request, res: Response) => {
  const { tool, arguments: args } = req.body;
  if (!tool || typeof tool !== 'string') {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'Wymagane pole tool (string).' });
    return;
  }

  try {
    const result = await mcpServer.callTool(tool, args || {});
    res.json({
      success: true,
      tool,
      result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      tool,
      error: err.message
    });
  }
});
