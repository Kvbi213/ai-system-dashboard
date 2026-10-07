import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { initDB, executeRun } from '../modules/database.js';
import {
  slugify,
  calculateTreePath,
  createEntity,
  updateEntity,
  deleteEntity,
  getEntityById,
  getDescendants,
  getEntityTree,
  createRelation,
  getRelationsForEntity,
  countEntitiesByType,
  formatTreeAscii
} from '../modules/services/entitiesService.js';

describe('FAZA 1: Entities & Intelligence Tree Model (SQLite WAL)', () => {
  beforeAll(async () => {
    await initDB();
  });

  beforeEach(async () => {
    await executeRun('DELETE FROM entity_relations');
    await executeRun('DELETE FROM entities');
  });

  describe('1. Normalizacja ścieżek i slugów (slugify & calculateTreePath)', () => {
    it('prawidłowo konwertuje polskie znaki diakrytyczne i spacje', () => {
      expect(slugify('Polska')).toBe('polska');
      expect(slugify('Województwo Pomorskie')).toBe('wojewodztwo_pomorskie');
      expect(slugify('Starogard Gdański')).toBe('starogard_gdanski');
      expect(slugify('ZSE im. Noblistów Polskich')).toBe('zse_im_noblistow_polskich');
      expect(slugify('Żółć & Gęślą Jaźń')).toBe('zolc_gesla_jazn');
    });

    it('tworzy prawidłową ścieżkę root (/kraj/) dla węzła bez rodzica', async () => {
      const path = await calculateTreePath(null, 'Polska');
      expect(path).toBe('/polska/');
    });
  });

  describe('2. Budowanie hierarchii drzewiastej (createEntity & getEntityTree)', () => {
    it('tworzy wielopoziomowe drzewo pochodzenia (Kraj -> Województwo -> Miasto -> Szkoła -> Osoba)', async () => {
      // 1. Kraj
      const country = await createEntity({
        name: 'Polska',
        type: 'COUNTRY',
        attributes: { code: 'PL' }
      });
      expect(country.tree_path).toBe('/polska/');

      // 2. Region / Województwo
      const region = await createEntity({
        parent_id: country.id,
        name: 'Województwo Pomorskie',
        type: 'REGION'
      });
      expect(region.tree_path).toBe('/polska/wojewodztwo_pomorskie/');

      // 3. Miasto
      const city = await createEntity({
        parent_id: region.id,
        name: 'Starogard Gdański',
        type: 'CITY'
      });
      expect(city.tree_path).toBe('/polska/wojewodztwo_pomorskie/starogard_gdanski/');

      // 4. Organizacja / Szkoła
      const org = await createEntity({
        parent_id: city.id,
        name: 'ZSE im. Noblistów Polskich',
        type: 'ORGANIZATION'
      });
      expect(org.tree_path).toBe('/polska/wojewodztwo_pomorskie/starogard_gdanski/zse_im_noblistow_polskich/');

      // 5. Osoby
      const person1 = await createEntity({
        parent_id: org.id,
        name: 'Jakub Lis',
        type: 'PERSON',
        attributes: { role: 'Lead Dev / Technik Informatyk' }
      });
      expect(person1.tree_path).toBe('/polska/wojewodztwo_pomorskie/starogard_gdanski/zse_im_noblistow_polskich/jakub_lis/');

      const person2 = await createEntity({
        parent_id: org.id,
        name: 'Damian',
        type: 'PERSON',
        attributes: { role: 'Gamer / Modder' }
      });
      expect(person2.tree_path).toBe('/polska/wojewodztwo_pomorskie/starogard_gdanski/zse_im_noblistow_polskich/damian/');

      // Pobranie zagnieżdżonego drzewa
      const tree = await getEntityTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Polska');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].name).toBe('Województwo Pomorskie');
      expect(tree[0].children[0].children[0].name).toBe('Starogard Gdański');
      expect(tree[0].children[0].children[0].children[0].name).toBe('ZSE im. Noblistów Polskich');
      expect(tree[0].children[0].children[0].children[0].children).toHaveLength(2);

      // Zliczenie podmiotów
      const counts = countEntitiesByType(tree);
      expect(counts.COUNTRY).toBe(1);
      expect(counts.REGION).toBe(1);
      expect(counts.CITY).toBe(1);
      expect(counts.ORGANIZATION).toBe(1);
      expect(counts.PERSON).toBe(2);
      expect(counts.total).toBe(6);
    });

    it('odrzuca nieprawidłowy typ podmiotu', async () => {
      await expect(
        createEntity({ name: 'Nieznany', type: 'INVALID_TYPE' })
      ).rejects.toThrow('Nieprawidłowy typ podmiotu');
    });
  });

  describe('3. Relacje sieciowe (createRelation & getRelationsForEntity)', () => {
    it('tworzy i poprawnie zwraca relację sieciową między węzłami', async () => {
      const org = await createEntity({ name: 'ZSE', type: 'ORGANIZATION' });
      const person = await createEntity({ name: 'Jakub Lis', type: 'PERSON' });

      const rel = await createRelation({
        source_id: person.id,
        target_id: org.id,
        relation_type: 'STUDENT_OF',
        metadata: { class: '4Tc', field: 'Informatyka' }
      });

      expect(rel.id).toBeDefined();
      expect(rel.relation_type).toBe('STUDENT_OF');

      const relations = await getRelationsForEntity(person.id);
      expect(relations).toHaveLength(1);
      expect(relations[0].target_name).toBe('ZSE');
      expect(relations[0].metadata.class).toBe('4Tc');
    });
  });

  describe('4. Kaskadowa aktualizacja i usuwanie', () => {
    it('kaskadowo aktualizuje ścieżki potomków po zmianie nazwy węzła nadrzędnego', async () => {
      const country = await createEntity({ name: 'Polska', type: 'COUNTRY' });
      const city = await createEntity({ parent_id: country.id, name: 'Gdańsk', type: 'CITY' });
      const person = await createEntity({ parent_id: city.id, name: 'Jan', type: 'PERSON' });

      expect(person.tree_path).toBe('/polska/gdansk/jan/');

      // Zmiana nazwy miasta
      await updateEntity(city.id, { name: 'Miasto Gdańsk' });

      const updatedPerson = await getEntityById(person.id);
      expect(updatedPerson.tree_path).toBe('/polska/miasto_gdansk/jan/');
    });

    it('usuwa węzeł kaskadowo wraz ze wszystkimi potomkami', async () => {
      const country = await createEntity({ name: 'Polska', type: 'COUNTRY' });
      const city = await createEntity({ parent_id: country.id, name: 'Warszawa', type: 'CITY' });
      await createEntity({ parent_id: city.id, name: 'Osoba 1', type: 'PERSON' });

      const delResult = await deleteEntity(city.id, { cascade: true });
      expect(delResult.deleted).toBe(2);

      const descendants = await getDescendants(country.id);
      expect(descendants).toHaveLength(0);
    });
  });

  describe('5. Formatowanie drzewa ASCII (formatTreeAscii)', () => {
    it('generuje estetyczny podgląd tekstowy drzewa dla terminala', async () => {
      const country = await createEntity({ name: 'Polska', type: 'COUNTRY' });
      const city = await createEntity({ parent_id: country.id, name: 'Starogard Gdański', type: 'CITY' });
      await createEntity({
        parent_id: city.id,
        name: 'Jakub Lis',
        type: 'PERSON',
        attributes: { role: 'Lead Dev' }
      });

      const ascii = await formatTreeAscii();
      expect(ascii).toContain('OMNIDASH :: ENTITY TREE EXPLORER');
      expect(ascii).toContain('[ROOT]');
      expect(ascii).toContain('[COUNTRY] Polska');
      expect(ascii).toContain('[CITY] Starogard Gdański');
      expect(ascii).toContain('[PERSON] Jakub Lis [Lead Dev]');
      expect(ascii).toContain('Suma podmiotów w gałęzi');
    });
  });
});
