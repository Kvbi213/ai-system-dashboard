import { describe, it, expect } from 'vitest';
import { rulesEngine } from '../src/domains/rules/ruleEngine.js';

describe('OmniDash Declarative Rules Engine (KeepHQ Pattern)', () => {
  it('loads default seeded rules for radars, grades, and workouts', () => {
    const rules = rulesEngine.getRules();
    expect(rules.length).toBeGreaterThanOrEqual(3);
    const radarRule = rules.find((r) => r.id === 'rule_radar_proximity');
    expect(radarRule).toBeDefined();
    expect(radarRule?.trigger).toBe('radar_detected');
  });

  it('triggers CANARD radar rule when distance < 15 km', () => {
    const result = rulesEngine.evaluateEvent('radar_detected', {
      distanceKm: 8,
      active: true
    });

    expect(result.matchedRules.length).toBe(1);
    expect(result.matchedRules[0].id).toBe('rule_radar_proximity');
    expect(result.executedActions.length).toBe(2);
    expect(result.executedActions[0].type).toBe('pushbullet_notify');
  });

  it('does NOT trigger radar rule when distance >= 15 km', () => {
    const result = rulesEngine.evaluateEvent('radar_detected', {
      distanceKm: 25,
      active: true
    });

    expect(result.matchedRules.length).toBe(0);
    expect(result.executedActions.length).toBe(0);
  });

  it('triggers grade warning when grade < 3', () => {
    const result = rulesEngine.evaluateEvent('grade_recorded', {
      grade: 2,
      subject: 'Matematyka'
    });

    expect(result.matchedRules.length).toBe(1);
    expect(result.matchedRules[0].id).toBe('rule_grade_warning');
  });

  it('triggers workout milestone when isWorkoutComplete is true', () => {
    const result = rulesEngine.evaluateEvent('workout_milestone', {
      isWorkoutComplete: true
    });

    expect(result.matchedRules.length).toBe(1);
    expect(result.executedActions[0].type).toBe('system_checkpoint');
  });
});
