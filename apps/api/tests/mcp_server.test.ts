import { describe, it, expect } from 'vitest';
import { mcpServer } from '../src/mcp/internalMcpServer.js';

describe('OmniDash Internal MCP Server Suite', () => {
  it('lists registered MCP tools with schema parameters', () => {
    const tools = mcpServer.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(4);
    const names = tools.map((t) => t.name);
    expect(names).toContain('get_system_metrics');
    expect(names).toContain('query_timetable');
    expect(names).toContain('get_active_alerts');
    expect(names).toContain('trigger_workout_sync');
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

  it('throws error on unknown tool call', async () => {
    await expect(mcpServer.callTool('unknown_tool', {})).rejects.toThrow('Nieznane narzędzie');
  });
});
