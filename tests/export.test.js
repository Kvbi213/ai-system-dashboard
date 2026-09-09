import { describe, it, expect } from 'vitest';
import { convertToCSV } from '../modules/services/exportService.js';

describe('Export Service & CSV Serialization Engine', () => {
  it('should return empty string for empty rows', () => {
    const csv = convertToCSV([], [{ key: 'id', label: 'ID' }]);
    expect(csv).toBe('');
  });

  it('should generate valid RFC 4180 CSV header and rows', () => {
    const columns = [
      { key: 'title', label: 'Tytuł' },
      { key: 'amount', label: 'Kwota (PLN)' }
    ];
    const data = [
      { title: 'Wypłata', amount: 5000 },
      { title: 'Czynsz i media', amount: 1500 }
    ];

    const csv = convertToCSV(data, columns);
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(3);
    expect(lines[0]).toBe('"Tytuł","Kwota (PLN)"');
    expect(lines[1]).toBe('"Wypłata","5000"');
    expect(lines[2]).toBe('"Czynsz i media","1500"');
  });

  it('should safely escape double quotes and special characters in fields', () => {
    const columns = [
      { key: 'note', label: 'Notatka' }
    ];
    const data = [
      { note: 'Zakupy w "Biedronce", w tym pieczywo' }
    ];

    const csv = convertToCSV(data, columns);
    const lines = csv.split('\r\n');

    expect(lines[1]).toBe('"Zakupy w ""Biedronce"", w tym pieczywo"');
  });

  it('should handle undefined, null, and object values gracefully', () => {
    const columns = [
      { key: 'valNull', label: 'Null' },
      { key: 'valObj', label: 'Obj' }
    ];
    const data = [
      { valNull: null, valObj: { x: 1 } }
    ];

    const csv = convertToCSV(data, columns);
    const lines = csv.split('\r\n');

    expect(lines[1]).toContain('""');
    expect(lines[1]).toContain('"{""x"":1}"');
  });
});
