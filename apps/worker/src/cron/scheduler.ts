export class SystemScheduler {
  private timers: NodeJS.Timeout[] = [];
  private apiGatewayUrl: string;

  constructor(apiGatewayUrl = 'http://localhost:5000/api') {
    this.apiGatewayUrl = apiGatewayUrl;
  }

  public start(): void {
    console.log('[+] SUCCESS :: Harmonogram zadań cyklicznych (Cron Scheduler) wystartował.');

    // Every 15 minutes: refresh road traffic status
    const trafficTimer = setInterval(() => {
      this.syncTrafficTelemetry();
    }, 15 * 60 * 1000);
    this.timers.push(trafficTimer);

    // Initial warm-up ping
    this.pingHealth();
  }

  private async pingHealth(): Promise<void> {
    try {
      const res = await fetch(`${this.apiGatewayUrl}/system/health`);
      if (res.ok) {
        console.log('[*] SCHEDULER :: Połączenie z API Gateway nominalne.');
      }
    } catch {
      console.warn('[!] SCHEDULER :: API Gateway nie odpowiada na ping zdrowotny.');
    }
  }

  private async syncTrafficTelemetry(): Promise<void> {
    try {
      await fetch(`${this.apiGatewayUrl}/traffic/alerts`);
      console.log('[*] SCHEDULER :: Zaktualizowano telemetrię ruchu drogowego.');
    } catch (err) {
      console.error('[!] SCHEDULER :: Błąd aktualizacji telemetrii ruchu:', err);
    }
  }

  public stop(): void {
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
  }
}
