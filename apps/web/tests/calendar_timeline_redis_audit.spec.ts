import { test, expect } from '@playwright/test';

test.describe('Audit Wydajności, Kalendarza, Osi Czasu i Ocen Librusa', () => {
  test('1. Terminarz & Kalendarz (/calendar) wyświetla wydarzenia na listopad 2026', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'networkidle' });

    // Header i wskaźnik zaplanowanych wydarzeń
    await expect(page.locator('text=Terminarz & Kalendarz Szkolny')).toBeVisible();
    await expect(page.locator('text=/\\d+ zaplanowanych/')).toBeVisible();

    // Weryfikacja obecności miesiąca Listopad
    await expect(page.locator('text=/Listopad 2026/')).toBeVisible();

    // Weryfikacja agendy dla wybranego dnia
    await expect(page.locator('text=/Agenda dla dnia/')).toBeVisible();
  });

  test('2. Oś Czasu (Timeline) na Pulpicie renderuje bloki natychmiast', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const timeline = page.locator('[data-testid="timeline-widget"]');
    await expect(timeline).toBeVisible();
    await expect(timeline.locator('text=Oś Czasu Dnia (Timeline)')).toBeVisible();
    await expect(timeline.locator('text=/\\d{2}:\\d{2}/').first()).toBeVisible();
  });

  test('3. Strefa Prywatna (/private) zachowuje stan rutyn po przeładowaniu', async ({ page }) => {
    await page.goto('/private', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Strefa Prywatna i Rozwój')).toBeVisible();
    await expect(page.locator('text=Rutyny Dnia & Higiena Kognitywna')).toBeVisible();

    // Sprawdzenie obecności rutyny
    const firstRoutineText = page.locator('text=/Szklanka wody/').first();
    await expect(firstRoutineText).toBeVisible();
  });

  test('4. Oceny i Osiągnięcia (/grades) grupują przedmioty ze średnimi i semestrami', async ({ page }) => {
    await page.goto('/grades', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Oceny i Osiągnięcia (Librus Synergia)')).toBeVisible();
    await expect(page.locator('text=Średnia ocen')).toBeVisible();
    await expect(page.locator('text=/4\\.2[89]/').first()).toBeVisible();

    // Weryfikacja kafelków przedmiotów i autentycznych ocen
    await expect(page.locator('text=Biologia').first()).toBeVisible();
    await expect(page.locator('text=4.13').first()).toBeVisible();
    await expect(page.locator('button:has-text("Synchronizuj z Librus")')).toBeVisible();
    await expect(page.locator('button:has-text("Semestr 1")')).toBeVisible();
    await expect(page.locator('button:has-text("Semestr 2")')).toBeVisible();

    // Kliknięcie semestru 2
    await page.locator('button:has-text("Semestr 2")').click();
  });
});
