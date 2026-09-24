import fs from 'fs/promises';
import path from 'path';

// Ograniczamy działanie bota wyłącznie do katalogu projektu, dla bezpieczeństwa
const PROJECT_ROOT = path.resolve('./');

/**
 * Bezpiecznie odczytuje zawartość pliku tekstowego z poziomu projektu
 * @param {string} relativePath - Ścieżka relatywna do pliku
 */
export async function readProjectFile(relativePath) {
    try {
        const fullPath = path.normalize(path.resolve(PROJECT_ROOT, relativePath));
        
        // Zabezpieczenie przed Directory Traversal
        if (fullPath !== PROJECT_ROOT && !fullPath.startsWith(PROJECT_ROOT + path.sep)) {
            throw new Error('Próba dostępu poza katalog projektowy. Odmowa.');
        }

        // Zabezpieczenie przed wyciekiem sekretów i poświadczeń środowiskowych
        const fileName = path.basename(fullPath).toLowerCase();
        const sensitiveFiles = ['.env', 'firebase-service-account.json', 'temp_users.json'];
        if (sensitiveFiles.includes(fileName) || fileName.startsWith('.env')) {
            throw new Error('Odmowa dostępu: plik chroniony (sekrety/klucze API). Odczyt przez asystenta AI jest zablokowany.');
        }

        const content = await fs.readFile(fullPath, 'utf-8');
        return { success: true, path: relativePath, content };
    } catch (error) {
        console.error(` [X] [FS EXPLORER] Błąd odczytu pliku ${relativePath}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Skanuje strukturę katalogu w poszukiwaniu plików źródłowych
 */
export async function scanProjectDirectory(dirPath = '') {
    try {
        const targetPath = path.normalize(path.resolve(PROJECT_ROOT, dirPath));
        
        if (targetPath !== PROJECT_ROOT && !targetPath.startsWith(PROJECT_ROOT + path.sep)) {
            throw new Error('Odmowa dostępu.');
        }

        const entries = await fs.readdir(targetPath, { withFileTypes: true });
        
        const files = entries
            .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
            .map(e => ({
                name: e.name,
                isDirectory: e.isDirectory(),
                path: path.join(dirPath, e.name).replace(/\\/g, '/')
            }));

        return { success: true, files };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
