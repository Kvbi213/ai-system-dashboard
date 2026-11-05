import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/db/store.js';
import { calculateLessonInfo, executeScript, buildScriptContext } from '../src/domains/automation/scriptEngine.js';
import { AUTOMATION_TEMPLATES } from '../src/domains/automation/automationTemplates.js';
import { llmGateway } from '../src/domains/ai/llmGateway.js';

describe('Automation Engine & AI Function Calling Suite', () => {
  beforeEach(() => {
    dbStore.seed();
  });

  it('calculates current lesson status and minutes to bell deterministically', () => {
    // Symulacja czwartku o 10:20 (trwa lekcja 09:40 - 10:25, czyli Język angielski, 5 min do dzwonka!)
    const simulatedThursday = new Date(2026, 10, 5, 10, 20, 0); // 5 listopada 2026, 10:20
    const info = calculateLessonInfo(simulatedThursday);

    expect(info.bellType).toBe('LESSON_END');
    expect(info.minutesToBell).toBe(5);
    expect(info.currentLesson).toBeDefined();
    expect(info.currentLesson?.subject).toContain('angielski');
    expect(info.nextLesson).toBeDefined();
    expect(info.nextLesson?.classroom).toContain('Z2');
  });

  it('calculates break countdown when between lessons', () => {
    // 10:35 to przerwa między 10:25 a 10:40 (5 minut do kolejnej lekcji)
    const simulatedBreak = new Date(2026, 10, 5, 10, 35, 0);
    const info = calculateLessonInfo(simulatedBreak);

    expect(info.bellType).toBe('BREAK_END');
    expect(info.minutesToBell).toBe(5);
    expect(info.currentLesson).toBeNull();
    expect(info.nextLesson).toBeDefined();
  });

  it('executes automation script in sandbox with ctx and captures logs and notifications', async () => {
    const code = `
      ctx.log("Start testu");
      const info = ctx.school.getLessonInfo();
      ctx.log("Lekcja: " + (info.currentLesson ? info.currentLesson.subject : "brak"));
      await ctx.pushbullet.send("Test Alert", "Wiadomość testowa z piaskownicy", "HIGH");
      return { status: "OK", minutes: info.minutesToBell };
    `;

    const simulatedThursday = new Date(2026, 10, 5, 10, 20, 0);
    const result = await executeScript(code, simulatedThursday);

    expect(result.success).toBe(true);
    expect(result.logs.some((l) => l.includes('Start testu'))).toBe(true);
    expect(result.notificationsSent.length).toBe(1);
    expect(result.notificationsSent[0].title).toBe('Test Alert');
    expect(result.result).toEqual({ status: 'OK', minutes: 5 });
  });

  it('provides rich predefined automation templates', () => {
    expect(AUTOMATION_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    const bellTpl = AUTOMATION_TEMPLATES.find((t) => t.id === 'template_lesson_bell');
    expect(bellTpl).toBeDefined();
    expect(bellTpl?.defaultTriggerType).toBe('lesson_bell');
    expect(bellTpl?.sampleCode).toContain('ctx.school.getLessonInfo()');
  });

  it('executes live tool calls in LLMGateway for lesson status, tasks and scripts', async () => {
    // 1. get_current_lesson_status
    const lessonStatusJson = await llmGateway.executeLiveTool('get_current_lesson_status', {});
    const lessonStatus = JSON.parse(lessonStatusJson);
    expect(lessonStatus).toHaveProperty('minutesToBell');
    expect(lessonStatus).toHaveProperty('bellType');

    // 2. send_phone_notification
    const pushJson = await llmGateway.executeLiveTool('send_phone_notification', {
      title: 'Alert testowy',
      body: 'Treść powiadomienia testowego',
      priority: 'HIGH'
    });
    const push = JSON.parse(pushJson);
    expect(push.success).toBe(true);

    // 3. create_or_update_automation_script
    const createJson = await llmGateway.executeLiveTool('create_or_update_automation_script', {
      name: 'Skrypt wygenerowany przez AI',
      code: 'ctx.log("AI script active");',
      triggerType: 'lesson_bell'
    });
    const createRes = JSON.parse(createJson);
    expect(createRes.success).toBe(true);
    expect(createRes.createdScriptId).toBeDefined();

    // 4. list_automation_scripts
    const listJson = await llmGateway.executeLiveTool('list_automation_scripts', {});
    const list = JSON.parse(listJson);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((s: any) => s.id === createRes.createdScriptId)).toBe(true);
  });
});
