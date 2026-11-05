import { PushbulletDispatcher } from '../pushbullet/dispatcher.js';

export interface LessonAlertMonitorOptions {
  apiGatewayUrl: string;
  dispatcher?: PushbulletDispatcher;
}

export class LessonAlertMonitor {
  private apiGatewayUrl: string;
  private dispatcher?: PushbulletDispatcher;
  private sentAlertKeys = new Set<string>();
  private lastCheckedDateKey: string = '';

  constructor(options: LessonAlertMonitorOptions) {
    this.apiGatewayUrl = options.apiGatewayUrl;
    this.dispatcher = options.dispatcher;
  }

  /**
   * Sprawdza status lekcji i wysyła deterministyczne alerty przed dzwonkiem.
   */
  public async checkAndDispatch(currentDate = new Date()): Promise<{ dispatched: boolean; alertType?: string; message?: string }> {
    const todayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    if (this.lastCheckedDateKey !== todayKey) {
      this.sentAlertKeys.clear();
      this.lastCheckedDateKey = todayKey;
    }

    try {
      const res = await fetch(`${this.apiGatewayUrl}/automation/context-status`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      if (!res.ok) {
        return { dispatched: false, message: `Błąd API Gateway: ${res.status}` };
      }

      const data = (await res.json()) as any;
      const lessonInfo = data?.lessonInfo;
      if (!lessonInfo || lessonInfo.bellType === 'OUTSIDE_HOURS') {
        return { dispatched: false, message: 'Poza godzinami lekcyjnymi' };
      }

      const currentLesson = lessonInfo.currentLesson;
      const nextLesson = lessonInfo.nextLesson;
      const minutesToBell = lessonInfo.minutesToBell;
      const bellType = lessonInfo.bellType;

      // 1. Alert na 5 minut przed dzwonkiem na przerwę (koniec lekcji)
      if (bellType === 'LESSON_END' && minutesToBell === 5 && currentLesson) {
        const alertKey = `bell_end_5m_${currentLesson.id || currentLesson.subject}_${todayKey}`;
        if (!this.sentAlertKeys.has(alertKey)) {
          this.sentAlertKeys.add(alertKey);

          const title = `DZWONEK ZA 5 MIN :: ${currentLesson.subject}`;
          const body = nextLesson
            ? `Za 5 minut koniec lekcji. Kolejna lekcja: ${nextLesson.subject} w sali ${nextLesson.classroom} (${nextLesson.teacher || 'nauczyciel'}).`
            : `Za 5 minut koniec lekcji. To ostatnia lekcja w dniu dzisiejszym!`;

          this.dispatcher?.enqueue({
            title,
            body,
            priority: 'HIGH'
          });

          console.log(`[+] LESSON ALERT :: Wysłano powiadomienie Pushbullet: "${title}" -> "${body}"`);
          return { dispatched: true, alertType: 'LESSON_END_5MIN', message: title };
        }
      }

      // 2. Alert na 2 minuty przed końcem przerwy (dzwonek na lekcję)
      if (bellType === 'BREAK_END' && minutesToBell === 2 && nextLesson) {
        const alertKey = `break_end_2m_${nextLesson.id || nextLesson.subject}_${todayKey}`;
        if (!this.sentAlertKeys.has(alertKey)) {
          this.sentAlertKeys.add(alertKey);

          const title = `DZWONEK NA LEKCJĘ ZA 2 MIN :: ${nextLesson.subject}`;
          const body = `Koniec przerwy za 2 minuty! Udaj się do sali ${nextLesson.classroom} (${nextLesson.subject}, ${nextLesson.teacher || 'nauczyciel'}).`;

          this.dispatcher?.enqueue({
            title,
            body,
            priority: 'HIGH'
          });

          console.log(`[+] LESSON ALERT :: Wysłano alert końca przerwy: "${title}"`);
          return { dispatched: true, alertType: 'BREAK_END_2MIN', message: title };
        }
      }

      // 3. Poranny briefing o 07:15 (Dni robocze 1-5)
      const hours = currentDate.getHours();
      const mins = currentDate.getMinutes();
      const day = currentDate.getDay();

      if (day >= 1 && day <= 5 && hours === 7 && mins === 15) {
        const briefingKey = `morning_briefing_${todayKey}`;
        if (!this.sentAlertKeys.has(briefingKey)) {
          this.sentAlertKeys.add(briefingKey);

          const totalLessons = data.todayLessonsCount || 0;
          const exams = Array.isArray(data.todayExams) ? data.todayExams : [];
          let body = `Plan na dziś: ${totalLessons} lekcji.\n`;
          if (exams.length > 0) {
            body += `UWAGA SPRAWDZIANY: ${exams.map((e: any) => e.title).join(', ')}!\n`;
          } else {
            body += `Brak zaplanowanych kartkówek na dziś.\n`;
          }

          this.dispatcher?.enqueue({
            title: `Poranny Briefing Ucznia :: ${data.formattedTime || '07:15'}`,
            body,
            priority: 'HIGH'
          });

          console.log(`[+] LESSON ALERT :: Wysłano poranny briefing: ${briefingKey}`);
          return { dispatched: true, alertType: 'MORNING_BRIEFING', message: 'Poranny briefing' };
        }
      }

      return { dispatched: false, message: `Stan nominalny: ${minutesToBell} min do ${bellType}` };
    } catch (err: any) {
      console.warn('[!] LESSON ALERT :: Błąd podczas sprawdzania alertów lekcji:', err.message);
      return { dispatched: false, message: err.message };
    }
  }
}
