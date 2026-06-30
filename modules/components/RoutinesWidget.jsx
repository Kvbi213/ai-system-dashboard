import React from 'react';
import { Sun, Moon, Zap, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../context/ChatContext';

const RoutinesWidget = () => {
  const navigate = useNavigate();
  const { sendCommand } = useChatContext();

  const handleRoutine = (title, command) => {
    navigate('/chat');
    // Uruchomienie komendy jako użytkownik
    sendCommand(command);
  };

  const routines = [
    {
      title: 'Poranny Raport',
      description: 'Pogoda, dzisiejszy kalendarz, zadania',
      icon: <Sun className="w-6 h-6 text-yellow-500" />,
      command: 'Wygeneruj szczegółowy Poranny Raport. Pobierz aktualną pogodę, wylistuj moje nadchodzące wydarzenia z kalendarza, a następnie podaj mi moje zadania do zrobienia na dzisiaj. Podsumuj to w zwięzły i motywujący sposób.',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      hoverBorder: 'hover:border-yellow-500/80'
    },
    {
      title: 'Wieczorny Skan',
      description: 'Podsumowanie dnia, IT News',
      icon: <Moon className="w-6 h-6 text-blue-400" />,
      command: 'Zrób Wieczorny Skan. Pobierz 3 najciekawsze nowości ze świata IT/AI z dzisiaj, zobacz moje ukończone zadania z dzisiaj i wygeneruj krótkie podsumowanie całego dnia.',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30',
      hoverBorder: 'hover:border-blue-400/80'
    },
    {
      title: 'Status Systemu',
      description: 'Zasoby, obciążenie, pamięć',
      icon: <Activity className="w-6 h-6 text-green-500" />,
      command: 'Zrób szybki audyt Statusu Systemu. Wyświetl widżet z logami i zrób krótkie podsumowanie stabilności infrastruktury System.',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      hoverBorder: 'hover:border-green-500/80'
    },
    {
      title: 'Zresetuj Kontekst',
      description: 'Wyczyść czat i bufor',
      icon: <Zap className="w-6 h-6 text-accentPrimary" />,
      command: '/clear', // Zakładając, że na backendzie można obsłużyć komendę czyszczącą, albo po prostu wyśle ukryty tekst. Pamiętajmy, że na razie czyścimy po prostu pytając o coś nowego.
      bgColor: 'bg-accentPrimary/10',
      borderColor: 'border-accentPrimary/30',
      hoverBorder: 'hover:border-accentPrimary/80'
    }
  ];

  return (
    <div className="glass-panel border border-border rounded-xl p-5 w-full h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accentPrimary/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm uppercase text-textMuted tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-accentPrimary" /> Procedury / Makra
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {routines.map((r, idx) => (
          <button
            key={idx}
            onClick={() => handleRoutine(r.title, r.command)}
            className={`flex flex-col items-start p-3 rounded-lg border ${r.borderColor} ${r.bgColor} ${r.hoverBorder} transition-all text-left group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 rounded-md bg-black/40 border border-border group-hover:scale-110 transition-transform">
                {r.icon}
              </div>
              <span className="font-mono text-sm text-textPrimary font-bold uppercase tracking-wider">{r.title}</span>
            </div>
            <span className="font-mono text-[10px] text-textMuted mt-auto leading-tight">{r.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoutinesWidget;
