import express from 'express';
import {
  createEntity,
  updateEntity,
  deleteEntity,
  getEntityById,
  getEntityTree,
  createRelation,
  getRelationsForEntity,
  deleteRelation,
  formatTreeAscii,
  countEntitiesByType,
  ensureLocationHierarchy
} from '../services/entitiesService.js';

const router = express.Router();

// GET /api/entities/tree - pobiera pełne lub filtrowane drzewo podmiotów
router.get('/tree', async (req, res) => {
  try {
    const root = req.query.root || null;
    const tree = await getEntityTree(root);
    res.json({ success: true, tree });
  } catch (err) {
    console.error('[!] ERROR GET /api/entities/tree:', err.message);
    res.status(500).json({ error: 'Błąd pobierania drzewa podmiotów.', details: err.message });
  }
});

// GET /api/entities/ascii - zwraca sformatowane drzewo tekstowe dla konsoli / terminala
router.get('/ascii', async (req, res) => {
  try {
    const root = req.query.root || null;
    const ascii = await formatTreeAscii(root);
    res.type('text/plain').send(ascii);
  } catch (err) {
    console.error('[!] ERROR GET /api/entities/ascii:', err.message);
    res.status(500).json({ error: 'Błąd formatowania drzewa ASCII.', details: err.message });
  }
});

// GET /api/entities/stats - statystyka węzłów według typów
router.get('/stats', async (req, res) => {
  try {
    const tree = await getEntityTree();
    const stats = countEntitiesByType(tree);
    res.json({ success: true, stats });
  } catch (err) {
    console.error('[!] ERROR GET /api/entities/stats:', err.message);
    res.status(500).json({ error: 'Błąd pobierania statystyk.', details: err.message });
  }
});

// GET /api/entities/:id - pobiera szczegóły pojedynczego podmiotu wraz z relacjami
router.get('/:id', async (req, res) => {
  try {
    const entity = await getEntityById(req.params.id);
    if (!entity) {
      return res.status(404).json({ error: 'Nie odnaleziono podmiotu o podanym ID.' });
    }
    const relations = await getRelationsForEntity(req.params.id);
    res.json({ success: true, entity, relations });
  } catch (err) {
    console.error(`[!] ERROR GET /api/entities/${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Błąd pobierania szczegółów podmiotu.', details: err.message });
  }
});

// POST /api/entities - dodaje nowy węzeł do drzewa (z opcjonalnym automatycznym geokodowaniem)
router.post('/', async (req, res) => {
  try {
    const { name, type, parent_id, attributes, location_context } = req.body;
    let actualParentId = parent_id || null;

    // Automatyczne podpięcie pod drzewo geolokalizacyjne na podstawie kontekstu
    if (!actualParentId && location_context) {
      const cityNode = await ensureLocationHierarchy(location_context);
      if (cityNode) {
        actualParentId = cityNode.id;
      }
    }

    const created = await createEntity({
      name,
      type,
      parent_id: actualParentId,
      attributes: attributes || {}
    });

    res.status(201).json({ success: true, entity: created });
  } catch (err) {
    console.error('[!] ERROR POST /api/entities:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/entities/:id - aktualizacja parametrów podmiotu
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateEntity(req.params.id, req.body);
    res.json({ success: true, entity: updated });
  } catch (err) {
    console.error(`[!] ERROR PUT /api/entities/${req.params.id}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/entities/:id - usuwa podmiot (z opcjonalnym cascade=true)
router.delete('/:id', async (req, res) => {
  try {
    const cascade = req.query.cascade === 'true';
    const result = await deleteEntity(req.params.id, { cascade });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[!] ERROR DELETE /api/entities/${req.params.id}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/entities/relations - tworzenie relacji sieciowej między podmiotami
router.post('/relations', async (req, res) => {
  try {
    const { source_id, target_id, relation_type, metadata } = req.body;
    const relation = await createRelation({
      source_id,
      target_id,
      relation_type,
      metadata: metadata || {}
    });
    res.status(201).json({ success: true, relation });
  } catch (err) {
    console.error('[!] ERROR POST /api/entities/relations:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/entities/relations/:id - usuwa relację
router.delete('/relations/:id', async (req, res) => {
  try {
    const result = await deleteRelation(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[!] ERROR DELETE /api/entities/relations/${req.params.id}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
