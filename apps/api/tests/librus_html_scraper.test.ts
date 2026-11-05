import { describe, it, expect } from 'vitest';
import { parseLibrusGradesHtml } from '../src/domains/school/librusHtmlScraper.js';

describe('parseLibrusGradesHtml', () => {
  const sampleHtml = `
    <table class="decorated stretch"></table>
    <table class="decorated stretch">
      <thead>
        <tr><th>Nr</th><th>Przedmiot</th><th>Oceny</th><th>Śr. I</th><th>I</th><th>Oceny</th><th>Śr. II</th><th>II</th><th>Śr. R</th><th>R</th></tr>
      </thead>
      <tbody>
        <tr class="line0">
          <td>1</td>
          <td>biologia</td>
          <td>
            <span class="grade-box" style="background-color:#FFD700;">
              <a title="Kategoria: odpowiedź ustna<br>Data: 2026-10-01<br>Waga: 1<br>Licz do średniej: tak" href="/przegladaj_oceny/szczegoly/101">4+</a>
            </span>
            <span>
              [
              <span class="grade-box" style="background-color:#7CFC00;">
                <a title="Kategoria: Praca klasowa<br>Data: 2026-10-21<br>Waga: 3<br>Licz do średniej: tak" href="/przegladaj_oceny/szczegoly/102">3</a>
              </span>
              <span class="grade-box" style="background-color:#7CFC00;">
                <a title="Kategoria: Praca klasowa<br>Data: 2026-10-28<br>Waga: 3<br>Licz do średniej: tak<br>Poprawa oceny: 3" href="/przegladaj_oceny/szczegoly/103">5</a>
              </span>
              ]
            </span>
          </td>
          <td>4.13</td>
          <td>-</td>
          <td>Brak ocen</td>
          <td>-</td>
          <td>-</td>
          <td>4.13</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  `;

  it('poprawnie parsuje przedmiot, oceny, kolory hex i klamrę poprawkową', () => {
    const subjects = parseLibrusGradesHtml(sampleHtml);
    expect(subjects).toHaveLength(1);

    const bio = subjects[0];
    expect(bio.name).toBe('Biologia');
    expect(bio.semester1Average).toBe(4.13);
    expect(bio.average).toBe(4.13);
    expect(bio.sem1Grades).toHaveLength(3);

    const g1 = bio.sem1Grades[0];
    expect(g1.displayValue).toBe('4+');
    expect(g1.color).toBe('#FFD700');
    expect(g1.textColor).toBe('#0f172a');
    expect(g1.isInsideBracket).toBe(false);

    const g2 = bio.sem1Grades[1];
    expect(g2.displayValue).toBe('3');
    expect(g2.color).toBe('#7CFC00');
    expect(g2.isInsideBracket).toBe(true);
    expect(g2.inAverage).toBe(false); // Poprawiona ocena nie liczy się do średniej
    expect(g2.improvedGradeId).toBe('103');

    const g3 = bio.sem1Grades[2];
    expect(g3.displayValue).toBe('5');
    expect(g3.color).toBe('#7CFC00');
    expect(g3.isInsideBracket).toBe(true);
    expect(g3.isImprovement).toBe(true);
    expect(g3.improvedGradeId).toBe('102');
  });
});
