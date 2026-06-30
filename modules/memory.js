import { executeQuery, executeRun } from './database.js';

/**
 * Zapisuje nowy fakt o operatorze do pamięci długoterminowej
 * @param {string} fact - Odkryty lub podany fakt, np. "Użytkownik uczy się Pythona"
 * @param {string} category - np. 'skills', 'preferences', 'general'
 */
export async function learnFact(fact, category = 'general') {
    try {
        const res = await executeRun(
            'INSERT INTO user_memory (fact, category) VALUES (?, ?)',
            [fact, category]
        );
        console.log(`[+] MEMORY: Zapamiętano fakt [${category}]: ${fact}`);
        return { success: true, id: res.id, message: `Fakt został zapisany w pamięci trwałej.` };
    } catch (err) {
        console.error(`[!] Błąd zapisu pamięci:`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Pobiera całą historię wiedzy o operatorze
 * (może być zawężona do kategorii, ale na razie ciągniemy wszystko do kontekstu)
 */
export async function getUserProfile() {
    try {
        const rows = await executeQuery('SELECT fact, category FROM user_memory ORDER BY created_at ASC');
        if (rows.length === 0) return "Brak zapisanych faktów w pamięci długoterminowej.";
        
        return rows.map(r => `[${r.category.toUpperCase()}] ${r.fact}`).join(' | ');
    } catch (err) {
        console.error(`[!] Błąd odczytu profilu operatora:`, err);
        return "Błąd odczytu bazy wiedzy.";
    }
}

export async function getAllFacts() {
    try {
        return await executeQuery('SELECT id, fact, category, created_at FROM user_memory ORDER BY created_at DESC');
    } catch (err) {
        console.error(`[!] Błąd pobierania wszystkich faktów:`, err);
        return [];
    }
}

export async function deleteFact(id) {
    try {
        await executeRun('DELETE FROM user_memory WHERE id = ?', [parseInt(id, 10)]);
        return { success: true };
    } catch (err) {
        console.error(`[!] Błąd usuwania faktu z pamięci:`, err);
        return { success: false, error: err.message };
    }
}
