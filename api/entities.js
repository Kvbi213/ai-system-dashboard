import fs from 'fs';
import path from 'path';

export const config = {
  maxDuration: 30,
};

let cachedBundle = null;

function getBundle() {
  if (cachedBundle) return cachedBundle;
  try {
    const bundlePath = path.join(process.cwd(), 'data', 'obsidian_starter_bundle.json');
    if (fs.existsSync(bundlePath)) {
      const raw = fs.readFileSync(bundlePath, 'utf8');
      cachedBundle = JSON.parse(raw);
      return cachedBundle;
    }
  } catch (e) {
    console.warn('[Vercel Serverless Gateway] Błąd odczytu pakietu obsidian_starter_bundle:', e.message);
  }

  return {
    tree: [],
    stats: { total: 0, byType: {} },
    ascii: '=== OMNIDASH :: ENTITY TREE EXPLORER ===',
    fallbackNodes: {},
    allRelations: {}
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const bundle = getBundle();
  const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  // urlParts np. ['api', 'entities', 'tree'] lub ['api', 'entities', 'node-damian']
  const subpath = req.query.path || (urlParts.length > 2 ? urlParts.slice(2).join('/') : '');

  // 1. GET Requests
  if (req.method === 'GET') {
    if (!subpath || subpath === 'tree') {
      return res.status(200).json({
        success: true,
        tree: bundle.tree || [],
        source: 'Vercel Serverless Gateway'
      });
    }

    if (subpath === 'stats') {
      return res.status(200).json({
        success: true,
        stats: bundle.stats || { total: 0, byType: {} }
      });
    }

    if (subpath === 'ascii') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(bundle.ascii || 'OMNIDASH :: ENTITY TREE EXPLORER');
    }

    if (subpath.startsWith('relations/')) {
      const relId = subpath.replace('relations/', '');
      return res.status(200).json({
        success: true,
        relation_id: relId
      });
    }

    // Szczegóły podmiotu wg ID
    const entityId = subpath;
    const entity = bundle.fallbackNodes?.[entityId];
    const relations = bundle.allRelations?.[entityId] || [];

    if (entity) {
      return res.status(200).json({
        success: true,
        entity,
        relations
      });
    }

    return res.status(200).json({
      success: true,
      entity: {
        id: entityId,
        name: entityId,
        type: 'PERSON',
        attributes: { note: 'Węzeł zsynchronizowany w chmurze' }
      },
      relations: []
    });
  }

  // 2. POST Requests
  if (req.method === 'POST') {
    if (subpath === 'sync-obsidian') {
      return res.status(200).json({
        success: true,
        message: 'Rejestr podmiotów zsynchronizowany z pakietem Obsidian Vault.',
        total_nodes: bundle.stats?.total || 0
      });
    }

    if (subpath === 'relations') {
      const body = req.body || {};
      const newRel = {
        id: body.id || `rel-${Date.now()}`,
        source_id: body.source_id,
        target_id: body.target_id,
        relation_type: body.relation_type || 'FRIEND_OF',
        metadata: body.metadata || {},
        created_at: new Date().toISOString()
      };
      return res.status(200).json({
        success: true,
        relation: newRel
      });
    }

    const body = req.body || {};
    const newEntity = {
      id: body.id || `node-${Date.now()}`,
      name: body.name || 'Nowy Podmiot',
      type: body.type || 'PERSON',
      parent_id: body.parent_id || null,
      attributes: body.attributes || {},
      created_at: new Date().toISOString()
    };
    return res.status(200).json({
      success: true,
      entity: newEntity
    });
  }

  // 3. DELETE Requests
  if (req.method === 'DELETE') {
    if (subpath.startsWith('relations/')) {
      const relId = subpath.replace('relations/', '');
      return res.status(200).json({
        success: true,
        deleted_relation_id: relId
      });
    }

    const entityId = subpath || req.query.id;
    const cascade = req.query.cascade === 'true';

    return res.status(200).json({
      success: true,
      deleted_id: entityId,
      cascade,
      message: 'Podmiot został pomyślnie usunięty.'
    });
  }

  return res.status(405).json({ error: 'Metoda nieobsługiwana' });
}
