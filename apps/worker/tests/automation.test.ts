import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LessonAlertMonitor } from '../src/automation/lessonAlertMonitor.js';
import { LibrusAutoScraper } from '../src/automation/librusAutoScraper.js';
import { PushbulletDispatcher } from '../src/pushbullet/dispatcher.js';

describe('Worker Automation & Librus Scraper Suite', () => {
  let mockDispatcher: PushbulletDispatcher;

  beforeEach(() => {
    mockDispatcher = {
      enqueue: vi.fn(),
      getQueueLength: vi.fn().mockReturnValue(0),
      flush: vi.fn(),
      destroy: vi.fn()
    } as unknown as PushbulletDispatcher;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('LessonAlertMonitor formats room and notes cleanly without empty strings or false gym alerts', async () => {
    const mockLessonInfo = {
      bellType: 'LESSON_END',
      minutesToBell: 5,
      isConsecutiveSameSubject: false,
      currentLesson: { id: 'l1', order: 4, subject: 'Język niemiecki', classroom: 'Z1' },
      nextLesson: { id: 'l2', order: 5, subject: 'Język polski', classroom: '', teacher: 'Alicja Negowska' }
    };

    const globalFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ lessonInfo: mockLessonInfo })
    } as any);

    const monitor = new LessonAlertMonitor({
      apiGatewayUrl: 'http://mock-gateway/api',
      dispatcher: mockDispatcher
    });

    const result = await monitor.checkAndDispatch(new Date(2026, 10, 5, 11, 20));
    expect(result.dispatched).toBe(true);
    expect(mockDispatcher.enqueue).toHaveBeenCalledTimes(1);

    const callArgs = (mockDispatcher.enqueue as any).mock.calls[0][0];
    expect(callArgs.title).toBe('DZWONEK ZA 5 MIN :: Język niemiecki');
    // Upewnij się, że nie zawiera "w  (" ani "salę gimnastyczną"
    expect(callArgs.body).not.toContain('w  (');
    expect(callArgs.body).not.toContain('strój');
    expect(callArgs.body).toContain('(Alicja Negowska)');
  });

  it('LibrusAutoScraper initializes reference baseline and discovers new grades with Pushbullet dispatch', async () => {
    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/school/sync')) {
        return { ok: true, json: async () => ({ success: true }) } as any;
      }
      if (urlStr.includes('/school/grades')) {
        callCount++;
        if (callCount === 1) {
          // Pierwszy przebieg: 1 ocena bazowa
          return {
            ok: true,
            json: async () => ({
              subjects: [
                {
                  name: 'Matematyka',
                  grades: [{ id: 'g_1', value: 5, displayValue: '5', category: 'sprawdzian', weight: 2 }]
                }
              ]
            })
          } as any;
        } else {
          // Drugi przebieg: pojawiła się nowa ocena!
          return {
            ok: true,
            json: async () => ({
              subjects: [
                {
                  name: 'Matematyka',
                  grades: [
                    { id: 'g_1', value: 5, displayValue: '5', category: 'sprawdzian', weight: 2 },
                    { id: 'g_2', value: 0, displayValue: '+', category: 'aktywność', weight: 1 }
                  ]
                }
              ]
            })
          } as any;
        }
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const scraper = new LibrusAutoScraper({
      apiGatewayUrl: 'http://mock-gateway/api',
      dispatcher: mockDispatcher,
      minIntervalMinutes: 45,
      maxIntervalMinutes: 75
    });

    // Przebieg 1 (boot/baseline)
    const run1 = await scraper.performScrape('TEST_RUN_1');
    expect(run1.success).toBe(true);
    expect(run1.newGradesCount).toBe(0);
    expect(mockDispatcher.enqueue).not.toHaveBeenCalled();

    // Przebieg 2 (wykrycie nowej oceny "+")
    const run2 = await scraper.performScrape('TEST_RUN_2');
    expect(run2.success).toBe(true);
    expect(run2.newGradesCount).toBe(1);
    expect(mockDispatcher.enqueue).toHaveBeenCalledTimes(1);

    const dispatchedPush = (mockDispatcher.enqueue as any).mock.calls[0][0];
    expect(dispatchedPush.title).toContain('NOWA OCENA W LIBRUS :: MATEMATYKA');
    expect(dispatchedPush.body).toContain('+');

    scraper.stop();
  });
});
