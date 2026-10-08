import {
  STARTER_TREE_DATA,
  FALLBACK_NODES,
  FALLBACK_RELATIONS
} from '../data/obsidianEntitiesData.js';
import { firestore } from '../firebaseClient.js';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_DELETED_ENTITIES_KEY = 'omnidash_entities_deleted_ids';
const STORAGE_CUSTOM_ENTITIES_KEY = 'omnidash_entities_custom_nodes';
const STORAGE_DELETED_RELATIONS_KEY = 'omnidash_entities_deleted_relations';
const STORAGE_CUSTOM_RELATIONS_KEY = 'omnidash_entities_custom_relations';

const memoryStore = new Map();

function getStorageItem(key) {
  try {
    const s = typeof window !== 'undefined' && window?.localStorage ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
    if (s && typeof s.getItem === 'function') {
      return s.getItem(key);
    }
  } catch (e) {}
  return memoryStore.get(key) || null;
}

function setStorageItem(key, val) {
  try {
    const s = typeof window !== 'undefined' && window?.localStorage ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
    if (s && typeof s.setItem === 'function') {
      s.setItem(key, val);
      return;
    }
  } catch (e) {}
  memoryStore.set(key, val);
}

function removeStorageItem(key) {
  try {
    const s = typeof window !== 'undefined' && window?.localStorage ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
    if (s && typeof s.removeItem === 'function') {
      s.removeItem(key);
      return;
    }
  } catch (e) {}
  memoryStore.delete(key);
}

/**
 * Zwraca zbiór identyfikatorów usuniętych podmiotów
 */
export function getDeletedEntityIds() {
  try {
    const raw = getStorageItem(STORAGE_DELETED_ENTITIES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.warn('[EntityStore] Błąd odczytu usuniętych podmiotów:', e);
    return new Set();
  }
}

/**
 * Zwraca listę własnych podmiotów dodanych lokalnie
 */
export function getCustomEntities() {
  try {
    const raw = getStorageItem(STORAGE_CUSTOM_ENTITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[EntityStore] Błąd odczytu podmiotów własnych:', e);
    return [];
  }
}

/**
 * Zwraca zbiór identyfikatorów usuniętych relacji
 */
export function getDeletedRelationIds() {
  try {
    const raw = getStorageItem(STORAGE_DELETED_RELATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.warn('[EntityStore] Błąd odczytu usuniętych relacji:', e);
    return new Set();
  }
}

/**
 * Zwraca listę własnych relacji dodanych lokalnie
 */
export function getCustomRelations() {
  try {
    const raw = getStorageItem(STORAGE_CUSTOM_RELATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[EntityStore] Błąd odczytu relacji własnych:', e);
    return [];
  }
}

/**
 * Wyszukuje wszystkie identyfikatory potomków danego węzła w drzewie
 */
export function findDescendantIds(nodeId, tree) {
  const ids = [nodeId];

  function search(nodes) {
    if (!Array.isArray(nodes)) return false;
    for (const n of nodes) {
      if (n.id === nodeId) {
        collectChildren(n);
        return true;
      }
      if (n.children && n.children.length > 0) {
        if (search(n.children)) return true;
      }
    }
    return false;
  }

  function collectChildren(node) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        ids.push(child.id);
        collectChildren(child);
      }
    }
  }

  search(tree || STARTER_TREE_DATA);
  return ids;
}

/**
 * Oznacza podmiot (oraz opcjonalnie jego potomków) jako usunięty w magazynie klienta
 */
export function markEntityDeleted(entityId, cascade = true, currentTree = null) {
  if (!entityId) return { deletedCount: 0, deletedIds: [] };

  const treeToSearch = currentTree || STARTER_TREE_DATA;
  const targetIds = cascade ? findDescendantIds(entityId, treeToSearch) : [entityId];
  const currentDeleted = getDeletedEntityIds();

  targetIds.forEach(id => currentDeleted.add(id));

  try {
    setStorageItem(STORAGE_DELETED_ENTITIES_KEY, JSON.stringify(Array.from(currentDeleted)));

    // Usuń z lokalnych podmiotów jeśli tam istniał
    const custom = getCustomEntities().filter(item => !currentDeleted.has(item.id));
    setStorageItem(STORAGE_CUSTOM_ENTITIES_KEY, JSON.stringify(custom));

    // Emisja zdarzenia aktualizacji
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('omnidash:entities-changed', {
        detail: { action: 'delete', ids: targetIds }
      }));
    }
  } catch (e) {
    console.warn('[EntityStore] Błąd zapisu usuniętych podmiotów:', e);
  }

  // Opcjonalna propagacja do Cloud Firestore
  if (firestore && !process?.env?.VITEST) {
    try {
      setDoc(
        doc(firestore, 'entities_state', 'deletions'),
        {
          deleted_ids: Array.from(currentDeleted),
          updated_at: new Date().toISOString()
        },
        { merge: true }
      ).catch(err => {
        console.debug('[EntityStore] Firestore sync delete debug:', err.message);
      });
    } catch (e) {
      // Ciche tłumienie w trybie offline
    }
  }

  return { deletedCount: targetIds.length, deletedIds: targetIds };
}

/**
 * Zapisuje nowy podmiot w magazynie klienta (offline / cloud fallback)
 */
export function saveCustomEntity(entity) {
  if (!entity || !entity.id) return null;

  const currentCustom = getCustomEntities();
  const existingIdx = currentCustom.findIndex(e => e.id === entity.id);
  const normalizedEntity = {
    ...entity,
    updated_at: new Date().toISOString(),
    created_at: entity.created_at || new Date().toISOString()
  };

  if (existingIdx >= 0) {
    currentCustom[existingIdx] = normalizedEntity;
  } else {
    currentCustom.push(normalizedEntity);
  }

  try {
    setStorageItem(STORAGE_CUSTOM_ENTITIES_KEY, JSON.stringify(currentCustom));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('omnidash:entities-changed', {
        detail: { action: 'save', entity: normalizedEntity }
      }));
    }
  } catch (e) {
    console.warn('[EntityStore] Błąd zapisu podmiotu lokalnego:', e);
  }

  if (firestore && !process?.env?.VITEST) {
    try {
      setDoc(doc(firestore, 'entities', normalizedEntity.id), normalizedEntity, { merge: true }).catch(() => {});
    } catch (e) {}
  }

  return normalizedEntity;
}

/**
 * Oznacza relację jako usuniętą w magazynie klienta
 */
export function markRelationDeleted(relId) {
  if (!relId) return false;
  const currentDeleted = getDeletedRelationIds();
  currentDeleted.add(relId);

  try {
    setStorageItem(STORAGE_DELETED_RELATIONS_KEY, JSON.stringify(Array.from(currentDeleted)));
    const custom = getCustomRelations().filter(r => r.id !== relId);
    setStorageItem(STORAGE_CUSTOM_RELATIONS_KEY, JSON.stringify(custom));
  } catch (e) {
    console.warn('[EntityStore] Błąd zapisu usuniętych relacji:', e);
  }
  return true;
}

/**
 * Zapisuje relację w magazynie klienta
 */
export function saveCustomRelation(relation) {
  if (!relation || !relation.id) return null;
  const currentCustom = getCustomRelations();
  const existingIdx = currentCustom.findIndex(r => r.id === relation.id);

  if (existingIdx >= 0) {
    currentCustom[existingIdx] = relation;
  } else {
    currentCustom.unshift(relation);
  }

  try {
    setStorageItem(STORAGE_CUSTOM_RELATIONS_KEY, JSON.stringify(currentCustom));
  } catch (e) {
    console.warn('[EntityStore] Błąd zapisu relacji lokalnej:', e);
  }
  return relation;
}

/**
 * Filtruje drzewo usuwając węzły oznaczone jako usunięte i dołączając węzły niestandardowe
 */
export function filterTreeWithClientState(tree) {
  const deletedIds = getDeletedEntityIds();
  const customEntities = getCustomEntities();

  function cloneAndFilter(nodes) {
    if (!Array.isArray(nodes)) return [];
    const result = [];

    for (const node of nodes) {
      if (deletedIds.has(node.id)) {
        continue;
      }
      const clonedNode = {
        ...node,
        children: cloneAndFilter(node.children || [])
      };
      result.push(clonedNode);
    }

    return result;
  }

  const filteredTree = cloneAndFilter(tree || STARTER_TREE_DATA);

  // Wstrzyknij customEntities jeśli nie są jeszcze w drzewie
  if (customEntities.length > 0) {
    const existingNodeIds = new Set();
    function collectIds(nodes) {
      for (const n of nodes) {
        existingNodeIds.add(n.id);
        if (n.children && n.children.length > 0) collectIds(n.children);
      }
    }
    collectIds(filteredTree);

    for (const custom of customEntities) {
      if (deletedIds.has(custom.id) || existingNodeIds.has(custom.id)) {
        continue;
      }

      const nodeToAdd = {
        ...custom,
        children: custom.children || []
      };

      if (custom.parent_id) {
        let attached = false;
        function attach(nodes) {
          for (const n of nodes) {
            if (n.id === custom.parent_id) {
              n.children = n.children || [];
              n.children.push(nodeToAdd);
              attached = true;
              return true;
            }
            if (n.children && n.children.length > 0) {
              if (attach(n.children)) return true;
            }
          }
          return false;
        }
        attach(filteredTree);
        if (!attached) {
          filteredTree.push(nodeToAdd);
        }
      } else {
        filteredTree.push(nodeToAdd);
      }
      existingNodeIds.add(custom.id);
    }
  }

  return filteredTree;
}

/**
 * Oblicza statystyki drzewa podmiotów
 */
export function calculateTreeStats(tree) {
  const counts = {
    PERSON: 0,
    ORGANIZATION: 0,
    CITY: 0,
    REGION: 0,
    COUNTRY: 0,
    ASSET: 0,
    total: 0
  };

  function traverse(nodes) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (counts[node.type] !== undefined) {
        counts[node.type]++;
      }
      counts.total++;
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return {
    ...counts,
    byType: {
      PERSON: counts.PERSON,
      ORGANIZATION: counts.ORGANIZATION,
      CITY: counts.CITY,
      REGION: counts.REGION,
      COUNTRY: counts.COUNTRY,
      ASSET: counts.ASSET
    }
  };
}

/**
 * Renderuje podgląd drzewa w formacie ASCII
 */
export function renderTreeToAscii(tree) {
  const counts = calculateTreeStats(tree);
  const lines = [
    '================================================================================',
    '  OMNIDASH :: ENTITY TREE EXPLORER [v2.32.1]',
    '================================================================================',
    '',
    '[ROOT]'
  ];

  function renderNodes(nodes, prefix = '') {
    nodes.forEach((node, idx) => {
      const isLast = idx === nodes.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = prefix + (isLast ? '    ' : '│   ');

      let attrExtra = '';
      if (node.attributes) {
        if (node.attributes.role) {
          attrExtra = ` [${node.attributes.role}]`;
        } else if (node.attributes.title) {
          attrExtra = ` [${node.attributes.title}]`;
        }
      }

      lines.push(`${prefix}${connector}[${node.type}] ${node.name}${attrExtra}`);

      if (node.children && node.children.length > 0) {
        renderNodes(node.children, childPrefix);
      }
    });
  }

  renderNodes(tree);

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(
    `Suma podmiotów w gałęzi: ${counts.PERSON} osoby, ${counts.ORGANIZATION} organizacje, ${counts.CITY} miasta, ${counts.REGION} regiony, ${counts.COUNTRY} kraje, ${counts.ASSET} zasoby`
  );
  lines.push('================================================================================');

  return lines.join('\n');
}

/**
 * Pobiera dane podmiotu i jego relacji w trybie offline/fallback
 */
export function getEntityDetailsOffline(id) {
  if (!id) return null;
  const deletedIds = getDeletedEntityIds();
  if (deletedIds.has(id)) {
    return null;
  }

  // 1. Sprawdź customEntities
  const custom = getCustomEntities().find(e => e.id === id);
  const entity = custom || FALLBACK_NODES[id] || null;
  if (!entity) return null;

  // 2. Pobierz relacje z fallback i custom
  const deletedRelIds = getDeletedRelationIds();
  const baseRelations = FALLBACK_RELATIONS[id] || [];
  const customRelations = getCustomRelations().filter(r => r.source_id === id || r.target_id === id);

  const combinedRelations = [...customRelations, ...baseRelations].filter(r => {
    if (deletedRelIds.has(r.id)) return false;
    if (deletedIds.has(r.source_id) || deletedIds.has(r.target_id)) return false;
    return true;
  });

  return {
    entity,
    relations: combinedRelations
  };
}

/**
 * Weryfikuje czy dany błąd sieciowy jest błędem zwracającym HTML lub błędem braku endpointu w chmurze
 */
export function isHtmlOrOfflineError(err) {
  if (!err) return false;
  const msg = String(err.message || '');
  const data = typeof err.response?.data === 'string' ? err.response.data : '';
  return (
    msg.includes('zwrócił HTML') ||
    msg.includes('HTML') ||
    msg.includes('Network Error') ||
    msg.includes('timeout') ||
    data.includes('<!DOCTYPE') ||
    err.response?.status === 404 ||
    err.response?.status === 500
  );
}

/**
 * Czyści lokalny magazyn podmiotów (reset do stanu początkowego)
 */
export function resetClientEntityStore() {
  removeStorageItem(STORAGE_DELETED_ENTITIES_KEY);
  removeStorageItem(STORAGE_CUSTOM_ENTITIES_KEY);
  removeStorageItem(STORAGE_DELETED_RELATIONS_KEY);
  removeStorageItem(STORAGE_CUSTOM_RELATIONS_KEY);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('omnidash:entities-changed', {
      detail: { action: 'reset' }
    }));
  }
}
