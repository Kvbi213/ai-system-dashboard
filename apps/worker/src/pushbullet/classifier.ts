export interface ClassifiedEvent {
  type: 'TRANSACTION' | 'TASK' | 'SCHOOL_ALERT' | 'GENERIC';
  amount?: number;
  envelope?: 'NEEDS' | 'WANTS' | 'SAVINGS';
  title?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  subject?: string;
  raw: string;
}

export function classifyNotification(title: string, body: string): ClassifiedEvent {
  const combined = `${title} ${body}`.trim();

  // 1. Bank payment detection (e.g. "Płatność kartą: 68,40 PLN w LIDL")
  const paymentRegex = /Płatność kartą:\s*([\d,.]+)\s*PLN/i;
  const paymentMatch = combined.match(paymentRegex);

  if (paymentMatch) {
    const rawAmount = paymentMatch[1].replace(',', '.');
    const amount = parseFloat(rawAmount);
    if (!isNaN(amount) && amount > 0) {
      // Automatic 50/30/20 heuristic: groceries/supermarkets are NEEDS
      const isNeeds = /lidl|biedronka|auchan|carrefour|apteka|orlen|żabka/i.test(combined);
      return {
        type: 'TRANSACTION',
        amount,
        envelope: isNeeds ? 'NEEDS' : 'WANTS',
        title: title || 'Płatność automatyczna SMS',
        raw: combined
      };
    }
  }

  // 2. Task note detection (e.g. "Zadanie: Kupić bilety")
  const taskRegex = /Zadanie:\s*(.+)/i;
  const taskMatch = combined.match(taskRegex);

  if (taskMatch) {
    return {
      type: 'TASK',
      title: taskMatch[1].trim(),
      priority: 'HIGH',
      raw: combined
    };
  }

  // 3. School alert detection (e.g. "Librus: Nowa ocena z przedmiotu Bazy Danych SQL: 5")
  const schoolRegex = /Librus:\s*Nowa ocena z przedmiotu\s*([^:]+)/i;
  const schoolMatch = combined.match(schoolRegex);

  if (schoolMatch) {
    return {
      type: 'SCHOOL_ALERT',
      subject: schoolMatch[1].trim(),
      raw: combined
    };
  }

  return {
    type: 'GENERIC',
    title,
    raw: combined
  };
}
