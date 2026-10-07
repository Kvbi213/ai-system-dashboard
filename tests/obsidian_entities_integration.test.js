import { describe, it, expect, beforeAll } from 'vitest';
import { executeQuery, initDB } from '../modules/database.js';
import {
  STARTER_TREE_DATA,
  STARTER_STATS,
  FALLBACK_NODES,
  FALLBACK_RELATIONS,
  DOMAIN_MODULES_CONFIG
} from '../modules/data/obsidianEntitiesData.js';
import { importObsidianVault } from '../scripts/import_obsidian_entities.js';

describe('Obsidian Vault & 10-Domain Modules Integration Suite (v2.32.0)', () => {
  beforeAll(async () => {
    await initDB();
  });

  describe('1. Weryfikacja Pakietu Danych Startowych i Konfiguracji Modułów', () => {
    it('powinien zawierać kompletną listę 10 modułów dziedzinowych', () => {
      expect(DOMAIN_MODULES_CONFIG).toHaveLength(10);
      const keys = DOMAIN_MODULES_CONFIG.map(m => m.key);
      expect(keys).toContain('metryka');
      expect(keys).toContain('charakter');
      expect(keys).toContain('sociale');
      expect(keys).toContain('zdrowie');
      expect(keys).toContain('finanse');
      expect(keys).toContain('zainteresowania');
      expect(keys).toContain('rutyna');
      expect(keys).toContain('relacja');
      expect(keys).toContain('siec_relacji');
      expect(keys).toContain('zaufanie_i_ryzyka');
    });

    it('powinien udostępniać kompletne drzewo startowe z 6 osobami i zasobami', () => {
      expect(STARTER_TREE_DATA).toHaveLength(1);
      const polska = STARTER_TREE_DATA[0];
      expect(polska.name).toBe('Polska');
      expect(polska.type).toBe('COUNTRY');

      const pomorskie = polska.children[0];
      expect(pomorskie.name).toBe('Województwo Pomorskie');

      const starogard = pomorskie.children[0];
      expect(starogard.name).toBe('Starogard Gdański');

      // Węzły potomne: Flat 120m² oraz ZSE
      const flat = starogard.children.find(c => c.id === 'node-flat-120');
      const zse = starogard.children.find(c => c.id === 'node-zse');
      expect(flat).toBeDefined();
      expect(zse).toBeDefined();

      // Mieszkańcy Core we Flat 120m²
      expect(flat.children.some(p => p.id === 'node-jakub')).toBe(true);
      expect(flat.children.some(p => p.id === 'node-wiki')).toBe(true);

      // Osoby powiązane z ZSE
      expect(zse.children.some(p => p.id === 'node-damian')).toBe(true);
      expect(zse.children.some(p => p.id === 'node-gordon')).toBe(true);
      expect(zse.children.some(p => p.id === 'node-kedzier')).toBe(true);
      expect(zse.children.some(p => p.id === 'node-maciej')).toBe(true);
    });

    it('powinien posiadać zdefiniowane węzły fallback z 10 modułami dla każdego profilu', () => {
      const requiredPeople = [
        'node-jakub', 'node-wiki', 'node-damian',
        'node-gordon', 'node-kedzier', 'node-maciej'
      ];

      for (const id of requiredPeople) {
        const p = FALLBACK_NODES[id];
        expect(p).toBeDefined();
        expect(p.attributes).toBeDefined();
        expect(p.attributes.housing_status).toBeDefined();
        expect(p.attributes.modules).toBeDefined();

        // Każdy profil posiada 10 zmapowanych modułów
        const modKeys = Object.keys(p.attributes.modules);
        expect(modKeys.length).toBe(10);
      }
    });

    it('powinien zawierać receptury Lis Craft Mixology w profilu Jakuba', () => {
      const jakub = FALLBACK_NODES['node-jakub'];
      expect(jakub.attributes.mixology_brand).toBe('Lis Craft Mixology');
      expect(jakub.attributes.mixology_recipes.length).toBeGreaterThanOrEqual(4);

      const drinks = jakub.attributes.mixology_recipes.map(d => d.name);
      expect(drinks.some(d => d.includes('Apple LamberJACK'))).toBe(true);
      expect(drinks.some(d => d.includes('Acid Tequila'))).toBe(true);
    });
  });

  describe('2. Import ze Skarbca Obsidian do SQLite', () => {
    it('powinien pomyślnie wykonać importObsidianVault i zapisać dane w bazie SQLite', async () => {
      const result = await importObsidianVault();
      expect(result).toBeDefined();
      expect(result.tree).toHaveLength(1);
      expect(result.stats.total).toBe(11);
      expect(result.stats.PERSON).toBe(6);

      // Weryfikacja bazy SQLite
      const entities = await executeQuery('SELECT id, name, type FROM entities');
      expect(entities.length).toBe(11);

      const relations = await executeQuery('SELECT * FROM entity_relations');
      expect(relations.length).toBe(15);

      // Relacja Jakub <-> Wiki
      const coreRel = relations.find(r => r.source_id === 'node-jakub' && r.target_id === 'node-wiki');
      expect(coreRel).toBeDefined();
      expect(coreRel.relation_type).toBe('PARTNER_OF');

      // Relacja Jakub -> ZSE
      const zseRel = relations.find(r => r.source_id === 'node-jakub' && r.target_id === 'node-zse');
      expect(zseRel).toBeDefined();
      expect(zseRel.relation_type).toBe('STUDENT_OF');
    });
  });
});
