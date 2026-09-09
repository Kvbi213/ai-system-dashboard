/**
 * Export and Report Generation Service for Omnidash.
 * Supports CSV file downloads and printable HTML/PDF report views.
 */

/**
 * Converts array of objects to CSV string.
 * Sanitizes fields (commas, quotes, newlines).
 * @param {Array<Object>} rows 
 * @param {Array<{ key: string, label: string }>} columns 
 * @returns {string} CSV formatted content
 */
export function convertToCSV(rows = [], columns = []) {
  if (!rows || rows.length === 0) return '';

  const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (val === null || val === undefined) val = '';
      else if (typeof val === 'object') val = JSON.stringify(val);
      else val = String(val);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [header, ...lines].join('\r\n');
}

/**
 * Triggers browser download of a generated text/CSV file.
 * @param {string} content 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers CSV export for Finances.
 * @param {Array<Object>} transactions 
 */
export function exportFinancesToCSV(transactions = []) {
  const valid = transactions.filter(t => t && !t.is_settings && t.id !== 'finance_settings');
  const cols = [
    { key: 'transaction_date', label: 'Data' },
    { key: 'title', label: 'Tytuł' },
    { key: 'type', label: 'Typ (income/expense/transfer)' },
    { key: 'amount', label: 'Kwota (PLN)' },
    { key: 'category', label: 'Kategoria' },
    { key: 'splitMode', label: 'Tryb Podziału' },
    { key: 'bucket', label: 'Koperta / Przeznaczenie' },
    { key: 'fromBucket', label: 'Z Koperty (Transfer)' },
    { key: 'toBucket', label: 'Do Koperty (Transfer)' }
  ];
  const csv = convertToCSV(valid, cols);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `finanse_eksport_${dateStr}.csv`);
}

/**
 * Generates and triggers CSV export for Tasks.
 * @param {Array<Object>} tasks 
 */
export function exportTasksToCSV(tasks = []) {
  const cols = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Zadanie' },
    { key: 'priority', label: 'Priorytet' },
    { key: 'status', label: 'Status' },
    { key: 'category', label: 'Kategoria' },
    { key: 'target_date', label: 'Termin' }
  ];
  const csv = convertToCSV(tasks, cols);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `zadania_eksport_${dateStr}.csv`);
}

/**
 * Generates and triggers CSV export for Workouts.
 * @param {Array<Object>} workouts 
 */
export function exportWorkoutsToCSV(workouts = []) {
  const cols = [
    { key: 'date', label: 'Data' },
    { key: 'type', label: 'Typ treningu' },
    { key: 'duration', label: 'Czas (min)' },
    { key: 'notes', label: 'Notatki' }
  ];
  const csv = convertToCSV(workouts, cols);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `treningi_eksport_${dateStr}.csv`);
}

/**
 * Generates and triggers CSV export for Timetable.
 * @param {Array<Object>} timetable 
 */
export function exportTimetableToCSV(timetable = []) {
  const cols = [
    { key: 'day', label: 'Dzień' },
    { key: 'subject', label: 'Przedmiot' },
    { key: 'time_start', label: 'Początek' },
    { key: 'time_end', label: 'Koniec' },
    { key: 'room', label: 'Sala' },
    { key: 'teacher', label: 'Prowadzący' },
    { key: 'type', label: 'Typ zajęć' },
    { key: 'notes', label: 'Uwagi' }
  ];
  const csv = convertToCSV(timetable, cols);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `plan_zajec_eksport_${dateStr}.csv`);
}

/**
 * Generates printable HTML report in a popup window for instant PDF export / printing.
 * @param {Object} data 
 */
export function openPrintableReport({ title = 'Raport Systemowy OmniDash', sections = [] }) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Zezwól na wyskakujące okna (pop-up), aby wygenerować raport do druku / PDF.');
    return;
  }

  const generatedDate = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

  const sectionsHtml = sections.map(sec => `
    <div class="report-section">
      <h2 class="section-title">${sec.title}</h2>
      ${sec.summaryHtml ? `<div class="section-summary">${sec.summaryHtml}</div>` : ''}
      ${sec.tableHtml ? `<div class="table-container">${sec.tableHtml}</div>` : ''}
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #00F0FF;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .logo {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #0b132b;
          text-transform: uppercase;
        }
        .logo span { color: #00F0FF; }
        .meta {
          font-size: 11px;
          color: #6b7280;
          text-align: right;
        }
        .report-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .report-section {
          margin-bottom: 28px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          border-left: 4px solid #00F0FF;
          padding-left: 8px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          background: #f9fafb;
        }
        .card-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .card-val { font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 8px;
        }
        th {
          background: #f3f4f6;
          color: #374151;
          font-weight: 600;
          text-align: left;
          padding: 8px 12px;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 8px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        tr:nth-child(even) td {
          background: #fafafa;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
          font-size: 10px;
          color: #9ca3af;
          display: flex;
          justify-content: space-between;
        }
        .no-print {
          margin-bottom: 20px;
          padding: 10px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-print {
          background: #0b132b;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span>Podgląd wydruku wygenerowany pomyślnie. Kliknij przycisk, aby wydrukować lub zapisać jako PDF:</span>
        <button class="btn-print" onclick="window.print()">Drukuj / Zapisz PDF</button>
      </div>
      <div class="header">
        <div>
          <div class="logo">OMNIDASH <span>AI</span></div>
          <div class="report-title">${title}</div>
        </div>
        <div class="meta">
          <div>Wygenerowano: <strong>${generatedDate}</strong></div>
          <div>Strefa czasowa: Europe/Warsaw</div>
          <div>Środowisko: Produkcja (Cloud-First)</div>
        </div>
      </div>

      ${sectionsHtml}

      <div class="footer">
        <span>Omnidash Intelligent Management Dashboard</span>
        <span>Dokument wygenerowany automatycznie przez System Report Engine</span>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
