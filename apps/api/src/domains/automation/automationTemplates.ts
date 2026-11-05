import { AutomationTemplate } from './types.js';

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'template_lesson_bell',
    name: 'Monitor Dzwonków i Zmiany Sal (5 min przed dzwonkiem)',
    description: 'Bada czas do dzwonka i gdy zostaje 5 minut, wysyła alert Pushbullet z nazwą sali, kolejnym przedmiotem i nauczycielem.',
    category: 'SCHOOL',
    defaultTriggerType: 'lesson_bell',
    sampleCode: `// Sprawdzenie stanu lekcji i dzwonka
if (!ctx.school.isSchoolHours()) {
  ctx.log('Poza godzinami dydaktycznymi.');
  return;
}

const info = ctx.school.getLessonInfo();
ctx.log(\`Godzina: \${ctx.time.formattedTime} | Lekcja: \${info.currentLesson?.subject || 'brak'} | Dzwonek za: \${info.minutesToBell} min\`);

if (info.bellType === 'LESSON_END' && info.minutesToBell <= 5 && info.minutesToBell >= 1) {
  const next = info.nextLesson;
  const title = \`DZWONEK ZA \${info.minutesToBell} MIN :: \${info.currentLesson?.subject || 'Lekcja'}\`;
  const body = next
    ? \`Za \${info.minutesToBell} min koniec lekcji. Kolejna: \${next.subject} w sali \${next.classroom} (\${next.teacher || 'nauczyciel'}).\`
    : \`Za \${info.minutesToBell} min koniec lekcji. To ostatnia lekcja w dniu dzisiejszym!\`;
  await ctx.pushbullet.send(title, body, 'HIGH');
  ctx.log(\`Wysłano powiadomienie Pushbullet: \${title}\`);
}`
  },
  {
    id: 'template_morning_briefing',
    name: 'Poranny Briefing Ucznia (07:15)',
    description: 'Poranne zestawienie: liczba lekcji, sala pierwszej lekcji, zaplanowane sprawdziany/kartkówki oraz oczekujące zadania.',
    category: 'PRODUCTIVITY',
    defaultTriggerType: 'cron',
    defaultCron: '15 7 * * 1-5',
    sampleCode: `const lessons = ctx.school.getTodayLessons();
const exams = ctx.school.getTodayExams();
const pendingTasks = ctx.tasks.getPending();

let body = \`Plan na dziś (\${ctx.time.dayName}): \${lessons.length} lekcji.\\n\`;
if (lessons.length > 0) {
  body += \`Pierwsza lekcja: \${lessons[0].subject} o \${lessons[0].timeRange} w sali \${lessons[0].classroom}.\\n\`;
}
if (exams.length > 0) {
  body += \`UWAGA SPRAWDZIANY: \${exams.map(e => e.title).join(', ')}!\\n\`;
} else {
  body += \`Brak zaplanowanych kartkówek na dziś.\\n\`;
}
body += \`Do zrobienia: \${pendingTasks.length} zadań.\`;

await ctx.pushbullet.send(\`Poranny Briefing :: \${ctx.time.dayName}\`, body, 'HIGH');
ctx.log('Wysłano poranny briefing pomyślnie.');`
  },
  {
    id: 'template_habit_reminder',
    name: 'Wieczorny Strażnik Nawyków (20:30)',
    description: 'Przypomina o niezrealizowanych nawykach i chroni serie (streaks) przed przerwaniem przed końcem doby.',
    category: 'HEALTH',
    defaultTriggerType: 'cron',
    defaultCron: '30 20 * * *',
    sampleCode: `const incomplete = ctx.habits.getIncomplete();
if (incomplete.length === 0) {
  ctx.log('Wszystkie nawyki na dzisiaj zostały zaliczone! Brak potrzeby wysyłania alertu.');
  return;
}

const list = incomplete.map(h => \`• \${h.title} (seria: \${h.streakDays} dni)\`).join('\\n');
const title = \`Nawyki Dnia: Pozostało \${incomplete.length} do zaliczenia\`;
const body = \`Nie przerywaj serii! Niezaliczone nawyki na dziś:\\n\${list}\`;

await ctx.pushbullet.send(title, body, 'NORMAL');
ctx.log(\`Wysłano przypomnienie o \${incomplete.length} nawykach.\`);`
  },
  {
    id: 'template_custom_script',
    name: 'Własny Skrypt Automatyzacji i Logiki',
    description: 'Dowolny skrypt JavaScript z pełnym dostępem do czasu, szkoły, Pushbullet, zadań i nawyków.',
    category: 'CUSTOM',
    defaultTriggerType: 'interval',
    sampleCode: `// Kontekst posiada ctx.time, ctx.school, ctx.pushbullet, ctx.tasks, ctx.habits
ctx.log(\`Uruchomiono o \${ctx.time.formattedTime} (\${ctx.time.dayName}).\`);
const current = ctx.school.getCurrentLesson();
const next = ctx.school.getNextLesson();

if (current) {
  ctx.log(\`Trwa lekcja: \${current.subject} w sali \${current.classroom}\`);
}
if (next) {
  ctx.log(\`Kolejna lekcja: \${next.subject} w sali \${next.classroom}\`);
}`
  }
];
