import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Zdefiniowane specyficzne reguły przekształceń dla spójności inżynieryjnej
const SPECIFIC_REPLACEMENTS = [
  // tests/wakeword.test.js - zachowanie logiki testu przez kody unicode bez dosłownych glifów emoji
  {
    file: 'tests/wakeword.test.js',
    from: "const input = 'Temperatura wynosi 22°C i jest bezchmurnie !';",
    to: "const input = 'Temperatura wynosi 22°C \\u2600\\uFE0F i jest bezchmurnie \\uD83D\\uDE80!';"
  },
  {
    file: 'tests/wakeword.test.js',
    from: "expect(output).not.toContain('');",
    to: "expect(output).not.toContain('\\u2600');"
  },
  {
    file: 'tests/wakeword.test.js',
    from: "expect(output).not.toContain('');",
    to: "expect(output).not.toContain('\\uD83D\\uDE80');"
  },
  // tests/autonomous_agent.test.js
  {
    file: 'tests/autonomous_agent.test.js',
    from: "'OmniDash AI [AI]'",
    to: "'OmniDash AI'"
  },
  {
    file: 'tests/autonomous_agent.test.js',
    from: "'OmniAgent Cloud [AI]'",
    to: "'OmniAgent Cloud'"
  },
  {
    file: 'tests/autonomous_agent.test.js',
    from: "'OmniDash Auto-Finanse [FINANSE]'",
    to: "'OmniDash Auto-Finanse'"
  },
  // tests/agent_execution_trace.test.jsx
  {
    file: 'tests/agent_execution_trace.test.jsx',
    from: "content: ' **[OMNIDAEMON] Inicjalizacja Autonomicznego Badania Ciągłego**",
    to: "content: '**[OMNIDAEMON] Inicjalizacja Autonomicznego Badania Ciągłego**"
  }
];

// 2. Globalna mapa zamian znaków
const CHAR_MAP = {
  // Symbole alertowe i statusowe
  '[!]': '[!]',
  '[!]': '[!]',
  '[ALERT]': '[ALERT]',
  '[X]': '[X]',
  '[OK]': '[OK]',
  '[OK]': '[OK]',
  '->': '->',
  'x': 'x',
  '[KRYTYCZNY]': '[KRYTYCZNY]',
  '[ŚREDNI]': '[ŚREDNI]',
  '[NISKI]': '[NISKI]',
  '[INFO]': '[INFO]',
  '[INFO]': '[INFO]',
  '[-]': '[-]',

  // Asystenci i system
  '[AI]': '[AI]',
  '[BRAIN]': '[BRAIN]',
  '[FINANSE]': '[FINANSE]',
  '[WYCISZONY]': '[WYCISZONY]',
  '[MIC]': '[MIC]',
  '[MIC]': '[MIC]',
  '[MIC]': '[MIC]',

  // Puste usunięcie dekoracyjnych
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '': '',
  '\uFE0F': '', // variation selector-16
  '\u200D': '' // zero width joiner
};

// Regex dopasowujący pozostałe dowolne glify emoji w Unikodzie
const RESIDUAL_EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}\u{200D}]/gu;

function getAllTargetFiles(dir) {
  const fileList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (['node_modules', '.git', 'dist', '.firebase'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      fileList.push(...getAllTargetFiles(full));
    } else if (/\.(jsx?|tsx?|md|html|json)$/.test(ent.name) && ent.name !== 'package-lock.json') {
      fileList.push(full);
    }
  }
  return fileList;
}

function processFiles() {
  const allFiles = getAllTargetFiles(rootDir);
  let changedFilesCount = 0;
  let totalReplacedChars = 0;

  for (const filePath of allFiles) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // A. Specyficzne zamiany
    for (const spec of SPECIFIC_REPLACEMENTS) {
      if (relPath === spec.file && content.includes(spec.from)) {
        content = content.replaceAll(spec.from, spec.to);
      }
    }

    // B. Podmiana ze słownika CHAR_MAP
    for (const [emoji, replacement] of Object.entries(CHAR_MAP)) {
      if (content.includes(emoji)) {
        content = content.replaceAll(emoji, replacement);
      }
    }

    // C. Czyszczenie ewentualnych pozostałości
    content = content.replace(RESIDUAL_EMOJI_REGEX, '');

    // D. Drobna normalizacja podwójnych spacji powstałych po usunięciu emotki w tekście
    // (nie naruszając formatowania wcięć kodu)
    const lines = content.split('\n').map(line => {
      // Zachowaj początkowe spacje/tabulacje wcięcia
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const rest = line.slice(indent.length);
      const cleanedRest = rest.replace(/ {2,}/g, ' ');
      return indent + cleanedRest;
    });
    content = lines.join('\n');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      changedFilesCount++;
      console.log(`[+] Zaktualizowano (usunięto emotki): ${relPath}`);
    }
  }

  console.log(`\n[*] Zakończono: zmodyfikowano ${changedFilesCount} plików.`);
}

processFiles();
