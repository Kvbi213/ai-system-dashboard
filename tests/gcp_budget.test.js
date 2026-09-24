import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  parsePubSubMessage,
  processBudgetNotification,
  simulateBudgetAlert,
  getGcpBudgetStatus,
  initGcpBudgetDb
} from '../modules/services/gcpBudgetService.js';
import { initDB } from '../modules/database.js';
import { agentTools } from '../modules/ai/tools.js';

describe('Google Cloud Billing & Pub/Sub Budget Guard (void-potato-7721)', () => {
  beforeAll(async () => {
    await initDB();
    await initGcpBudgetDb();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('parsePubSubMessage', () => {
    it('powinien poprawnie zdekodować wiadomość z Google Cloud Pub/Sub Push (Base64)', () => {
      const budgetJson = {
        budgetDisplayName: 'OmniDash Monthly Budget Guard',
        costAmount: 45.0,
        budgetAmount: 50.0,
        currencyCode: 'PLN',
        alertThresholdExceeded: 0.9,
        costIntervalStart: '2026-09-01T00:00:00Z'
      };

      const base64Data = Buffer.from(JSON.stringify(budgetJson)).toString('base64');
      const pubsubPushBody = {
        message: {
          data: base64Data,
          messageId: '123456789',
          publishTime: '2026-09-24T07:00:00Z'
        },
        subscription: 'projects/void-potato-7721/subscriptions/omni-budget-push'
      };

      const result = parsePubSubMessage(pubsubPushBody);

      expect(result.budgetDisplayName).toBe('OmniDash Monthly Budget Guard');
      expect(result.costAmount).toBe(45.0);
      expect(result.budgetAmount).toBe(50.0);
      expect(result.currencyCode).toBe('PLN');
      expect(result.percentage).toBe(90.0);
      expect(result.status).toBe('WARNING');
      expect(result.isBudgetThrottled).toBe(false);
    });

    it('powinien obsłużyć bezpośredni obiekt JSON powiadomienia budżetowego', () => {
      const rawJson = {
        costAmount: 12.5,
        budgetAmount: 50.0,
        currencyCode: 'PLN',
        alertThresholdExceeded: 0.25
      };

      const result = parsePubSubMessage(rawJson);

      expect(result.costAmount).toBe(12.5);
      expect(result.budgetAmount).toBe(50.0);
      expect(result.percentage).toBe(25.0);
      expect(result.status).toBe('OK');
      expect(result.isBudgetThrottled).toBe(false);
    });

    it('powinien oznaczyć status CRITICAL i aktywować isBudgetThrottled przy przekroczeniu 100%', () => {
      const rawJson = {
        costAmount: 55.0,
        budgetAmount: 50.0,
        currencyCode: 'PLN',
        alertThresholdExceeded: 1.0
      };

      const result = parsePubSubMessage(rawJson);

      expect(result.percentage).toBe(110.0);
      expect(result.status).toBe('CRITICAL');
      expect(result.isBudgetThrottled).toBe(true);
    });

    it('powinien rzucić błąd gdy payload jest pusty', () => {
      expect(() => parsePubSubMessage(null)).toThrow('Brak treści żądania');
    });

    it('powinien rzucić błąd przy uszkodzonym Base64', () => {
      const invalidPush = {
        message: {
          data: '!!!niepoprawny_base64!!!'
        }
      };
      expect(() => parsePubSubMessage(invalidPush)).toThrow();
    });
  });

  describe('processBudgetNotification & simulateBudgetAlert', () => {
    it('powinien przeprowadzić symulację alertu 90% budżetu i zwrócić zaktualizowany stan', async () => {
      const state = await simulateBudgetAlert(45.0, 50.0, 0.9);

      expect(state.costAmount).toBe(45.0);
      expect(state.budgetAmount).toBe(50.0);
      expect(state.percentage).toBe(90.0);
      expect(state.status).toBe('WARNING');
      expect(state.projectId).toBe('void-potato-7721');
    });

    it('powinien poprawnie zwrócić status budżetu z getGcpBudgetStatus', async () => {
      const status = await getGcpBudgetStatus();
      expect(status).toBeDefined();
      expect(status.projectId).toBe('void-potato-7721');
      expect(status.topicName).toContain('omni-budget-alerts');
    });
  });

  describe('AI Tool Definition', () => {
    it('powinien zawierać narzędzie GET_GCP_BUDGET_STATUS w rejestrze agentTools', () => {
      const tool = agentTools.find(t => t.function.name === 'GET_GCP_BUDGET_STATUS');
      expect(tool).toBeDefined();
      expect(tool.function.description).toContain('void-potato-7721');
      expect(tool.function.description).toContain('omni-budget-alerts');
    });
  });
});
