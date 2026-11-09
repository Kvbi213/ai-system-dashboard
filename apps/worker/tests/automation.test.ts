import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LessonAlertMonitor } from '../src/automation/lessonAlertMonitor.js';
import { LibrusAutoScraper } from '../src/automation/librusAutoScraper.js';
import { PushbulletDispatcher } from '../src/pushbullet/dispatcher.js';
import { getWarsawTime } from '../src/automation/timeUtils.js';

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

  it('getWarsawTime correctly maps UTC times to Europe/Warsaw hours', () => {
    // 06:15 UTC w czasie zimowym (CET, UTC+1) = 07:15 Europe/Warsaw
    const utcMorning = new Date('2026-11-09T06:15:00.000Z');
    const warsaw1 = getWarsawTime(utcMorning);
    expect(warsaw1.hours).toBe(7);
    expect(warsaw1.minutes).toBe(15);
    expect(warsaw1.formattedTime).toBe('07:15');
    expect(warsaw1.day).toBe(1); // Poniedziałek

    // 07:15 UTC w czasie zimowym = 08:15 Europe/Warsaw (anomalia zgłoszona przez operatora)
    const utcLater = new Date('2026-11-09T07:15:00.000Z');
    const warsaw2 = getWarsawTime(utcLater);
    expect(warsaw2.hours).toBe(8);
    expect(warsaw2.minutes).toBe(15);
    expect(warsaw2.formattedTime).toBe('08:15');
  });

  it('LessonAlertMonitor triggers morning briefing at 07:15 Warsaw time and NOT at 08:15 Warsaw time', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        lessonInfo: { bellType: 'BEFORE_SCHOOL', minutesToBell: 45 },
        todayLessonsCount: 7,
        todayExams: [{ title: 'Kartkówka z historii' }]
      })
    } as any);

    const monitor = new LessonAlertMonitor({
      apiGatewayUrl: 'http://mock-gateway/api',
      dispatcher: mockDispatcher
    });

    // Test 1: 07:15 w Polsce (06:15 UTC) -> briefing POWINIEN zostać wysłany
    const triggerDate = new Date('2026-11-09T06:15:00.000Z');
    const result1 = await monitor.checkAndDispatch(triggerDate);
    expect(result1.dispatched).toBe(true);
    expect(result1.alertType).toBe('MORNING_BRIEFING');
    expect(mockDispatcher.enqueue).toHaveBeenCalledTimes(1);

    const call1 = (mockDispatcher.enqueue as any).mock.calls[0][0];
    expect(call1.title).toContain('Poranny Briefing Ucznia');
    expect(call1.body).toContain('Plan na dziś: 7 lekcji.');
    expect(call1.body).toContain('Kartkówka z historii');

    // Test 2: 08:15 w Polsce (07:15 UTC) -> briefing NIE POWINIEN zostać wysłany
    const notTriggerDate = new Date('2026-11-10T07:15:00.000Z');
    const result2 = await monitor.checkAndDispatch(notTriggerDate);
    expect(result2.dispatched).toBe(false);
    expect(result2.alertType).not.toBe('MORNING_BRIEFING');
  });
});
