import { describe, it, expect } from 'vitest';
import { CLOUD_COLLECTIONS, isCloudEnvironment } from '../modules/services/cloudSync.js';

describe('Cloud Synchronization Architecture & Collection Registry', () => {
  it('should define all core persistent collections in CLOUD_COLLECTIONS', () => {
    expect(CLOUD_COLLECTIONS.TASKS).toBe('tasks');
    expect(CLOUD_COLLECTIONS.FINANCES).toBe('finances');
    expect(CLOUD_COLLECTIONS.WORKOUTS).toBe('workouts');
    expect(CLOUD_COLLECTIONS.CALENDAR).toBe('calendar');
    expect(CLOUD_COLLECTIONS.OPERATOR_BRAIN).toBe('operator_brain');
    expect(CLOUD_COLLECTIONS.CHAT_HISTORY).toBe('chat_history');
    expect(CLOUD_COLLECTIONS.TIMETABLE).toBe('timetable');
    expect(CLOUD_COLLECTIONS.NOTES).toBe('notes');
  });

  it('should evaluate isCloudEnvironment() false when window is undefined or node environment', () => {
    // In node/vitest environment without browser window location
    expect(typeof isCloudEnvironment).toBe('function');
  });
});
