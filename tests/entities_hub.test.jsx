import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import {
  initDB,
  getDB
} from '../modules/database.js';
import {
  createEntity,
  getEntityTree,
  countEntitiesByType,
  resolveLocationHierarchy,
  ensureLocationHierarchy,
  formatTreeAscii
} from '../modules/services/entitiesService.js';
import EntityTreeView from '../modules/components/EntityTreeView.jsx';
import EntityDetailsModal from '../modules/components/EntityDetailsModal.jsx';
import {
  getDeletedEntityIds,
  markEntityDeleted,
  resetClientEntityStore,
  filterTreeWithClientState,
  isHtmlOrOfflineError
} from '../modules/services/clientEntityStore.js';

vi.mock('axios');

describe('FAZA 4 & Integracja: Entities & Intelligence OSINT Hub Suite', () => {

  beforeEach(async () => {
    await initDB();
    const db = getDB();
    await new Promise((resolve) => {
      db.serialize(() => {
        db.run('DELETE FROM entity_relations');
        db.run('DELETE FROM entities', () => resolve());
      });
    });
  });

  describe('1. Geocoding & Location Hierarchy Chaining', () => {
    it('should resolve Starogard Gdanski to Pomorskie and Polska', () => {
      const hierarchy = resolveLocationHierarchy('Starogard Gdański');
      expect(hierarchy.country).toBe('Polska');
      expect(hierarchy.region).toBe('Województwo Pomorskie');
      expect(hierarchy.city).toBe('Starogard Gdański');
    });

    it('should resolve Warszawa to Mazowieckie and Polska', () => {
      const hierarchy = resolveLocationHierarchy('Warszawa');
      expect(hierarchy.country).toBe('Polska');
      expect(hierarchy.region).toBe('Województwo Mazowieckie');
      expect(hierarchy.city).toBe('Warszawa');
    });

    it('should automatically construct Country -> Region -> City nodes via ensureLocationHierarchy', async () => {
      const cityNode = await ensureLocationHierarchy('Starogard Gdański');
      expect(cityNode).toBeDefined();
      expect(cityNode.type).toBe('CITY');
      expect(cityNode.name).toBe('Starogard Gdański');
      expect(cityNode.tree_path).toContain('/polska/wojewodztwo_pomorskie/starogard_gdanski/');

      // Verify that calling ensureLocationHierarchy again reuses the existing node without duplicates
      const cityNodeSecondCall = await ensureLocationHierarchy('Starogard Gdański');
      expect(cityNodeSecondCall.id).toBe(cityNode.id);

      const tree = await getEntityTree();
      expect(tree).toHaveLength(1); // One Country root
      expect(tree[0].name).toBe('Polska');
      expect(tree[0].children[0].name).toBe('Województwo Pomorskie');
      expect(tree[0].children[0].children[0].name).toBe('Starogard Gdański');
    });
  });

  describe('2. Statistics & Entity Aggregation', () => {
    it('should calculate breakdown statistics across hierarchy', async () => {
      const city = await ensureLocationHierarchy('Gdańsk');
      await createEntity({
        name: 'Uniwersytet Gdański',
        type: 'ORGANIZATION',
        parent_id: city.id
      });
      await createEntity({
        name: 'Jan Kowalski',
        type: 'PERSON',
        parent_id: city.id
      });

      const tree = await getEntityTree();
      const stats = countEntitiesByType(tree);

      expect(stats.total).toBe(5); // Polska, Pomorskie, Gdańsk, Uniwersytet Gdański, Jan Kowalski
      expect(stats.byType.COUNTRY).toBe(1);
      expect(stats.byType.REGION).toBe(1);
      expect(stats.byType.CITY).toBe(1);
      expect(stats.byType.ORGANIZATION).toBe(1);
      expect(stats.byType.PERSON).toBe(1);
    });
  });

  describe('3. UI Component Rendering: EntityTreeView & EntityDetailsModal', () => {
    it('should render EntityTreeView with tabs and tree nodes', async () => {
      const mockTree = [
        {
          id: 'country-polska',
          name: 'Polska',
          type: 'COUNTRY',
          tree_path: '/polska/',
          children: [
            {
              id: 'region-pomorskie',
              name: 'Województwo Pomorskie',
              type: 'REGION',
              tree_path: '/polska/wojewodztwo-pomorskie/',
              children: [
                {
                  id: 'person-jakub',
                  name: 'Jakub Lis',
                  type: 'PERSON',
                  tree_path: '/polska/wojewodztwo-pomorskie/jakub-lis/',
                  attributes: { role: 'Lead Dev' },
                  children: []
                }
              ]
            }
          ]
        }
      ];

      const mockStats = {
        total: 3,
        byType: { COUNTRY: 1, REGION: 1, CITY: 0, ORGANIZATION: 0, PERSON: 1 }
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/entities/tree')) {
          return Promise.resolve({ data: { success: true, tree: mockTree } });
        }
        if (url.includes('/api/entities/stats')) {
          return Promise.resolve({ data: { success: true, stats: mockStats } });
        }
        if (url.includes('/api/entities/ascii')) {
          return Promise.resolve({ data: '=== OMNIDASH :: ENTITY TREE EXPLORER ===' });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      render(<EntityTreeView />);

      // Sprawdź czy zakładki i statystyki zostały wyrenderowane
      expect(screen.getByText('[>] DRZEWO HIERARCHII')).toBeDefined();
      expect(screen.getByText('[>] TERMINAL ASCII')).toBeDefined();
      expect(screen.getByText('[>] STRUKTURA JSON')).toBeDefined();

      // Czekaj na załadowanie węzłów drzewa
      await waitFor(() => {
        expect(screen.getByText('Polska')).toBeDefined();
        expect(screen.getByText('Województwo Pomorskie')).toBeDefined();
        expect(screen.getByText('Jakub Lis')).toBeDefined();
        expect(screen.getByText('[Lead Dev]')).toBeDefined();
      });

      // Przełącz na terminal ASCII
      fireEvent.click(screen.getByText('[>] TERMINAL ASCII'));
      expect(screen.getByText(/PODGLĄD KONSOLI SYSTEMOWEJ/)).toBeDefined();
    });

    it('should render EntityDetailsModal and display relations', async () => {
      const mockEntity = {
        id: 'node-jakub',
        name: 'Jakub Lis',
        type: 'PERSON',
        parent_id: 'org-zse',
        tree_path: '/polska/pomorskie/zse/jakub-lis/',
        attributes: { role: 'Lead Dev', specialization: 'AI / FullStack' },
        created_at: '2026-10-07 14:00:00'
      };

      const mockRelations = [
        {
          id: 'rel-1',
          source_id: 'node-jakub',
          target_id: 'org-zse',
          target_name: 'ZSE im. Noblistów Polskich',
          target_type: 'ORGANIZATION',
          relation_type: 'STUDENT_OF',
          metadata: { note: 'Technik Informatyk' }
        }
      ];

      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          entity: mockEntity,
          relations: mockRelations
        }
      });

      render(
        <EntityDetailsModal
          entityId="node-jakub"
          onClose={() => {}}
          onEntityUpdated={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jakub Lis')).toBeDefined();
        expect(screen.getAllByText('/polska/pomorskie/zse/jakub-lis/').length).toBeGreaterThan(0);
        expect(screen.getByText('AI / FullStack')).toBeDefined();
        expect(screen.getByText('[→ STUDENT_OF]')).toBeDefined();
        expect(screen.getByText('ZSE im. Noblistów Polskich')).toBeDefined();
      });
    });
  });

  describe('4. Cloud Resilience & HTML Rewrite Interception', () => {
    beforeEach(() => {
      resetClientEntityStore();
    });

    it('should correctly classify HTML and offline errors', () => {
      const htmlErr = new Error('Endpoint /api/entities/node-damian?cascade=true zwrócił HTML');
      expect(isHtmlOrOfflineError(htmlErr)).toBe(true);

      const netErr = new Error('Network Error');
      expect(isHtmlOrOfflineError(netErr)).toBe(true);

      const status404 = { response: { status: 404 } };
      expect(isHtmlOrOfflineError(status404)).toBe(true);
    });

    it('should filter deleted entities and their descendants from tree', () => {
      const sampleTree = [
        {
          id: 'root-1',
          name: 'Polska',
          type: 'COUNTRY',
          children: [
            {
              id: 'node-damian',
              name: 'Damian',
              type: 'PERSON',
              children: [
                { id: 'sub-asset-1', name: 'Zasób Damiana', type: 'ASSET', children: [] }
              ]
            },
            {
              id: 'node-jakub',
              name: 'Jakub Lis',
              type: 'PERSON',
              children: []
            }
          ]
        }
      ];

      markEntityDeleted('node-damian', true, sampleTree);
      const filtered = filterTreeWithClientState(sampleTree);

      expect(filtered[0].children.find(c => c.id === 'node-damian')).toBeUndefined();
      expect(filtered[0].children.find(c => c.id === 'node-jakub')).toBeDefined();
    });

    it('should delete entity smoothly when backend returns HTML error', async () => {
      const mockEntity = {
        id: 'node-damian',
        name: 'Damian',
        type: 'PERSON',
        tree_path: '/polska/pomorskie/starogard/damian/',
        attributes: { role: 'Gamer / Modder' }
      };

      axios.get.mockResolvedValueOnce({
        data: { success: true, entity: mockEntity, relations: [] }
      });

      // Symulacja błędu HTML Axios Interceptora przy próbie usunięcia
      axios.delete.mockRejectedValueOnce(
        new Error('Endpoint /api/entities/node-damian?cascade=true zwrócił HTML')
      );

      const onEntityUpdatedMock = vi.fn();
      const onCloseMock = vi.fn();

      // Mock okienek potwierdzenia
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <EntityDetailsModal
          entityId="node-damian"
          onClose={onCloseMock}
          onEntityUpdated={onEntityUpdatedMock}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Damian')).toBeDefined();
      });

      // Kliknij przycisk usunięcia
      const deleteBtn = screen.getByText(/USUŃ PODMIOT/i);
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(onEntityUpdatedMock).toHaveBeenCalled();
        expect(onCloseMock).toHaveBeenCalled();
      });

      expect(getDeletedEntityIds().has('node-damian')).toBe(true);
      confirmSpy.mockRestore();
    });
  });

});

