import { describe, it, expect } from 'vitest';
import {
  mcpServer,
  McpError,
  McpBadRequestError,
  McpNotFoundError,
  McpNotImplementedError,
  httpStatusFromError
} from '../src/mcp/internalMcpServer.js';

describe('OmniDash Internal MCP Server Suite', () => {
  it('verifies McpError hierarchy and HTTP status codes', () => {
    const badReq = new McpBadRequestError('Bad arg');
    expect(badReq).toBeInstanceOf(McpError);
    expect(badReq.status).toBe(400);
    expect(httpStatusFromError(badReq)).toBe(400);

    const notFound = new McpNotFoundError('Missing item');
    expect(notFound).toBeInstanceOf(McpError);
    expect(notFound.status).toBe(404);
    expect(httpStatusFromError(notFound)).toBe(404);

    const notImpl = new McpNotImplementedError('Not supported');
    expect(notImpl).toBeInstanceOf(McpError);
    expect(notImpl.status).toBe(501);
    expect(httpStatusFromError(notImpl)).toBe(501);

    const unknownErr = new Error('Generic error');
    expect(httpStatusFromError(unknownErr)).toBe(500);
  });
  it('lists registered MCP tools with schema parameters', () => {
    const tools = mcpServer.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(7);
    const names = tools.map((t) => t.name);
    expect(names).toContain('get_system_metrics');
    expect(names).toContain('query_timetable');
    expect(names).toContain('get_active_alerts');
    expect(names).toContain('trigger_workout_sync');
    expect(names).toContain('get_current_lesson_status');
    expect(names).toContain('schedule_lesson_transition_alert');
    expect(names).toContain('save_student_directive');
  });

  it('calls get_system_metrics and returns RAM/CPU telemetry', async () => {
    const metrics = await mcpServer.callTool('get_system_metrics', {});
    expect(metrics.status).toBe('HEALTHY');
    expect(metrics.memory).toBeDefined();
    expect(metrics.memory.totalMb).toBeGreaterThan(0);
    expect(metrics.cpus).toBeGreaterThan(0);
  });

  it('calls query_timetable for Tuesday (day 2) and returns lessons', async () => {
    const res = await mcpServer.callTool('query_timetable', { day: 2 });
    expect(res.day).toBe(2);
    expect(res.count).toBeGreaterThan(0);
    expect(res.lessons[0].subject).toBeDefined();
  });

  it('calls trigger_workout_sync and returns progress', async () => {
    const res = await mcpServer.callTool('trigger_workout_sync', { cycle: 'FBW Podciąganie A' });
    expect(res.cycle).toBe('FBW Podciąganie A');
    expect(res.totalSets).toBeGreaterThan(0);
  });

  it('calculates current lesson status, break countdown and next classroom', async () => {
    // Test z symulowaną godziną 11:45 (w trakcie Wychowania fizycznego 11:30 - 12:15, następna lekcja: Pracownia systemów operacyjnych 12:20)
    const res = await mcpServer.callTool('get_current_lesson_status', { day: 2, currentTime: '11:45' });
    expect(res.day).toBe(2);
    expect(res.isBreak).toBe(false);
    expect(res.currentLesson).toBeDefined();
    expect(res.currentLesson.subject).toContain('Wychowanie fizyczne');
    expect(res.currentLesson.minutesRemaining).toBe(30); // 12:15 - 11:45 = 30 min
    expect(res.nextLesson).toBeDefined();
    expect(res.nextLesson.subject).toContain('Pracownia systemów operacyjnych');
    expect(res.nextLesson.classroom).toBe('s. 1.15');
    expect(res.statusSummary).toContain('Trwa lekcja');
  });

  it('calculates break status correctly during break interval', async () => {
    // Test z symulowaną godziną 12:17 (podczas 5-minutowej przerwy przed Pracownią systemów operacyjnych 12:20)
    const res = await mcpServer.callTool('get_current_lesson_status', { day: 2, currentTime: '12:17' });
    expect(res.day).toBe(2);
    expect(res.isBreak).toBe(true);
    expect(res.nextLesson).toBeDefined();
    expect(res.nextLesson.subject).toContain('Pracownia systemów operacyjnych');
    expect(res.breakInfo.minutesUntilNextLesson).toBe(3); // 12:20 - 12:17 = 3 min
  });

  it('schedules lesson transition alert with preview and metadata payload', async () => {
    const alertRes = await mcpServer.callTool('schedule_lesson_transition_alert', {
      minutesBeforeEnd: 5,
      lessonIndex: 4,
      customNote: 'Zabierz strój na salę gimnastyczną'
    });
    expect(alertRes.success).toBe(true);
    expect(alertRes.notificationPreview).toContain('DZWONEK');
    expect(alertRes.payload.scheduledAlertMinutesBefore).toBe(5);
    expect(alertRes.payload.nextSubject).toBeDefined();
  });

  it('saves student directive into semantic memory store', async () => {
    const saveRes = await mcpServer.callTool('save_student_directive', {
      directive: 'Powiadamiaj mnie na 5 minut przed końcem każdej lekcji o sali i kolejnym przedmiocie.',
      tags: 'szkoła,dzwonek,dyrektywa'
    });
    expect(saveRes.success).toBe(true);
    expect(saveRes.directiveId).toBeDefined();
    expect(saveRes.storedContent).toContain('Powiadamiaj mnie na 5 minut');
  });

  it('throws error on unknown tool call', async () => {
    await expect(mcpServer.callTool('unknown_tool', {})).rejects.toThrow('Nieznane narzędzie');
  });
});
