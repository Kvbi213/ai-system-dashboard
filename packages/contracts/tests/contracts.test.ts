import { describe, it, expect } from 'vitest';
import {
  GoogleAuthPayloadSchema,
  GradeSchema,
  TimetableLessonSchema,
  TransactionSchema,
  ChatMessageSchema,
  EntityCardSchema,
  TelemetryMetricsSchema,
  SpeedCameraSchema,
  AtticWorkoutSessionSchema
} from '../src';

describe('Contracts Zod Schema Validation Suite', () => {
  it('validates a correct Google Auth payload', () => {
    const valid = { idToken: 'valid-google-jwt-token' };
    const res = GoogleAuthPayloadSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects an empty Google Auth payload', () => {
    const invalid = { idToken: '' };
    const res = GoogleAuthPayloadSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates a correct grade payload with modifiers and zero weight', () => {
    const grade = {
      id: 'g-1',
      subject: 'Informatyka',
      value: 5,
      modifier: '+',
      weight: 0,
      isSemester1: true,
      category: 'Aktywność',
      teacher: 'Kżyś Łukasz',
      date: '2026-10-28'
    };
    const res = GradeSchema.safeParse(grade);
    expect(res.success).toBe(true);
  });

  it('rejects an invalid grade with negative weight or invalid modifier', () => {
    const invalid = {
      id: 'g-2',
      subject: 'Matematyka',
      value: 7, // out of range 1-6
      weight: -1
    };
    const res = GradeSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates a timetable lesson with cancellation and substitution flags', () => {
    const lesson = {
      id: 'l-10',
      day: 'tuesday',
      timeStart: '08:00',
      timeEnd: '08:45',
      subject: 'Urządzenia techniki komputerowej',
      room: '204',
      teacher: 'Cembik Bartosz',
      isSubstitution: true,
      substitutionTeacher: 'Joanna Ziemba',
      isCancelled: false,
      category: 'school'
    };
    const res = TimetableLessonSchema.safeParse(lesson);
    expect(res.success).toBe(true);
  });

  it('validates a financial transaction with 50/30/20 envelope mapping', () => {
    const tx = {
      id: 'tx-100',
      amount: 45.50,
      description: 'Zakupy Biedronka',
      envelope: 'NEEDS',
      source: 'PUSHBULLET_AUTO',
      createdAt: '2026-10-28T14:32:00Z'
    };
    const res = TransactionSchema.safeParse(tx);
    expect(res.success).toBe(true);
  });

  it('rejects a financial transaction with an unknown envelope', () => {
    const invalid = {
      id: 'tx-101',
      amount: 100,
      envelope: 'CRYPTO_GAMBLING'
    };
    const res = TransactionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates a chat message with tool call metadata', () => {
    const msg = {
      id: 'msg-1',
      role: 'assistant',
      content: 'Pobrałem plan lekcji.',
      toolCalls: [
        {
          tool: 'GET_LIBRUS_TIMETABLE',
          params: { day: 'today' },
          status: 'success',
          executionTimeMs: 142
        }
      ],
      createdAt: '2026-10-28T10:00:00Z'
    };
    const res = ChatMessageSchema.safeParse(msg);
    expect(res.success).toBe(true);
  });

  it('validates an entity card in 10-domain OSINT architecture', () => {
    const entity = {
      id: 'ent-1',
      name: 'ZSE Starogard',
      treePath: 'polska/pomorskie/starogard_gdanski/zse',
      type: 'ORGANIZATION',
      housingModel: 'CORE',
      domains: {
        metryka: { age: 60, location: 'Starogard Gdański' },
        finanse: { budgetTier: 'PUBLIC' }
      }
    };
    const res = EntityCardSchema.safeParse(entity);
    expect(res.success).toBe(true);
  });

  it('validates a CANARD speed camera point', () => {
    const camera = {
      id: 'cam-1',
      name: 'OPP Starogard - Gniew',
      type: 'SECTION_CONTROL',
      latitude: 53.967,
      longitude: 18.526,
      speedLimit: 90,
      corridor: 'starogard_gdansk'
    };
    const res = SpeedCameraSchema.safeParse(camera);
    expect(res.success).toBe(true);
  });

  it('validates an Attic FBW workout session with steppers and rest timer', () => {
    const workout = {
      id: 'w-1',
      name: 'FBW Attic Blok A',
      date: '2026-10-28',
      restTimerSeconds: 90,
      exercises: [
        {
          name: 'Drążek nachwyt',
          sets: 2,
          reps: 10,
          weightKg: 0,
          completed: true
        }
      ]
    };
    const res = AtticWorkoutSessionSchema.safeParse(workout);
    expect(res.success).toBe(true);
  });

  it('validates telemetry metrics payload for SSE stream', () => {
    const telemetry = {
      cpuUsagePercent: 12.4,
      ramTotalMb: 16384,
      ramUsedMb: 4210,
      heapUsedMb: 180,
      uptimeSeconds: 3600,
      timestamp: '2026-10-30T07:00:00Z'
    };
    const res = TelemetryMetricsSchema.safeParse(telemetry);
    expect(res.success).toBe(true);
  });
});
