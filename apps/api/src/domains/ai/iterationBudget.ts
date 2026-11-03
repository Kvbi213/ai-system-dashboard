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

/**
 * IterationBudget enforces execution step limits, wall-clock timeouts, and token consumption budgets.
 * CONCURRENCY NOTICE: Designed for sequential execution per single LLM session context.
 * Instances are single-threaded and not safe for concurrent shared access across asynchronous workers.
 */
export class IterationBudget {
  private readonly maxLoops: number;
  private readonly timeoutMs: number;
  private readonly maxTokens?: number;
  private currentLoop: number = 0;
  private readonly startTime: number;
  private accumulatedTokens: number = 0;

  constructor(config: IterationBudgetConfig = {}) {
    if (config.maxLoops !== undefined && config.maxLoops <= 0) {
      throw new RangeError('[!] IterationBudget: maxLoops must be a positive integer (> 0).');
    }
    if (config.timeoutMs !== undefined && config.timeoutMs <= 0) {
      throw new RangeError('[!] IterationBudget: timeoutMs must be a positive number (> 0).');
    }
    if (config.maxTokens !== undefined && config.maxTokens <= 0) {
      throw new RangeError('[!] IterationBudget: maxTokens must be a positive integer (> 0).');
    }

    this.maxLoops = config.maxLoops ?? 5;
    this.timeoutMs = config.timeoutMs ?? 15000;
    this.maxTokens = config.maxTokens;
    this.startTime = Date.now();
  }

  public recordStep(tokensUsed: number = 0): void {
    this.currentLoop += 1;
    this.recordTokens(tokensUsed);

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
  }

  /**
   * Records token consumption and checks against maxTokens.
   * Passing 0 tokens is a valid no-op. Passing negative values throws RangeError.
   */
  public recordTokens(tokensUsed: number): void {
    if (tokensUsed < 0) {
      throw new RangeError('[!] IterationBudget: tokensUsed cannot be a negative value.');
    }
    if (tokensUsed === 0) {
      return;
    }
    this.accumulatedTokens += tokensUsed;

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
