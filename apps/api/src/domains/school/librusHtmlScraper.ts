import * as cheerio from 'cheerio';
import { parseSafeAverage, parseLibrusDate } from '../../db/store.js';

export interface ScrapedGradeDetail {
  id: string;
  value: number;
  displayValue: string;
  weight: number;
  category: string;
  color: string;
  textColor?: string;
  date?: string;
  teacher?: string;
  comment?: string;
  semester: 1 | 2;
  isImprovement?: boolean;
  improvedGradeId?: string;
  improvedValue?: string;
  inAverage?: boolean;
  isInsideBracket?: boolean;
  rawInfo?: string;
}

export interface ScrapedSubject {
  id: string;
  name: string;
  average: number;
  semester1Average?: number;
  semester2Average?: number;
  sem1Grades: ScrapedGradeDetail[];
  sem2Grades: ScrapedGradeDetail[];
  grades: ScrapedGradeDetail[];
}

function parseGradeValue(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const str = String(raw).trim();
  if (str === '+' || str === '-') return 0;
  if (str.endsWith('+')) {
    const base = parseFloat(str.slice(0, -1));
    return isNaN(base) ? 0 : base + 0.5;
  }
  if (str.endsWith('-')) {
    const base = parseFloat(str.slice(0, -1));
    return isNaN(base) ? 0 : Math.max(1, base - 0.25);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function getContrastingTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '').trim();
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#0f172a' : '#ffffff';
  }
  return '#0f172a';
}

function parseGradeBox($: cheerio.CheerioAPI, el: any, semester: 1 | 2, isInsideBracket = false): ScrapedGradeDetail {
  const $el = $(el);
  const link = $el.find('a').first();
  const rawStyle = $el.attr('style') || link.attr('style') || '';
  const bgMatch = rawStyle.match(/background-color:\s*([^;]+)/i);
  const colorMatch = rawStyle.match(/(?:^|;)\s*color:\s*([^;]+)/i);

  const color = bgMatch ? bgMatch[1].trim() : '#FFD700';
  const textColor = colorMatch ? colorMatch[1].trim() : getContrastingTextColor(color);

  const href = link.attr('href') || '';
  const idRaw = href.split('/').pop() || '';
  const rawTitle = link.attr('title') || '';
  const info = rawTitle.replace(/<\s*br\s*\/?\s*>/gi, '\n').trim();
  const displayVal = link.text().trim().replace(/\*+$/, '').trim();
  const numVal = parseGradeValue(displayVal);

  const catMatch = info.match(/Kategoria:\s*([^\n\r]+)/i);
  const dateMatch = info.match(/Data:\s*([^\n\r]+)/i);
  const tchMatch = info.match(/Nauczyciel:\s*([^\n\r]+)/i);
  const wMatch = info.match(/Waga:\s*(\d+)/i);
  const inAvgMatch = info.match(/Licz do średniej:\s*([^\n\r]+)/i);
  const comMatch = info.match(/Komentarz:\s*([^\n\r]+)/i);
  const imprMatch = info.match(/Poprawa oceny:\s*([0-9\+\-]+)/i) || info.match(/Poprawa oceny:\s*([^\n\r]+)/i);

  const weight = wMatch ? parseInt(wMatch[1], 10) : 1;
  const inAverage = inAvgMatch ? inAvgMatch[1].trim().toLowerCase() === 'tak' : (numVal > 0 && weight > 0);

  return {
    id: idRaw || `grade_${semester}_${Math.random().toString(36).substring(2, 9)}`,
    value: numVal,
    displayValue: displayVal,
    weight,
    category: catMatch ? catMatch[1].trim() : 'Inne',
    color,
    textColor,
    date: dateMatch ? parseLibrusDate(dateMatch[1].trim()) || dateMatch[1].trim() : undefined,
    teacher: tchMatch ? tchMatch[1].trim() : undefined,
    comment: comMatch ? comMatch[1].trim() : undefined,
    semester,
    isImprovement: Boolean(imprMatch),
    improvedValue: imprMatch ? imprMatch[1].trim() : undefined,
    inAverage,
    isInsideBracket,
    rawInfo: info
  };
}

function parseSemesterCell($: cheerio.CheerioAPI, td: cheerio.Cheerio<any>, semester: 1 | 2): ScrapedGradeDetail[] {
  const grades: ScrapedGradeDetail[] = [];
  const contents = td.contents();

  contents.each((_, node) => {
    if (node.type === 'tag') {
      const $node = $(node);
      if ($node.hasClass('grade-box')) {
        grades.push(parseGradeBox($, $node, semester, false));
      } else {
        const text = $node.text();
        const hasBracket = text.includes('[') || text.includes(']');
        const innerBoxes = $node.find('span.grade-box');
        if (innerBoxes.length > 0) {
          const bracketGroup: ScrapedGradeDetail[] = [];
          innerBoxes.each((_, box) => {
            const parsed = parseGradeBox($, $(box), semester, hasBracket);
            bracketGroup.push(parsed);
          });

          // Jeśli to para w klamrze [ pierwotna  poprawiona ]
          if (hasBracket && bracketGroup.length >= 2) {
            const first = bracketGroup[0];
            const second = bracketGroup[bracketGroup.length - 1];
            first.improvedGradeId = second.id;
            second.improvedGradeId = first.id;
            first.inAverage = false;
            second.isImprovement = true;
            if (!second.improvedValue) {
              second.improvedValue = first.displayValue;
            }
          }

          bracketGroup.forEach((g) => grades.push(g));
        }
      }
    }
  });

  return grades;
}

export function parseLibrusGradesHtml(html: string): ScrapedSubject[] {
  const $ = cheerio.load(html);
  const rows = $('table.decorated.stretch:eq(1) > tbody > tr[class^="line"]:not([name]), table.decorated.stretch:eq(1) > tr[class^="line"]:not([name])');

  const subjects: ScrapedSubject[] = [];

  rows.each((i, row) => {
    const tds = $(row).find('td');
    if (tds.length < 9) return;

    const rawName = $(tds[1]).text().trim();
    if (!rawName) return;

    // Normalizacja nazwy: pierwsza litera wielka
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const subId = `sub_${i}_${rawName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const sem1Grades = parseSemesterCell($, $(tds[2]), 1);
    const sem1Avg = parseSafeAverage($(tds[3]).text());

    const sem2Grades = parseSemesterCell($, $(tds[5]), 2);
    const sem2Avg = parseSafeAverage($(tds[6]).text());

    const rawYearAvg = parseSafeAverage($(tds[8]).text());

    // Oblicz średnią ważoną jeśli brak bezpośredniej
    let weightedSum = 0;
    let weightTotal = 0;
    for (const sg of sem1Grades) {
      if (sg.inAverage !== false && sg.weight > 0 && sg.value > 0) {
        weightedSum += sg.value * sg.weight;
        weightTotal += sg.weight;
      }
    }
    const computedSem1Avg = weightTotal > 0 ? Number((weightedSum / weightTotal).toFixed(2)) : undefined;

    const finalSem1Avg = sem1Avg !== undefined ? sem1Avg : computedSem1Avg;
    const finalYearAvg = rawYearAvg !== undefined ? rawYearAvg : (finalSem1Avg !== undefined ? finalSem1Avg : 0);

    const allGrades = [...sem1Grades, ...sem2Grades];

    subjects.push({
      id: subId,
      name,
      average: finalYearAvg,
      semester1Average: finalSem1Avg,
      semester2Average: sem2Avg,
      sem1Grades,
      sem2Grades,
      grades: allGrades
    });
  });

  return subjects;
}
