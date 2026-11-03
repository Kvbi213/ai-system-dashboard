import { describe, it, expect } from 'vitest';
import { LogDrainCompressor } from '../src/telemetry/logDrain.js';

describe('LogDrainCompressor Suite (SigNoz / Drain Pattern)', () => {
  it('parameterizes dynamic timestamps, numbers, and IPs into template clusters', () => {
    const drain = new LogDrainCompressor();

    const line1 = '2026-11-03T11:55:00Z [INFO] GET /api/school/timetable?day=2 from 192.168.1.45 (took 12ms)';
    const line2 = '2026-11-03T11:56:00Z [INFO] GET /api/school/timetable?day=3 from 192.168.1.99 (took 18ms)';

    const c1 = drain.parseLog(line1);
    const c2 = drain.parseLog(line2);

    expect(c1.clusterId).toBe(c2.clusterId);
    expect(c2.count).toBe(2);
    expect(c2.template).toContain('<TIMESTAMP>');
    expect(c2.template).toContain('<IP>');
  });

  it('calculates savings ratio when multiple repetitive logs are compressed', () => {
    const drain = new LogDrainCompressor();

    for (let i = 0; i < 50; i++) {
      drain.parseLog(`Ping SSE heartbeat at 2026-11-03T12:00:${i}Z to client 10.0.0.${i}`);
    }

    const ratio = drain.getCompressionRatio();
    expect(ratio.rawLines).toBe(50);
    expect(ratio.clusters).toBe(1);
    expect(ratio.savingsPercent).toBeGreaterThanOrEqual(95);
  });
});
