import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { DatabaseStore } from '../src/db/store.js';

describe('DatabaseStore Persistence & Librus Ground Truth', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `test_store_${Date.now()}_${Math.random().toString(36).substring(2)}.json`);
    process.env.STORE_PERSISTENCE_PATH = tmpFile;
  });

  afterEach(() => {
    delete process.env.STORE_PERSISTENCE_PATH;
    if (fs.existsSync(tmpFile)) {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // ignore
      }
    }
  });

  it('ładuje i parsuje przedmioty oraz oceny ze snapshotu librusGroundTruth', () => {
    const store = new DatabaseStore();
    const subjects = store.getSubjectsWithGrades();

    expect(subjects.length).toBe(21);
    const biologia = subjects.find((s) => s.name === 'Biologia');
    expect(biologia).toBeDefined();
    expect(biologia?.grades.length).toBe(4);
    expect(biologia?.average).toBe(4.13);

    // Sprawdzenie poprawy oceny w Biologii
    const bioImprovement = biologia?.grades.find((g) => g.isImprovement);
    expect(bioImprovement).toBeDefined();
    expect(bioImprovement?.displayValue).toBe('5');
    expect(bioImprovement?.improvedValue).toBe('3');
    expect(bioImprovement?.improvedGradeId).toBeDefined();

    // Sprawdzenie GPA i szczęśliwego numerka
    expect(store.calculateGpa()).toBe(4.28);
    expect(store.getLuckyNumber()).toBe(3);
  });

  it('ładuje wydarzenia z Ground Truth oraz wydarzenia na listopad 2026', () => {
    const store = new DatabaseStore();
    const events = store.getEvents();

    expect(events.length).toBeGreaterThan(10);
    const novEvents = events.filter((e) => e.date.startsWith('2026-11'));
    expect(novEvents.length).toBeGreaterThanOrEqual(5);

    // Sprawdzenie czy istnieje dzisiejsze wydarzenie
    const today = events.find((e) => e.date === '2026-11-04');
    expect(today).toBeDefined();
  });

  it('utrwala mutacje rutyn i celów na dysku po restarcie instancji', () => {
    const store1 = new DatabaseStore();
    const newRoutine = store1.addRoutine({
      title: 'Nowa rutyna testowa persystencji',
      detail: 'Utrwalenie na dysku',
      timeOfDay: 'morning'
    });
    expect(newRoutine.id).toBeDefined();

    // Utwórz nową instancję symulującą restart API Gateway
    const store2 = new DatabaseStore();
    const routines2 = store2.getRoutines();
    const found = routines2.find((r) => r.title === 'Nowa rutyna testowa persystencji');

    expect(found).toBeDefined();
    expect(found?.id).toBe(newRoutine.id);
  });

  it('utrwala dodanie i usunięcie wydarzenia kalendarzowego', () => {
    const store1 = new DatabaseStore();
    const event = store1.addSchoolEvent({
      title: 'Spotkanie projektowe architektury v4',
      date: '2026-11-15',
      category: 'Wydarzenie osobiste',
      type: 'inne',
      description: 'Test persystencji kalendarza'
    });

    const store2 = new DatabaseStore();
    const found = store2.getEvents().find((e) => e.id === event.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Spotkanie projektowe architektury v4');

    // Usunięcie
    store2.deleteSchoolEvent(event.id);
    const store3 = new DatabaseStore();
    const notFound = store3.getEvents().find((e) => e.id === event.id);
    expect(notFound).toBeUndefined();
  });
});
