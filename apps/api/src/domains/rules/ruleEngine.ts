import { z } from 'zod';

export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains']),
  value: z.any()
});

export const ActionSchema = z.object({
  type: z.enum(['pushbullet_notify', 'log_alert', 'system_checkpoint', 'webhook']),
  payload: z.record(z.any())
});

export const AutomationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  trigger: z.enum(['radar_detected', 'grade_recorded', 'weather_hazard', 'workout_milestone', 'system_event']),
  conditions: z.array(ConditionSchema),
  actions: z.array(ActionSchema)
});

export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Action = z.infer<typeof ActionSchema>;

export class RulesEngine {
  private rules: AutomationRule[] = [];

  constructor() {
    this.seedDefaultRules();
  }

  private seedDefaultRules(): void {
    this.rules = [
      {
        id: 'rule_radar_proximity',
        name: 'Wykrycie Fotoradaru CANARD na trasie',
        description: 'Generuje alert gdy fotoradar znajduje się w promieniu mniejszym niż 15 km',
        enabled: true,
        trigger: 'radar_detected',
        conditions: [
          { field: 'distanceKm', operator: 'lt', value: 15 },
          { field: 'active', operator: 'eq', value: true }
        ],
        actions: [
          {
            type: 'pushbullet_notify',
            payload: {
              title: 'CANARD: Fotoradar w pobliżu',
              body: 'Zbliżasz się do stacji pomiarowej CANARD. Zweryfikuj ograniczenie prędkości.',
              priority: 'HIGH'
            }
          },
          {
            type: 'log_alert',
            payload: { level: 'WARN', component: 'TRAFFIC_MONITOR' }
          }
        ]
      },
      {
        id: 'rule_grade_warning',
        name: 'Ostrzeżenie o Ocenie poniżej progu (Librus)',
        description: 'Wysyła powiadomienie gdy nowa ocena ma wartość niższą niż 3',
        enabled: true,
        trigger: 'grade_recorded',
        conditions: [
          { field: 'grade', operator: 'lt', value: 3 }
        ],
        actions: [
          {
            type: 'pushbullet_notify',
            payload: {
              title: 'Librus: Nowa ocena poniżej normy',
              body: 'Odnotowano nową ocenę wymagającą poprawy.',
              priority: 'NORMAL'
            }
          }
        ]
      },
      {
        id: 'rule_fbw_completed',
        name: 'Gratulacje Ukończenia Sesji FBW',
        description: 'Zapisuje punkt kontrolny po zrealizowaniu wszystkich zaplanowanych serii',
        enabled: true,
        trigger: 'workout_milestone',
        conditions: [
          { field: 'isWorkoutComplete', operator: 'eq', value: true }
        ],
        actions: [
          {
            type: 'system_checkpoint',
            payload: { checkpointName: 'FBW_COMPLETED_SESSION', syncObsidian: true }
          }
        ]
      }
    ];
  }

  public getRules(): AutomationRule[] {
    return this.rules;
  }

  public addRule(rule: AutomationRule): void {
    const validated = AutomationRuleSchema.parse(rule);
    this.rules.push(validated);
  }

  public evaluateEvent(trigger: string, eventData: Record<string, any>): {
    matchedRules: AutomationRule[];
    executedActions: Action[];
  } {
    const matchedRules: AutomationRule[] = [];
    const executedActions: Action[] = [];

    const activeRules = this.rules.filter((r) => r.enabled && r.trigger === trigger);

    for (const rule of activeRules) {
      const allPassed = rule.conditions.every((cond) => this.checkCondition(cond, eventData));
      if (allPassed) {
        matchedRules.push(rule);
        for (const act of rule.actions) {
          executedActions.push(act);
        }
      }
    }

    return { matchedRules, executedActions };
  }

  private checkCondition(condition: Condition, data: Record<string, any>): boolean {
    const actualVal = data[condition.field];
    if (actualVal === undefined) return false;

    switch (condition.operator) {
      case 'eq':
        return actualVal === condition.value;
      case 'neq':
        return actualVal !== condition.value;
      case 'gt':
        return Number(actualVal) > Number(condition.value);
      case 'gte':
        return Number(actualVal) >= Number(condition.value);
      case 'lt':
        return Number(actualVal) < Number(condition.value);
      case 'lte':
        return Number(actualVal) <= Number(condition.value);
      case 'contains':
        return String(actualVal).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  }
}

export const rulesEngine = new RulesEngine();
