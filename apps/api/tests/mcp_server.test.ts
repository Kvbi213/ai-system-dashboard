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

  it('lists registered MCP tools with schema parameters (25+ tools)', () => {
    const tools = mcpServer.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(25);
    const names = tools.map((t) => t.name);
    expect(names).toContain('get_system_metrics');
    expect(names).toContain('query_timetable');
    expect(names).toContain('get_current_lesson_status');
    expect(names).toContain('schedule_lesson_transition_alert');
    expect(names).toContain('send_phone_notification');
    expect(names).toContain('get_phone_notifications');
    expect(names).toContain('add_to_do');
    expect(names).toContain('delete_to_do');
    expect(names).toContain('update_to_do');
    expect(names).toContain('get_all_tasks');
    expect(names).toContain('add_finance_record');
    expect(names).toContain('delete_finance_record');
    expect(names).toContain('transfer_funds');
    expect(names).toContain('get_librus_grades');
    expect(names).toContain('get_librus_calendar');
    expect(names).toContain('add_calendar_event');
    expect(names).toContain('delete_calendar_event');
    expect(names).toContain('get_calendar_events');
    expect(names).toContain('learn_fact');
    expect(names).toContain('query_semantic_memory');
    expect(names).toContain('perform_osint_scan');
    expect(names).toContain('execute_web_search');
    expect(names).toContain('read_project_file');
    expect(names).toContain('scan_project_directory');
  });

  it('calls send_phone_notification and records push', async () => {
    const res = await mcpServer.callTool('send_phone_notification', {
      title: 'Alert z MCP',
      body: 'Wiadomość z testu MCP',
      priority: 'HIGH'
    });
    expect(res.success).toBe(true);
    expect(res.iden).toBeDefined();

    const notifs = await mcpServer.callTool('get_phone_notifications', {});
    expect(notifs.count).toBeGreaterThan(0);
  });

  it('performs CRUD operations on Tasks via MCP tools', async () => {
    const addRes = await mcpServer.callTool('add_to_do', {
      title: 'Zadanie z testu MCP',
      priority: 'HIGH',
      category: 'Testy'
    });
    expect(addRes.success).toBe(true);
    expect(addRes.task.id).toBeDefined();
    const taskId = addRes.task.id;

    const allRes = await mcpServer.callTool('get_all_tasks', { filter_status: 'all' });
    expect(allRes.tasks.some((t: any) => t.id === taskId)).toBe(true);

    const updateRes = await mcpServer.callTool('update_to_do', {
      taskId,
      completed: true
    });
    expect(updateRes.task.completed).toBe(true);

    const delRes = await mcpServer.callTool('delete_to_do', { taskId });
    expect(delRes.success).toBe(true);
  });

  it('performs Finance transactions and fund transfers via MCP', async () => {
    const txRes = await mcpServer.callTool('add_finance_record', {
      title: 'Kawa z MCP',
      amount: 18.5,
      envelope: 'WANTS',
      category: 'Kawiarnia'
    });
    expect(txRes.success).toBe(true);
    expect(txRes.transaction.id).toBeDefined();

    const transferRes = await mcpServer.callTool('transfer_funds', {
      fromEnvelope: 'WANTS',
      toEnvelope: 'SAVINGS',
      amount: 50.0,
      note: 'Oszczędności miesiąca'
    });
    expect(transferRes.success).toBe(true);
    expect(transferRes.transfer.expenseTx).toBeDefined();

    const delRes = await mcpServer.callTool('delete_finance_record', {
      transactionId: txRes.transaction.id
    });
    expect(delRes.success).toBe(true);
  });

  it('queries Librus grades and calendar via MCP', async () => {
    const gradesRes = await mcpServer.callTool('get_librus_grades', {});
    expect(gradesRes.gpa).toBeGreaterThan(0);
    expect(gradesRes.grades.length).toBeGreaterThan(0);

    const calRes = await mcpServer.callTool('get_librus_calendar', {});
    expect(calRes.events.length).toBeGreaterThan(0);
  });

  it('adds, retrieves and deletes Calendar events via MCP', async () => {
    const addEvent = await mcpServer.callTool('add_calendar_event', {
      title: 'Kartkówka z fizyki',
      date: '2026-11-15',
      category: 'Kartkówka',
      description: 'Dział optyka'
    });
    expect(addEvent.success).toBe(true);
    expect(addEvent.event.id).toBeDefined();

    const listRes = await mcpServer.callTool('get_calendar_events', {});
    expect(listRes.events.some((e: any) => e.id === addEvent.event.id)).toBe(true);

    const delRes = await mcpServer.callTool('delete_calendar_event', {
      eventId: addEvent.event.id
    });
    expect(delRes.success).toBe(true);
  });

  it('stores and recalls facts in Lab-Zero semantic memory via MCP', async () => {
    const learnRes = await mcpServer.callTool('learn_fact', {
      fact: 'Ulubiony edytor to VS Code z motywem OLED True Black.',
      category: 'PREFERENCE',
      tags: 'edytor,motyw,preferencja'
    });
    expect(learnRes.success).toBe(true);

    const recallRes = await mcpServer.callTool('query_semantic_memory', {
      query: 'Jaki jest preferowany edytor i motyw?',
      limit: 2
    });
    expect(recallRes.results.length).toBeGreaterThan(0);
    expect(recallRes.results[0].fact.content).toContain('OLED True Black');
  });

  it('blocks SSRF attempts in perform_osint_scan', async () => {
    await expect(
      mcpServer.callTool('perform_osint_scan', { target: '127.0.0.1' })
    ).rejects.toThrow('SSRF');

    await expect(
      mcpServer.callTool('perform_osint_scan', { target: 'http://localhost:5000' })
    ).rejects.toThrow('SSRF');

    const cleanRes = await mcpServer.callTool('perform_osint_scan', { target: 'onet.pl' });
    expect(cleanRes.reputation.status).toBe('CLEAN');
  });

  it('executes web search through MCP', async () => {
    const searchRes = await mcpServer.callTool('execute_web_search', { query: 'TypeScript 5.8 features' });
    expect(searchRes.query).toBe('TypeScript 5.8 features');
    expect(searchRes.results.length).toBeGreaterThan(0);
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
    const res = await mcpServer.callTool('get_current_lesson_status', { day: 2, currentTime: '12:35' });
    expect(res.day).toBe(2);
    expect(res.isBreak).toBe(false);
    expect(res.currentLesson).toBeDefined();
    expect(res.currentLesson.subject).toContain('Wychowanie fizyczne');
    expect(res.currentLesson.minutesRemaining).toBe(30);
    expect(res.nextLesson).toBeDefined();
    expect(res.nextLesson.subject).toContain('Pracownia systemów operacyjnych');
    expect(res.nextLesson.classroom).toBe('s. 1.15');
    expect(res.statusSummary).toContain('Trwa lekcja');
  });

  it('schedules lesson transition alert with preview and metadata payload', async () => {
    const alertRes = await mcpServer.callTool('schedule_lesson_transition_alert', {
      minutesBeforeEnd: 5,
      lessonIndex: 4,
      customNote: 'Zabierz strój na salę gimnastyczną'
    });
    expect(alertRes.success).toBe(true);
    expect(alertRes.notificationPreview).toContain('DZWONEK');
    expect(alertRes.payload?.scheduledAlertMinutesBefore ?? alertRes.scheduledAlertMinutesBefore).toBe(5);
  });

  it('throws error on unknown tool call', async () => {
    await expect(mcpServer.callTool('unknown_tool', {})).rejects.toThrow('Nieznane narzędzie');
  });
});
