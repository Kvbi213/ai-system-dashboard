export interface IterationBudgetConfig {
  maxLoops?: number;
  timeoutMs?: number;
  maxTokens?: number;
}

export class IterationBudgetExhaustedError extends Error {
  constructor(message: string, public readonly currentLoop: number, public readonly maxLoops: number) {
    super(message);
    this.name = 'IterationBudgetExhaustedError';
  }
}

export class IterationBudget {
  private readonly maxLoops: number;
  private readonly timeoutMs: number;
  private readonly maxTokens?: number;
  private currentLoop: number = 0;
  private readonly startTime: number;
  private accumulatedTokens: number = 0;

  constructor(config: IterationBudgetConfig = {}) {
    this.maxLoops = config.maxLoops ?? 5;
    this.timeoutMs = config.timeoutMs ?? 15000;
    this.maxTokens = config.maxTokens;
    this.startTime = Date.now();
  }

  public recordStep(tokensUsed: number = 0): void {
    this.currentLoop += 1;
    this.accumulatedTokens += tokensUsed;

    if (Date.now() - this.startTime > this.timeoutMs) {
      throw new IterationBudgetExhaustedError(
        `[!] IterationBudget: Przekroczono limit czasu wykonania (${this.timeoutMs}ms).`,
        this.currentLoop,
        this.maxLoops
      );
    }

    if (this.currentLoop > this.maxLoops) {
      throw new IterationBudgetExhaustedError(
        `[!] IterationBudget: Osiągnięto limit ${this.maxLoops} iteracji agenta (zapobieganie pętli nieskończonej).`,
        this.currentLoop,
        this.maxLoops
      );
    }

    if (this.maxTokens && this.accumulatedTokens > this.maxTokens) {
      throw new IterationBudgetExhaustedError(
        `[!] IterationBudget: Przekroczono limit tokenów sesji (${this.accumulatedTokens} > ${this.maxTokens}).`,
        this.currentLoop,
        this.maxLoops
      );
    }
  }

  public getStatus() {
    return {
      currentLoop: this.currentLoop,
      maxLoops: this.maxLoops,
      remainingLoops: Math.max(0, this.maxLoops - this.currentLoop),
      elapsedMs: Date.now() - this.startTime,
      accumulatedTokens: this.accumulatedTokens,
      maxTokens: this.maxTokens
    };
  }
}
