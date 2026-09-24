import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  computeGradeStats, 
  parseGradeInfo, 
  parseGradeNumeric 
} from '../modules/services/librusService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Librus Synergia Golden Dataset & Mathematical Rigor', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/librus/grades_golden.json');
  const goldenRaw = fs.readFileSync(fixturePath, 'utf8');
  const goldenData = JSON.parse(goldenRaw);

  it('powinien poprawnie wczytać wzorcowy zestaw danych (Golden Dataset)', () => {
    expect(goldenData.subjects).toBeDefined();
    expect(goldenData.subjects.length).toBe(4);
    expect(goldenData.expectedMetrics).toBeDefined();
  });

  it('powinien precyzyjnie obliczyć statystyki dla zestawu wzorcowego', () => {
    const stats = computeGradeStats(goldenData.subjects);

    // Weryfikacja liczby przedmiotów
    expect(stats.totalSubjects).toBe(goldenData.expectedMetrics.totalSubjects);
    expect(stats.gradedSubjectsCount).toBe(goldenData.expectedMetrics.gradedSubjectsCount);

    // Weryfikacja średniej ogólnej
    expect(stats.overallAverage).toBe(goldenData.expectedMetrics.overallAverage);

    // Weryfikacja przedmiotu z najwyższą średnią
    expect(stats.highestAverage.subject).toBe(goldenData.expectedMetrics.highestAverage.subject);
    expect(stats.highestAverage.average).toBe(goldenData.expectedMetrics.highestAverage.average);

    // Weryfikacja przedmiotu z najniższą średnią
    expect(stats.lowestAverage.subject).toBe(goldenData.expectedMetrics.lowestAverage.subject);
    expect(stats.lowestAverage.average).toBe(goldenData.expectedMetrics.lowestAverage.average);
  });

  it('powinien bezwzględnie ignorować ocenę o wadze 0 w średniej ważonej (eliminacja defektu || 1)', () => {
    const stats = computeGradeStats(goldenData.subjects);
    const math = stats.subjects.find(s => s.name.toLowerCase() === 'matematyka');
    
    expect(math).toBeDefined();
    // Matematyka: ocena 5 (waga 2) + ocena 4 (waga 1) + ocena 6 (waga 0) + ocena "np"
    // Prawidłowy wynik: (5*2 + 4*1) / (2 + 1) = 14 / 3 = 4.67
    // Błędny wynik (gdy waga 0 zafałszowana do 1): (5*2 + 4*1 + 6*1) / 4 = 20 / 4 = 5.00
    expect(math.computedAverage).toBe(4.67);
    expect(math.computedAverage).not.toBe(5.00);

    // Weryfikacja obecności oceny o wadze 0 na liście ocen
    const weightZeroGrade = math.sem1Grades.find(g => g.details?.weight === 0);
    expect(weightZeroGrade).toBeDefined();
    expect(weightZeroGrade.value).toBe('6');
    expect(weightZeroGrade.details.category).toBe('Diagnoza wstępna');
    expect(weightZeroGrade.details.weight).toBe(0);
  });

  it('powinien poprawnie przetwarzać modyfikatory plus i minus (+ / -)', () => {
    const stats = computeGradeStats(goldenData.subjects);
    const polish = stats.subjects.find(s => s.name.toLowerCase() === 'język polski');
    const info = stats.subjects.find(s => s.name.toLowerCase() === 'informatyka');

    // Informatyka: 5+ (waga 3) -> 5.5 * 3 / 3 = 5.50
    expect(info.computedAverage).toBe(5.50);

    // Polski: 4+ (waga 2) + 4- (waga 1) -> (4.5*2 + 3.75*1) / 3 = 12.75 / 3 = 4.25
    expect(polish.computedAverage).toBe(4.25);
  });

  it('powinien bezpiecznie traktować przedmioty z wyłącznie nieocenianymi wpisami (brak NaN / Infinity)', () => {
    const stats = computeGradeStats(goldenData.subjects);
    const wf = stats.subjects.find(s => s.name.toLowerCase() === 'wychowanie fizyczne');

    expect(wf).toBeDefined();
    expect(wf.computedAverage).toBe(0);
    expect(wf.sem1Grades).toHaveLength(2);
    expect(wf.sem1Grades[0].numericValue).toBeNull();
    expect(wf.sem1Grades[1].numericValue).toBeNull();
  });

  it('powinien zapewnić integralność i kompletność wszystkich ocen po enrichmencie', () => {
    const stats = computeGradeStats(goldenData.subjects);
    const math = stats.subjects.find(s => s.name.toLowerCase() === 'matematyka');

    expect(math.sem1Grades).toHaveLength(4);
    expect(math.sem1Grades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat-1',
          value: '5',
          numericValue: 5,
          details: expect.objectContaining({ weight: 2, inAverage: true })
        }),
        expect.objectContaining({
          id: 'mat-2',
          value: '4',
          numericValue: 4,
          details: expect.objectContaining({ weight: 1, inAverage: true })
        }),
        expect.objectContaining({
          id: 'mat-3',
          value: '6',
          numericValue: 6,
          details: expect.objectContaining({ weight: 0, inAverage: true })
        }),
        expect.objectContaining({
          id: 'mat-4',
          value: 'np',
          numericValue: null,
          details: expect.objectContaining({ inAverage: false })
        })
      ])
    );
  });
});
