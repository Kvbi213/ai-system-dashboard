export interface UsageMetric {
  id: string;
  timestamp: string;
  module: 'ai_chat' | 'osint' | 'tts_speech' | 'pushbullet' | 'system';
  provider: 'groq' | 'openai' | 'fish_audio' | 'edge_tts' | 'gcp';
  inputUnits: number; // tokens or characters
  outputUnits: number;
  costPln: number;
  durationMs: number;
}

export interface CoverageSourceStatus {
  sourceName: string;
  expectedIntervalMins: number;
  lastSyncTimestamp: string;
  isGapDetected: boolean;
  gapDurationMins: number;
  status: 'HEALTHY' | 'DEGRADED' | 'GAP_ALERT';
}

export class FinOpsCollector {
  private metrics: UsageMetric[] = [];
  private sourceHealth: Map<string, { lastSync: number; expectedIntervalMins: number }> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = Date.now();
    // Initialize coverage source expectations
    this.sourceHealth.set('Librus Synergia Scraper', { lastSync: now - 18 * 60 * 1000, expectedIntervalMins: 60 });
    this.sourceHealth.set('CANARD Radary Drogowe', { lastSync: now - 8 * 60 * 1000, expectedIntervalMins: 15 });
    this.sourceHealth.set('Mikr.us LXC & Docker Telemetria', { lastSync: now - 3 * 60 * 1000, expectedIntervalMins: 5 });
    this.sourceHealth.set('Pushbullet WebSocket Listener', { lastSync: now - 1 * 60 * 1000, expectedIntervalMins: 5 });

    // Seed realistic usage metrics for current month
    this.recordMetric({
      module: 'ai_chat',
      provider: 'groq',
      inputUnits: 4200,
      outputUnits: 1250,
      costPln: 0.04,
      durationMs: 840
    });
    this.recordMetric({
      module: 'tts_speech',
      provider: 'fish_audio',
      inputUnits: 1540,
      outputUnits: 0,
      costPln: 0.12,
      durationMs: 1200
    });
    this.recordMetric({
      module: 'osint',
      provider: 'openai',
      inputUnits: 2800,
      outputUnits: 620,
      costPln: 0.08,
      durationMs: 1650
    });
  }

  public recordMetric(data: Omit<UsageMetric, 'id' | 'timestamp'>): UsageMetric {
    const metric: UsageMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...data
    };
    this.metrics.unshift(metric);
    return metric;
  }

  public markSourceHeartbeat(sourceName: string, intervalMins = 15): void {
    this.sourceHealth.set(sourceName, {
      lastSync: Date.now(),
      expectedIntervalMins: intervalMins
    });
  }

  public getFinOpsSummary() {
    const totalTokens = this.metrics.reduce((acc, m) => acc + m.inputUnits + m.outputUnits, 0);
    const totalCostPln = this.metrics.reduce((acc, m) => acc + m.costPln, 0);

    const byModule: Record<string, { count: number; costPln: number; tokens: number }> = {};
    for (const m of this.metrics) {
      if (!byModule[m.module]) {
        byModule[m.module] = { count: 0, costPln: 0, tokens: 0 };
      }
      const item = byModule[m.module]!;
      item.count += 1;
      item.costPln += m.costPln;
      item.tokens += m.inputUnits + m.outputUnits;
    }

    // Check coverage gaps
    const now = Date.now();
    const coverageGaps: CoverageSourceStatus[] = [];
    let hasCriticalGaps = false;

    for (const [name, meta] of this.sourceHealth.entries()) {
      const elapsedMins = Math.round((now - meta.lastSync) / (60 * 1000));
      const thresholdMins = meta.expectedIntervalMins * 1.5;
      const isGap = elapsedMins > thresholdMins;
      if (isGap) hasCriticalGaps = true;

      coverageGaps.push({
        sourceName: name,
        expectedIntervalMins: meta.expectedIntervalMins,
        lastSyncTimestamp: new Date(meta.lastSync).toISOString(),
        isGapDetected: isGap,
        gapDurationMins: elapsedMins,
        status: isGap ? (elapsedMins > meta.expectedIntervalMins * 3 ? 'GAP_ALERT' : 'DEGRADED') : 'HEALTHY'
      });
    }

    return {
      monthlyBudgetCapPln: 50.0,
      totalCostPln: Math.round(totalCostPln * 100) / 100,
      totalTokens,
      byModule,
      recentMetrics: this.metrics.slice(0, 10),
      hasCriticalGaps,
      coverageGaps
    };
  }
}

export const finOpsCollector = new FinOpsCollector();
