export interface LogCluster {
  clusterId: string;
  template: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  sampleMessage: string;
}

export class LogDrainCompressor {
  private clusters: Map<string, LogCluster> = new Map();
  private maxClusters: number;

  constructor(maxClusters: number = 200) {
    this.maxClusters = maxClusters;
  }

  // Tokenize and normalize raw log into template
  public parseLog(rawLog: string): LogCluster {
    const now = new Date().toISOString();
    const template = this.parameterize(rawLog);
    const clusterId = this.generateId(template);

    const existing = this.clusters.get(clusterId);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = now;
      existing.sampleMessage = rawLog;
      return existing;
    }

    // Evict oldest if reaching capacity
    if (this.clusters.size >= this.maxClusters) {
      const oldestKey = this.clusters.keys().next().value;
      if (oldestKey) {
        this.clusters.delete(oldestKey);
      }
    }

    const newCluster: LogCluster = {
      clusterId,
      template,
      count: 1,
      firstSeen: now,
      lastSeen: now,
      sampleMessage: rawLog
    };

    this.clusters.set(clusterId, newCluster);
    return newCluster;
  }

  // Parameterize dynamic variables (numbers, IPs, UUIDs, hex, timestamps)
  private parameterize(msg: string): string {
    return msg
      .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?Z?/gi, '<TIMESTAMP>')
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>')
      .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '<UUID>')
      .replace(/\b0x[0-9a-fA-F]+\b/g, '<HEX>')
      .replace(/\d+(ms|s|%|px|kb|mb|gb)?/gi, '<NUM>')
      .trim();
  }

  private generateId(template: string): string {
    let hash = 0;
    for (let i = 0; i < template.length; i++) {
      hash = ((hash << 5) - hash) + template.charCodeAt(i);
      hash |= 0;
    }
    return `cluster_${Math.abs(hash).toString(16)}`;
  }

  public getClusters(): LogCluster[] {
    return Array.from(this.clusters.values()).sort((a, b) => b.count - a.count);
  }

  public getCompressionRatio(): { rawLines: number; clusters: number; savingsPercent: number } {
    let rawLines = 0;
    for (const cluster of this.clusters.values()) {
      rawLines += cluster.count;
    }
    const clusters = this.clusters.size;
    const savingsPercent = rawLines > 0 ? Math.round(((rawLines - clusters) / rawLines) * 100) : 0;
    return { rawLines, clusters, savingsPercent };
  }
}

export const logDrain = new LogDrainCompressor();
