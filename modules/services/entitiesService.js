import crypto from 'crypto';
import { executeQuery, executeRun } from '../database.js';

export const ENTITY_TYPES = [
  'COUNTRY',
  'REGION',
  'CITY',
  'ORGANIZATION',
  'PERSON',
  'ASSET'
];

export const RELATION_TYPES = [
  'EMPLOYED_AT',
  'FRIEND_OF',
  'OWNER_OF',
  'ASSOCIATED_WITH',
  'STUDENT_OF',
  'LOCATED_IN',
  'SUBSIDIARY_OF'
];

/**
 * Zmienia ciąg znaków na bezpieczny slug ścieżki hierarchicznej (tree_path)
 */
export function slugify(text) {
  if (!text) return 'unnamed';
  const polishMap = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
    'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z'
  };

  const converted = String(text)
    .split('')
    .map(ch => polishMap[ch] || ch)
    .join('')
    .toLowerCase()
    .trim();

  return converted
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'node';
}

/**
 * Oblicza kanoniczną ścieżkę tree_path dla węzła na podstawie rodzica
 */
export async function calculateTreePath(parentId, name) {
  const currentSlug = slugify(name);
  if (!parentId) {
    return `/${currentSlug}/`;
  }

  const rows = await executeQuery('SELECT tree_path FROM entities WHERE id = ?', [parentId]);
  if (!rows || rows.length === 0) {
    throw new Error(`Nie odnaleziono węzła nadrzędnego o ID: ${parentId}`);
  }

  const parentPath = rows[0].tree_path.endsWith('/') ? rows[0].tree_path : `${rows[0].tree_path}/`;
  return `${parentPath}${currentSlug}/`;
}

/**
 * Tworzy nowy węzeł w drzewie podmiotów
 */
export async function createEntity({ id, parent_id = null, type, name, attributes = {} }) {
  if (!name || typeof name !== 'string') {
    throw new Error('Pole "name" jest wymagane do utworzenia węzła.');
  }

  const normalizedType = String(type || 'PERSON').toUpperCase();
  if (!ENTITY_TYPES.includes(normalizedType)) {
    throw new Error(`Nieprawidłowy typ podmiotu: ${type}. Dopuszczalne: ${ENTITY_TYPES.join(', ')}`);
  }

  const entityId = id || crypto.randomUUID();
  const treePath = await calculateTreePath(parent_id, name);
  const attributesJson = JSON.stringify(attributes || {});

  await executeRun(
    `INSERT INTO entities (id, parent_id, type, name, tree_path, attributes_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entityId, parent_id, normalizedType, name.trim(), treePath, attributesJson]
  );

  return {
    id: entityId,
    parent_id,
    type: normalizedType,
    name: name.trim(),
    tree_path: treePath,
    attributes: attributes || {},
    created_at: new Date().toISOString()
  };
}

/**
 * Aktualizuje węzeł i kaskadowo przelicza ścieżki potomków, jeśli nazwa lub rodzic uległy zmianie
 */
export async function updateEntity(id, { name, type, parent_id, attributes }) {
  const existing = await getEntityById(id);
  if (!existing) {
    throw new Error(`Nie odnaleziono podmiotu o ID: ${id}`);
  }

  let newName = name !== undefined ? name.trim() : existing.name;
  let newType = type !== undefined ? String(type).toUpperCase() : existing.type;
  let newParentId = parent_id !== undefined ? parent_id : existing.parent_id;
  let newAttributes = attributes !== undefined ? attributes : existing.attributes;

  if (!ENTITY_TYPES.includes(newType)) {
    throw new Error(`Nieprawidłowy typ podmiotu: ${newType}`);
  }

  const oldPath = existing.tree_path;
  let newPath = oldPath;

  // Przeliczenie ścieżki, jeśli zmieniła się nazwa lub parent_id
  if (newName !== existing.name || newParentId !== existing.parent_id) {
    newPath = await calculateTreePath(newParentId, newName);
  }

  await executeRun(
    `UPDATE entities 
     SET name = ?, type = ?, parent_id = ?, tree_path = ?, attributes_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newName, newType, newParentId, newPath, JSON.stringify(newAttributes), id]
  );

  // Kaskadowa aktualizacja ścieżek wszystkich potomków
  if (oldPath !== newPath) {
    const descendants = await executeQuery(
      `SELECT id, tree_path FROM entities WHERE tree_path LIKE ? AND id != ?`,
      [`${oldPath}%`, id]
    );

    for (const desc of descendants) {
      const updatedDescPath = desc.tree_path.replace(oldPath, newPath);
      await executeRun('UPDATE entities SET tree_path = ? WHERE id = ?', [updatedDescPath, desc.id]);
    }
  }

  return {
    ...existing,
    name: newName,
    type: newType,
    parent_id: newParentId,
    tree_path: newPath,
    attributes: newAttributes
  };
}

/**
 * Pobiera pojedynczy podmiot po ID z rozpakowanymi atrybutami
 */
export async function getEntityById(id) {
  const rows = await executeQuery('SELECT * FROM entities WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  let attributes = {};
  try {
    attributes = JSON.parse(row.attributes_json || '{}');
  } catch {}
  return {
    ...row,
    attributes
  };
}

/**
 * Usuwa podmiot z opcją kaskadowego usunięcia potomków
 */
export async function deleteEntity(id, { cascade = false } = {}) {
  const entity = await getEntityById(id);
  if (!entity) return { deleted: 0 };

  if (cascade) {
    const descendants = await executeQuery(
      'SELECT id FROM entities WHERE tree_path LIKE ?',
      [`${entity.tree_path}%`]
    );
    const idsToDelete = descendants.map(d => d.id);
    for (const dId of idsToDelete) {
      await executeRun('DELETE FROM entity_relations WHERE source_id = ? OR target_id = ?', [dId, dId]);
      await executeRun('DELETE FROM entities WHERE id = ?', [dId]);
    }
    return { deleted: idsToDelete.length, ids: idsToDelete };
  } else {
    // Usunięcie pojedyncze: potomkowie stają się węzłami bez rodzica (parent_id = NULL)
    await executeRun('UPDATE entities SET parent_id = NULL WHERE parent_id = ?', [id]);
    await executeRun('DELETE FROM entity_relations WHERE source_id = ? OR target_id = ?', [id, id]);
    const res = await executeRun('DELETE FROM entities WHERE id = ?', [id]);
    return { deleted: res.changes, ids: [id] };
  }
}

/**
 * Pobiera wszystkich bezpośrednich i pośrednich potomków danego węzła
 */
export async function getDescendants(id) {
  const entity = await getEntityById(id);
  if (!entity) return [];
  const rows = await executeQuery(
    'SELECT * FROM entities WHERE tree_path LIKE ? AND id != ? ORDER BY tree_path ASC',
    [`${entity.tree_path}%`, id]
  );
  return rows.map(r => ({
    ...r,
    attributes: JSON.parse(r.attributes_json || '{}')
  }));
}

/**
 * Buduje zagnieżdżone drzewo hierarchiczne (Tree Structure)
 */
export async function getEntityTree(rootIdOrPath = null) {
  let query = 'SELECT * FROM entities ORDER BY tree_path ASC, name ASC';
  let params = [];

  if (rootIdOrPath) {
    if (rootIdOrPath.startsWith('/')) {
      query = 'SELECT * FROM entities WHERE tree_path LIKE ? ORDER BY tree_path ASC, name ASC';
      params = [`${rootIdOrPath}%`];
    } else {
      const root = await getEntityById(rootIdOrPath);
      if (!root) return [];
      query = 'SELECT * FROM entities WHERE tree_path LIKE ? ORDER BY tree_path ASC, name ASC';
      params = [`${root.tree_path}%`];
    }
  }

  const rows = await executeQuery(query, params);
  const nodes = rows.map(r => {
    let attributes = {};
    try { attributes = JSON.parse(r.attributes_json || '{}'); } catch {}
    return {
      ...r,
      attributes,
      children: []
    };
  });

  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const rootNodes = [];
  nodes.forEach(node => {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id).children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * Tworzy relację sieciową między dwoma podmiotami
 */
export async function createRelation({ id, source_id, target_id, relation_type, metadata = {} }) {
  if (!source_id || !target_id || !relation_type) {
    throw new Error('Pola source_id, target_id i relation_type są wymagane.');
  }

  const relId = id || crypto.randomUUID();
  const normalizedType = String(relation_type).toUpperCase();
  const metadataJson = JSON.stringify(metadata || {});

  await executeRun(
    `INSERT INTO entity_relations (id, source_id, target_id, relation_type, metadata_json)
     VALUES (?, ?, ?, ?, ?)`,
    [relId, source_id, target_id, normalizedType, metadataJson]
  );

  return {
    id: relId,
    source_id,
    target_id,
    relation_type: normalizedType,
    metadata,
    created_at: new Date().toISOString()
  };
}

/**
 * Pobiera wszystkie relacje powiązane z podmiotem
 */
export async function getRelationsForEntity(entityId) {
  const rows = await executeQuery(
    `SELECT r.*, 
            s.name as source_name, s.type as source_type,
            t.name as target_name, t.type as target_type
     FROM entity_relations r
     JOIN entities s ON r.source_id = s.id
     JOIN entities t ON r.target_id = t.id
     WHERE r.source_id = ? OR r.target_id = ?
     ORDER BY r.created_at DESC`,
    [entityId, entityId]
  );

  return rows.map(r => ({
    id: r.id,
    source_id: r.source_id,
    source_name: r.source_name,
    source_type: r.source_type,
    target_id: r.target_id,
    target_name: r.target_name,
    target_type: r.target_type,
    relation_type: r.relation_type,
    metadata: JSON.parse(r.metadata_json || '{}'),
    created_at: r.created_at
  }));
}

/**
 * Usuwa relację
 */
export async function deleteRelation(id) {
  const res = await executeRun('DELETE FROM entity_relations WHERE id = ?', [id]);
  return { deleted: res.changes };
}

/**
 * Zlicza podmioty w drzewie według typów
 */
export function countEntitiesByType(treeNodes) {
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

  traverse(treeNodes);
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
 * Generuje sformatowane drzewo tekstowe ASCII dla terminala
 */
export async function formatTreeAscii(rootIdOrPath = null) {
  const tree = await getEntityTree(rootIdOrPath);
  const counts = countEntitiesByType(tree);

  const lines = [
    '================================================================================',
    '  OMNIDASH :: ENTITY TREE EXPLORER [v2.31.0]',
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

  renderNodes(tree, '');

  const summaryParts = [];
  if (counts.PERSON) summaryParts.push(`${counts.PERSON} osób`);
  if (counts.ORGANIZATION) summaryParts.push(`${counts.ORGANIZATION} organizacji`);
  if (counts.CITY) summaryParts.push(`${counts.CITY} miast`);
  if (counts.REGION) summaryParts.push(`${counts.REGION} regionów`);
  if (counts.COUNTRY) summaryParts.push(`${counts.COUNTRY} krajów`);
  if (counts.ASSET) summaryParts.push(`${counts.ASSET} zasobów`);

  const summaryText = summaryParts.length > 0 ? summaryParts.join(', ') : 'brak zarejestrowanych podmiotów';

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`Suma podmiotów w gałęzi: ${summaryText} (łącznie: ${counts.total})`);
  lines.push('================================================================================');

  return lines.join('\n');
}

export const POLISH_VOIVODESHIPS = {
  'pomorskie': 'Województwo Pomorskie',
  'mazowieckie': 'Województwo Mazowieckie',
  'malopolskie': 'Województwo Małopolskie',
  'slaskie': 'Województwo Śląskie',
  'wielkopolskie': 'Województwo Wielkopolskie',
  'dolnoslaskie': 'Województwo Dolnośląskie',
  'lodzkie': 'Województwo Łódzkie',
  'kujawsko-pomorskie': 'Województwo Kujawsko-Pomorskie',
  'lubelskie': 'Województwo Lubelskie',
  'podkarpackie': 'Województwo Podkarpackie',
  'warminsko-mazurskie': 'Województwo Warmińsko-Mazurskie',
  'zachodniopomorskie': 'Województwo Zachodniopomorskie',
  'podlaskie': 'Województwo Podlaskie',
  'swietokrzyskie': 'Województwo Świętokrzyskie',
  'lubuskie': 'Województwo Lubuskie',
  'opolskie': 'Województwo Opolskie'
};

export const COMMON_CITY_VOIVODESHIP_MAP = {
  'starogard': 'pomorskie',
  'starogard gdanski': 'pomorskie',
  'starogard gdański': 'pomorskie',
  'gdansk': 'pomorskie',
  'gdańsk': 'pomorskie',
  'gdynia': 'pomorskie',
  'sopot': 'pomorskie',
  'tczew': 'pomorskie',
  'malbork': 'pomorskie',
  'chojnice': 'pomorskie',
  'slupsk': 'pomorskie',
  'słupsk': 'pomorskie',
  'warszawa': 'mazowieckie',
  'radom': 'mazowieckie',
  'plock': 'mazowieckie',
  'płock': 'mazowieckie',
  'siedlce': 'mazowieckie',
  'krakow': 'malopolskie',
  'kraków': 'malopolskie',
  'tarnow': 'malopolskie',
  'tarnów': 'malopolskie',
  'nowy sacz': 'malopolskie',
  'nowy sącz': 'malopolskie',
  'wroclaw': 'dolnoslaskie',
  'wrocław': 'dolnoslaskie',
  'walbrzych': 'dolnoslaskie',
  'wałbrzych': 'dolnoslaskie',
  'legnica': 'dolnoslaskie',
  'poznan': 'wielkopolskie',
  'poznań': 'wielkopolskie',
  'kalisz': 'wielkopolskie',
  'konin': 'wielkopolskie',
  'katowice': 'slaskie',
  'gliwice': 'slaskie',
  'sosnowiec': 'slaskie',
  'czestochowa': 'slaskie',
  'częstochowa': 'slaskie',
  'bielsko-biala': 'slaskie',
  'bielsko-biała': 'slaskie',
  'lodz': 'lodzkie',
  'łódź': 'lodzkie',
  'piotrkow trybunalski': 'lodzkie',
  'piotrków trybunalski': 'lodzkie',
  'szczecin': 'zachodniopomorskie',
  'koszalin': 'zachodniopomorskie',
  'bydgoszcz': 'kujawsko-pomorskie',
  'torun': 'kujawsko-pomorskie',
  'toruń': 'kujawsko-pomorskie',
  'lublin': 'lubelskie',
  'zamosc': 'lubelskie',
  'zamość': 'lubelskie',
  'chelm': 'lubelskie',
  'chełm': 'lubelskie',
  'bialystok': 'podlaskie',
  'białystok': 'podlaskie',
  'lomza': 'podlaskie',
  'łomża': 'podlaskie',
  'suwalki': 'podlaskie',
  'suwałki': 'podlaskie',
  'rzeszow': 'podkarpackie',
  'rzeszów': 'podkarpackie',
  'przemysl': 'podkarpackie',
  'przemyśl': 'podkarpackie',
  'olsztyn': 'warminsko-mazurskie',
  'elblag': 'warminsko-mazurskie',
  'elbląg': 'warminsko-mazurskie',
  'kielce': 'swietokrzyskie',
  'zielona gora': 'lubuskie',
  'zielona góra': 'lubuskie',
  'gorzow wielkopolski': 'lubuskie',
  'gorzów wielkopolski': 'lubuskie',
  'opole': 'opolskie'
};

/**
 * Rozwiązuje łańcuch pochodzenia geograficznego (Kraj -> Region -> Miasto) na podstawie ciągu tekstowego
 */
export function resolveLocationHierarchy(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') {
    return null;
  }

  const cleaned = locationStr.trim();
  const lower = cleaned.toLowerCase();

  // 1. Sprawdzenie formatu wieloelementowego z przecinkami (np. "USA, Kalifornia, Los Angeles")
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      country: parts[0],
      region: parts[1],
      city: parts[2]
    };
  }

  // 2. Automatyczne mapowanie dla polskich miast (najdłuższe dopasowanie pierwsze)
  const sortedCityEntries = Object.entries(COMMON_CITY_VOIVODESHIP_MAP)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [cityKey, voivodeshipKey] of sortedCityEntries) {
    if (lower === cityKey || lower.includes(cityKey)) {
      const voivodeshipName = POLISH_VOIVODESHIPS[voivodeshipKey];
      // Formatowanie nazwy miasta lub użycie dokładnej nazwy wejściowej
      const formattedCity = (lower === cityKey)
        ? cleaned
        : cityKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        country: 'Polska',
        region: voivodeshipName,
        city: formattedCity
      };
    }
  }

  // 3. Fallback dla pojedynczego miasta / regionu
  if (parts.length === 2) {
    return {
      country: 'Polska',
      region: parts[1],
      city: parts[0]
    };
  }

  return {
    country: 'Polska',
    region: 'Województwo Pomorskie',
    city: cleaned
  };
}

/**
 * Zapewnia istnienie pełnego łańcucha nadrzędnego (Kraj -> Region -> Miasto) w bazie danych
 * i zwraca obiekt węzła liścia (np. Miasto), do którego można podpiąć organizację lub osobę.
 */
export async function ensureLocationHierarchy(locationStr) {
  const resolved = resolveLocationHierarchy(locationStr);
  if (!resolved) return null;

  // 1. Kraj (Root)
  let countryRows = await executeQuery('SELECT * FROM entities WHERE type = "COUNTRY" AND name = ?', [resolved.country]);
  let countryNode = countryRows[0];
  if (!countryNode) {
    countryNode = await createEntity({
      name: resolved.country,
      type: 'COUNTRY',
      parent_id: null,
      attributes: { auto_geocoded: true }
    });
  }

  // 2. Region / Województwo
  let regionRows = await executeQuery('SELECT * FROM entities WHERE type = "REGION" AND name = ? AND parent_id = ?', [resolved.region, countryNode.id]);
  let regionNode = regionRows[0];
  if (!regionNode) {
    regionNode = await createEntity({
      name: resolved.region,
      type: 'REGION',
      parent_id: countryNode.id,
      attributes: { auto_geocoded: true }
    });
  }

  // 3. Miasto
  let cityRows = await executeQuery('SELECT * FROM entities WHERE type = "CITY" AND name = ? AND parent_id = ?', [resolved.city, regionNode.id]);
  let cityNode = cityRows[0];
  if (!cityNode) {
    cityNode = await createEntity({
      name: resolved.city,
      type: 'CITY',
      parent_id: regionNode.id,
      attributes: { auto_geocoded: true }
    });
  }

  return cityNode;
}

