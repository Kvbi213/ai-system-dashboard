import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, executeRun, initDB } from '../modules/database.js';
import {
  createEntity,
  createRelation,
  getEntityTree,
  formatTreeAscii,
  countEntitiesByType
} from '../modules/services/entitiesService.js';
import { getFirestoreDb } from '../modules/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OBSIDIAN_BASE_PATH = 'C:\\Users\\Jakub Lis\\Documents\\OBSIDIAN\\informacje';

/**
 * Parsuje plik Markdown, wyciągając YAML frontmatter oraz sekcje H2/H3/listy/bloki
 */
function parseMarkdownModule(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');

  const result = {
    frontmatter: {},
    codeBlocks: [],
    sections: {},
    raw: content.trim()
  };

  // YAML Frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const lines = fmMatch[1].split(/\r?\n/);
    let currentKey = null;
    for (const line of lines) {
      const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kv) {
        currentKey = kv[1];
        let val = kv[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        result.frontmatter[currentKey] = val;
      } else if (line.trim().startsWith('- ') && currentKey) {
        if (!Array.isArray(result.frontmatter[currentKey])) {
          result.frontmatter[currentKey] = [];
        }
        result.frontmatter[currentKey].push(line.trim().substring(2));
      }
    }
  }

  // Sekcje tekstowe
  const cleanBody = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const sectionMatches = cleanBody.split(/(?=\n##\s+)/);
  for (const sec of sectionMatches) {
    const trimmed = sec.trim();
    if (!trimmed) continue;
    const headerMatch = trimmed.match(/^##\s+([^\n]+)/);
    if (headerMatch) {
      const title = headerMatch[1].trim();
      const body = trimmed.substring(headerMatch[0].length).trim();
      result.sections[title] = body;
    }
  }

  return result;
}

/**
 * Parsuje kartę koktajlową Lis Craft Mixology
 */
function parseMixologyMenu(mixologyPath) {
  if (!fs.existsSync(mixologyPath)) return [];
  const content = fs.readFileSync(mixologyPath, 'utf8');
  const drinks = [];
  const drinkSections = content.split(/(?=\n###\s+\d+\.\s+)/);

  for (const sec of drinkSections) {
    const m = sec.match(/###\s+\d+\.\s+([^\n]+)/);
    if (m) {
      const name = m[1].replace(/^[^\w\s]+/, '').trim();
      const profile = sec.match(/\*\*Profil Smakowy:\*\*\s*([^\n]+)/)?.[1]?.trim() || '';
      const alcohol = sec.match(/\*\*Baza Alkoholowa:\*\*\s*([^\n]+)/)?.[1]?.trim() || '';
      const serving = sec.match(/\*\*Sposób Podania:\*\*\s*([^\n]+)/)?.[1]?.trim() || '';
      const virgin = sec.match(/\*\*🌿 Wersja Virgin \(0\.0%\):\*\*\s*([^\n]+)/)?.[1]?.trim() || '';

      drinks.push({
        name,
        flavor_profile: profile,
        alcohol_base: alcohol,
        serving_method: serving,
        virgin_alternative: virgin
      });
    }
  }

  return drinks;
}

export async function importObsidianVault() {
  console.log('[*] Rozpoczynanie synchronizacji z Obsidian Vault: ' + OBSIDIAN_BASE_PATH);
  await initDB();

  // Wyczyść dotychczasowe podmioty, aby zbudować czyste drzewo oparte o 10-modułowy standard
  await executeRun('DELETE FROM entity_relations');
  await executeRun('DELETE FROM entities');

  // 1. KORZEŃ GEOGRAFICZNY & ORGANIZACJE
  console.log('[*] Tworzenie węzłów geograficznych i organizacyjnych...');
  const countryPolska = await createEntity({
    id: 'node-polska',
    name: 'Polska',
    type: 'COUNTRY',
    parent_id: null,
    attributes: { code: 'PL', capital: 'Warszawa', auto_geocoded: true }
  });

  const regionPomorskie = await createEntity({
    id: 'node-pomorskie',
    name: 'Województwo Pomorskie',
    type: 'REGION',
    parent_id: countryPolska.id,
    attributes: { capital: 'Gdańsk', auto_geocoded: true }
  });

  const cityStarogard = await createEntity({
    id: 'node-starogard',
    name: 'Starogard Gdański',
    type: 'CITY',
    parent_id: regionPomorskie.id,
    attributes: { postal_code: '83-200', auto_geocoded: true }
  });

  const orgZSE = await createEntity({
    id: 'node-zse',
    name: 'ZSE im. Noblistów Polskich',
    type: 'ORGANIZATION',
    parent_id: cityStarogard.id,
    attributes: {
      address: 'ul. Paderewskiego 11, 83-200 Starogard Gdański',
      type: 'Technikum Informatyczne',
      focus: 'Kształcenie IT, sieci komputerowe, inżynieria systemowa'
    }
  });

  const assetFlat120 = await createEntity({
    id: 'node-flat-120',
    name: 'Flat 120m² (Hub Domowy & Rezydencja)',
    type: 'ASSET',
    parent_id: cityStarogard.id,
    attributes: {
      model: 'Układ 4-osobowy (Core + Współlokator + Strefa Wypoczynku)',
      core_rooms: 'Sypialnia nr 8, Pracownia IT nr 2, Garderoba z toaletką',
      standards: 'Cisza nocna, brak akademickiego chaosu, SOP po 19:00'
    }
  });

  // 2. PARSOWANIE MIXOLOGY
  const mixologyPath = path.join(OBSIDIAN_BASE_PATH, 'mixology', 'Lis_Craft_Mixology.md');
  const mixologyDrinks = parseMixologyMenu(mixologyPath);
  console.log(`[+] Sparsowano receptury Lis Craft Mixology: ${mixologyDrinks.length} drinków.`);

  // 3. PARSOWANIE PROFILI OSOBOWYCH
  const peopleDirs = ['Jakub', 'Wiki', 'Damian', 'Gordon', 'Kedzier', 'Maciej'];
  const moduleNames = [
    'Metryka', 'Sociale', 'Charakter', 'Zdrowie', 'Finanse',
    'Zainteresowania', 'Rutyna', 'Relacja', 'Siec_Relacji', 'Zaufanie_i_Ryzyka'
  ];

  const entityMap = {};

  for (const personKey of peopleDirs) {
    const personDir = path.join(OBSIDIAN_BASE_PATH, 'osoby', personKey);
    if (!fs.existsSync(personDir)) {
      console.warn(`[!] Pomijam brakujący katalog: ${personDir}`);
      continue;
    }

    const parsedModules = {};
    for (const mod of moduleNames) {
      const pModPath = path.join(personDir, `${mod}.md`);
      parsedModules[mod.toLowerCase()] = parseMarkdownModule(pModPath);
    }

    // Profil meta / frontmatter
    const hubPath = path.join(personDir, `PROFIL_${personKey.toUpperCase()}.md`);
    const hubParsed = parseMarkdownModule(hubPath);

    let entityName = personKey;
    let entityId = `node-${personKey.toLowerCase()}`;
    let role = 'Członek Ekipy';
    let housingStatus = 'Gość';
    let specificAttributes = {};

    switch (personKey) {
      case 'Jakub':
        entityName = 'Jakub Lis';
        role = 'Operator / Główny Architekt / Lead Dev';
        housingStatus = 'Core';
        specificAttributes = {
          alias: 'Kvbi',
          specialization: 'Inżynieria Oprogramowania & Cyberbezpieczeństwo',
          style: 'Clean Tactical (Nike Dunki, cargo z karabińczykami, oversize bluzy)',
          gear: 'Mechanix M-Pact, CF-Moto CForce 850 Touring, Honda Civic',
          training: 'Kalistenika (Pull-ups, Dipy, Pompki eksplozywne, Hollow Body)',
          focus_stimulants: 'Monster Rehab Tea + Peach, Velo Peach Ice (1-kropek / focus tool)',
          mixology_brand: 'Lis Craft Mixology',
          mixology_recipes: mixologyDrinks
        };
        break;

      case 'Wiki':
        entityName = 'Wiki';
        role = 'Partnerka / Dziewczyna Jakuba (Filar Core)';
        housingStatus = 'Core';
        specificAttributes = {
          priority: 'Core (Zaufanie 100%)',
          home_zone: 'Sypialnia nr 8, Garderoba z toaletką',
          target_address: 'Flat 120m² (Jakub + Wiki)'
        };
        break;

      case 'Damian':
        entityName = 'Damian';
        role = 'Wieloletni Znajomy / Granie';
        housingStatus = 'Gość';
        specificAttributes = {
          age: '~20 lat',
          specialization: 'Gaming / Hardware / Modding',
          housing_role: 'Gość na nocki gamingowe i weekendy'
        };
        break;

      case 'Gordon':
        entityName = 'Gordon Gadziejewski (Meklas)';
        role = 'Klasowy koder / Architekt Zamieszania ("Wielki Dev")';
        housingStatus = 'Brak kwalifikacji';
        specificAttributes = {
          birth_date: '29.08.2010 (16 lat)',
          address: 'ul. Lubichowska 24A, 83-200 Starogard Gdański',
          phone: '+48 501 449 424 (opis: "firmowy")',
          discord: 'meklas_ (ID: 1370685546887643198 | Nick: MEKLASDEV)',
          github: 'https://github.com/meklasdev',
          instagram: '@gor4us_',
          facebook: 'https://www.facebook.com/profile.php?id=100093969214430',
          steam: ['76561198772850175', '76561199138417851'],
          trust_code: '0% (Wysokie ryzyko skażenia gałęzi main)',
          trust_business: 'Niskie (kreowanie pozorów, flex)',
          health_condition: 'Powtarzające się bąble porehabilitacyjne',
          phenomenon: 'Erudycja w teorii architektonicznej vs błędy w prostych skryptach',
          housing_role: 'Brak kwalifikacji (Poza planem mieszkaniowym)'
        };
        break;

      case 'Kedzier':
        entityName = 'Kędzier';
        role = 'Branża IT / Równolatek';
        housingStatus = 'Współlokator';
        specificAttributes = {
          field: 'Branża IT / Technik Informatyk',
          housing_role: 'Kandydat na współlokatora 120m² (1/4 kosztów stałych)',
          rules: 'Zasada ciszy i skupienia do 19:00'
        };
        break;

      case 'Maciej':
        entityName = 'Maciej';
        role = 'Znajomy od roku / Dojrzały';
        housingStatus = 'Rezerwa';
        specificAttributes = {
          age: '~20 lat',
          relationship: 'W stałym związku partnerskim',
          housing_role: 'Pierwsza rezerwa lokatorska (model 2 par)'
        };
        break;
    }

    // Podpięcie pod organizację ZSE lub bezpośrednio pod Miasto / Flat
    const parentNodeId = (housingStatus === 'Core') ? assetFlat120.id : orgZSE.id;

    const attributesPayload = {
      role,
      housing_status: housingStatus,
      ...specificAttributes,
      modules: parsedModules,
      hub_meta: hubParsed?.frontmatter || {}
    };

    console.log(`[+] Zapisywanie profilu: ${entityName} [${housingStatus}]...`);
    const created = await createEntity({
      id: entityId,
      name: entityName,
      type: 'PERSON',
      parent_id: parentNodeId,
      attributes: attributesPayload
    });

    entityMap[personKey] = created;
  }

  // 4. TWORZENIE GRAFU RELACJI (ENTITY_RELATIONS)
  console.log('[*] Tworzenie sieci powiązań grafowych...');

  const relationsToCreate = [
    // Relacje interpersonalne
    { source: 'Jakub', target: 'Wiki', type: 'PARTNER_OF', note: 'Główny filar osobisty (Core / Zaufanie 100%)' },
    { source: 'Wiki', target: 'Jakub', type: 'PARTNER_OF', note: 'Główny filar osobisty (Core / Zaufanie 100%)' },
    { source: 'Jakub', target: 'Damian', type: 'FRIEND_OF', note: 'Wieloletnia znajomość, granie, modding' },
    { source: 'Jakub', target: 'Kedzier', type: 'COLLEAGUE', note: 'Branża IT, równolatek, potencjalny współlokator' },
    { source: 'Jakub', target: 'Maciej', type: 'FRIEND_OF', note: 'Znajomy od roku, dojrzały, pierwsza rezerwa' },
    { source: 'Jakub', target: 'Gordon', type: 'CLASSMATE', note: 'ZSE TI, klasowy koder, zaufanie kodowe 0%' },

    // Powiązania edukacyjne ze szkołą ZSE
    { source: 'Jakub', target: 'ZSE', type: 'STUDENT_OF', note: 'Technik Informatyk (Lead Dev)' },
    { source: 'Gordon', target: 'ZSE', type: 'STUDENT_OF', note: 'Technik Informatyk (Klasowa legenda)' },
    { source: 'Kedzier', target: 'ZSE', type: 'STUDENT_OF', note: 'Technik Informatyk' },
    { source: 'Damian', target: 'ZSE', type: 'ASSOCIATED_WITH', note: 'Znajomość ze środowiska szkolnego' },

    // Powiązania z planem mieszkaniowym 120m²
    { source: 'Jakub', target: 'FLAT_120', type: 'OWNER_OF', note: 'Status Core (Pracownia IT + Sypialnia nr 8)' },
    { source: 'Wiki', target: 'FLAT_120', type: 'CO_LIVING', note: 'Status Core (Sypialnia nr 8 + Garderoba z toaletką)' },
    { source: 'Kedzier', target: 'FLAT_120', type: 'CO_LIVING', note: 'Status Współlokator (Pokój jednoosobowy)' },
    { source: 'Damian', target: 'FLAT_120', type: 'VISITOR', note: 'Status Gość (Nocki weekendowe, granie)' },
    { source: 'Maciej', target: 'FLAT_120', type: 'RESERVE', note: 'Status Rezerwa (Potencjał modelu 2 par)' }
  ];

  for (const rel of relationsToCreate) {
    let sId = entityMap[rel.source]?.id;
    let tId = entityMap[rel.target]?.id;

    if (rel.target === 'ZSE') tId = orgZSE.id;
    if (rel.target === 'FLAT_120') tId = assetFlat120.id;

    if (sId && tId) {
      await createRelation({
        source_id: sId,
        target_id: tId,
        relation_type: rel.type,
        metadata: { note: rel.note }
      });
    }
  }

  // 5. GENEROWANIE I LOGOWANIE STRUKTURY
  const tree = await getEntityTree();
  const ascii = await formatTreeAscii();
  const stats = countEntitiesByType(tree);

  console.log('\n' + ascii + '\n');
  console.log('[+] Statystyki zsynchronizowanej bazy:', JSON.stringify(stats, null, 2));

  try {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      console.log('[*] Replikacja danych encji do Firestore (entities_cache/latest)...');
      await firestoreDb.collection('entities_cache').doc('latest').set({
        tree,
        ascii,
        stats,
        peopleCount: 6,
        modulesCount: 60,
        updated_at: new Date().toISOString(),
        source: 'Obsidian Vault Sync'
      });
      console.log('[+] SUCCESS: Replikacja do Firestore ukończona.');
    }
  } catch (fsErr) {
    console.warn('[!] Ostrzeżenie: Replikacja Firestore niedostępna w tym trybie:', fsErr.message);
  }

  return { tree, ascii, stats };
}

// Jeśli uruchomiony bezpośrednio z CLI
if (process.argv[1] && process.argv[1].includes('import_obsidian_entities')) {
  importObsidianVault()
    .then(() => {
      console.log('[+] Synchronizacja Obsidian -> OmniDash Entities Hub zakończona sukcesem.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[!] Błąd krytyczny importu:', err);
      process.exit(1);
    });
}
