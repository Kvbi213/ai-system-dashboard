export const agentTools = [
  {
    type: 'function',
    function: {
      name: 'PERFORM_OSINT_SCAN',
      description: 'Przeprowadza wywiad jawnoźródłowy (OSINT) dla podanego celu (IP, domena, hasło, MAC). Zwraca m.in. WHOIS, porty, geolokalizację, wycieki HIBP, i archiwum Wayback.',
      parameters: {
        type: 'object',
        properties: { target: { type: 'string', description: 'Cel do prześwietlenia, np. 8.8.8.8, onet.pl, qwerty1234' } },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'executeWebSearch',
      description: 'Przeszukuje internet (Brave Search) w poszukiwaniu najświeższych newsów ze świata IT, AI, technologii i bezpieczeństwa.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Angielskie zapytanie dla lepszych wyników' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ADD_TO_DO',
      description: 'Dodaje nowe zadanie do bazy.',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', description: 'Tablica obiektów (title, target_date, itp) dla masowego dodawania', items: { type: 'object' } },
          title: { type: 'string' },
          target_date: { type: 'string', description: 'YYYY-MM-DD' },
          target_time: { type: 'string', description: 'HH:MM' },
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          category: { type: 'string', enum: ['jednorazowe', 'powtarzalne', 'inne'] },
          recurrence_rule: { type: 'string', description: 'e.g. weekly:wtorek:17:00 or daily:08:00 or null' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'DELETE_TO_DO',
      description: 'Usuwa zadanie z bazy na podstawie ID.',
      parameters: {
        type: 'object',
        properties: { task_id: { type: 'string', description: 'ID zadania (np. 5), "all", albo lista ID oddzielona przecinkiem (np. "1, 2, 3")' } },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'UPDATE_TO_DO',
      description: 'Aktualizuje parametry istniejącego zadania (np. zmiana na completed, zmiana priorytetu).',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', description: 'Tablica obiektów {task_id, status, priority, title} do masowej edycji', items: { type: 'object' } },
          task_id: { type: 'string', description: 'ID zadania do zmiany, albo lista ID oddzielona przecinkiem (np. "1, 2, 3")' },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          title: { type: 'string' }
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'GET_ALL_TASKS',
      description: 'Pobiera pełną listę wszystkich zadań (gdy potrzeba więcej niż 10 widocznych w kontekście).',
      parameters: {
        type: 'object',
        properties: { filter_status: { type: 'string', enum: ['all', 'pending', 'completed'] } },
        required: ['filter_status'],
      },
    },
  },
  {
      type: "function",
      function: {
          name: "readProjectFile",
          description: "Odczytuje zawartość konkretnego pliku źródłowego z projektu System w celu analizy kodu lub debugowania.",
          parameters: {
              type: "object",
              properties: {
                  relativePath: {
                      type: "string",
                      description: "Ścieżka relatywna do pliku, np. 'core.server.js' lub 'modules/database.js'."
                  }
              },
              required: ["relativePath"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "scanProjectDirectory",
          description: "Skanuje katalogi projektu, aby poznać strukturę plików i sprawdzić jakie moduły są dostępne.",
          parameters: {
              type: "object",
              properties: {
                  dirPath: {
                      type: "string",
                      description: "Katalog do przeskanowania, np. 'modules' lub '' dla katalogu głównego."
                  }
              }
          }
      }
  },
  {
      type: "function",
      function: {
          name: "LEARN_FACT",
          description: "Zapisuje ważny fakt o użytkowniku/operatorze do pamięci długoterminowej. Używaj tego by uczyć się preferencji, umiejętności, celów życiowych lub projektów operatora.",
          parameters: {
              type: "object",
              properties: {
                  fact: {
                      type: "string",
                      description: "Istotny fakt, np. 'Operator uczy się języka Python' lub 'Operator preferuje krótkie odpowiedzi'."
                  },
                  category: {
                      type: "string",
                      description: "Kategoria faktu, np. 'preferences', 'skills', 'goals', 'projects', 'general'"
                  }
              },
              required: ["fact"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "ADD_FINANCE_RECORD",
          description: "Dodaje nowy wpis finansowy (przychód lub wydatek) do budżetu.",
          parameters: {
              type: "object",
              properties: {
                  type: { type: "string", description: "'income' (przychód) lub 'expense' (wydatek)" },
                  amount: { type: "number", description: "Kwota (np. 150.50)" },
                  currency: { type: "string", description: "Waluta (np. 'PLN')" },
                  category: { type: "string", description: "Kategoria (np. 'Jedzenie', 'Transport', 'Wynagrodzenie')" },
                  bucket: { type: "string", description: "Opcjonalnie: 'needs', 'wants', 'savings'. Teraz używaj tego również dla przychodów (income), by przelać środki bezpośrednio do kubełka." },
                  description: { type: "string", description: "Opis transakcji" },
                  transaction_date: { type: "string", description: "Format YYYY-MM-DD" }
              },
              required: ["type", "amount", "transaction_date"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "TRANSFER_FUNDS",
          description: "Przelewa środki między dwoma kubełkami w budżecie (np. z 'wants' do 'needs').",
          parameters: {
              type: "object",
              properties: {
                  amount: { type: "number", description: "Kwota do przelania (np. 150)" },
                  from_bucket: { type: "string", description: "Kubełek źródłowy: 'needs', 'wants', 'savings' lub 'unassigned'" },
                  to_bucket: { type: "string", description: "Kubełek docelowy: 'needs', 'wants', 'savings' lub 'unassigned'" }
              },
              required: ["amount", "from_bucket", "to_bucket"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "ADD_WORKOUT",
          description: "Zapisuje zaplanowany lub wykonany trening do dziennika aktywności.",
          parameters: {
              type: "object",
              properties: {
                  title: { type: "string", description: "Tytuł treningu (np. 'Klatka i Biceps', 'Bieganie 10km')" },
                  type: { type: "string", description: "Typ (np. 'Siłowy', 'Cardio', 'Kalistenika', 'Rozciąganie', 'Inne')" },
                  description: { type: "string", description: "Szczegółowy plan lub notatki (np. ćwiczenia, serie, powtórzenia)" },
                  date: { type: "string", description: "Data w formacie YYYY-MM-DD" }
              },
              required: ["title", "date"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "DELETE_FINANCE_RECORD",
          description: "Usuwa wpis finansowy z bazy na podstawie ID.",
          parameters: {
              type: "object",
              properties: {
                  id: { type: "string", description: "ID transakcji finansowej do usunięcia" }
              },
              required: ["id"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "CHANGE_UI_TAB",
          description: "Przełącza widok u użytkownika na konkretną zakładkę w czasie rzeczywistym.",
          parameters: {
              type: "object",
              properties: {
                  tab: { type: "string", description: "Ścieżka zakładki, np. '/', '/chat', '/calendar', '/finances', '/osint', '/memory', '/search'" }
              },
              required: ["tab"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "RUN_OSINT_SCAN",
          description: "Zleca wykonanie skanowania OSINT na podanym celu i zwraca wyniki do Twojego kontekstu.",
          parameters: {
              type: "object",
              properties: {
                  target: { type: "string", description: "Adres email, nazwa użytkownika lub domena" }
              },
              required: ["target"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "UPDATE_SYSTEM_SETTINGS",
          description: "Zmienia ogólne ustawienia systemu OmniDash (np. motyw, język).",
          parameters: {
              type: "object",
              properties: {
                  theme: { type: "string", description: "Motyw (dark, light)" },
                  language: { type: "string", description: "Język (np. pl, en)" }
              },
              required: []
          }
      }
  },
  {
      type: "function",
      function: {
          name: "UPDATE_FINANCE_SETTINGS",
          description: "Aktualizuje ustawienia finansowe (deklarowany przychód i proporcje).",
          parameters: {
              type: "object",
              properties: {
                  monthly_income: { type: "number" },
                  needs_percent: { type: "number" },
                  wants_percent: { type: "number" },
                  savings_percent: { type: "number" }
              },
              required: []
          }
      }
  },
  {
      type: "function",
      function: {
          name: "RELOAD_SYSTEM",
          description: "Wymusza odświeżenie strony u użytkownika (np. po dużej zmianie konfiguracji).",
          parameters: {
              type: "object",
              properties: {},
              required: []
          }
      }
  },
  {
      type: "function",
      function: {
          name: "ADD_CALENDAR_EVENT",
          description: "Dodaje wydarzenie do kalendarza na konkretny dzień. Opcjonalnie z godziną, przypomnieniem oraz zasadą powtarzania.",
          parameters: {
              type: "object",
              properties: {
                  items: { type: 'array', description: 'Tablica obiektów (title, event_date, itp) dla masowego dodawania', items: { type: 'object' } },
                  title: { type: "string" },
                  event_date: { type: "string", description: "Format YYYY-MM-DD" },
                  event_time: { type: "string", description: "Opcjonalnie: Format HH:MM" },
                  description: { type: "string" },
                  recurrence_rule: { type: "string", description: "Opcjonalnie: zasada powtarzania np. 'weekly:wtorek:17:00' lub 'daily:15:00'" },
                  reminder_minutes: { type: "integer", description: "Opcjonalnie: ile minut przed wydarzeniem wysłać przypomnienie na telefon, np. 15, 60" }
              },
              required: ["title", "event_date"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "UPDATE_CALENDAR_EVENT",
          description: "Aktualizuje wydarzenie w kalendarzu. Możesz edytować wiele na raz podając tablicę 'items'.",
          parameters: {
              type: "object",
              properties: {
                  items: { type: 'array', description: 'Tablica obiektów {id, title, event_date, event_time, description} do masowej edycji', items: { type: 'object' } },
                  id: { type: "string", description: "ID wydarzenia do zmiany, albo lista ID (np. '1, 2')" },
                  title: { type: "string" },
                  event_date: { type: "string" },
                  event_time: { type: "string" },
                  description: { type: "string" }
              }
          }
      }
  },
  {
      type: "function",
      function: {
          name: "DELETE_CALENDAR_EVENT",
          description: "Usuwa wydarzenie z kalendarza na podstawie ID lub dokładnej daty.",
          parameters: {
              type: "object",
              properties: {
                  id: { type: "string", description: "ID wydarzenia z kontekstu (albo lista oddzielona przecinkiem np. '1, 2, 3')" },
                  event_date: { type: "string", description: "Format YYYY-MM-DD. Użyj jeśli chcesz usunąć wszystkie wydarzenia z danego dnia." }
              }
          }
      }
  },
  {
      type: "function",
      function: {
          name: "GET_CALENDAR_EVENTS",
          description: "Pobiera wszystkie wydarzenia z kalendarza w przedziale czasowym by znaleźć wolny czas.",
          parameters: {
              type: "object",
              properties: {
                  start_date: { type: "string", description: "Data startu, YYYY-MM-DD" },
                  end_date: { type: "string", description: "Data końca, YYYY-MM-DD" }
              },
              required: ["start_date", "end_date"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "GET_PHONE_NOTIFICATIONS",
          description: "Pobiera wszystkie nowe, nieprzeczytane powiadomienia z telefonu operatora. Opcjonalnie może przeszukać archiwum.",
          parameters: {
              type: "object",
              properties: {
                  include_read: {
                      type: "boolean",
                      description: "Jeżeli true, zwróci również starsze, już przeczytane powiadomienia (Archiwum). Jeśli false, zwróci tylko powiadomienia ze statusem is_read=0."
                  }
              },
              required: []
          }
      }
  },
  {
      type: "function",
      function: {
          name: "ADD_BUG_REPORT",
          description: "Zapisuje nowy błąd lub uwagę do pliku BUGS.md w głównym katalogu projektu. Używaj tego, gdy operator prosi o zapisanie błędu lub usterki.",
          parameters: {
              type: "object",
              properties: {
                  bug_description: {
                      type: "string",
                      description: "Krótki opis błędu lub zadania, np. 'Nie działa wczytywanie avatarów'."
                  },
                  severity: {
                      type: "string",
                      enum: ["krytyczne", "oczekujące"],
                      description: "Kategoria błędu: 'krytyczne' dla błędów psujących aplikację, 'oczekujące' dla zwykłych niedoróbek."
                  }
              },
              required: ["bug_description", "severity"]
          }
      }
  }
];
