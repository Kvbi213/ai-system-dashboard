import React, { useState, useEffect } from 'react';
import { Calendar, Plus, AlertCircle, UserX } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { MonthGridCalendar, CalendarEventItem } from './components/MonthGridCalendar';
import { EventModal } from './components/EventModal';
import { useToast } from '../../components/ui/Toast';
import { calendarApi } from '../../api/client';

const CALENDAR_CACHE_KEY = 'omnidash_calendar_events_v4';

function getInitialCalendarEvents(): CalendarEventItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CALENDAR_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore error
  }
  return [];
}

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEventItem[]>(getInitialCalendarEvents);
  const [activeTab, setActiveTab] = useState<'all' | 'exams' | 'absences'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const fetchEvents = async () => {
    setIsRefreshing(true);
    try {
      const res = await calendarApi.getEvents();
      if (res && res.events) {
        setEvents(res.events);
        try {
          localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(res.events));
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      console.warn('[!] Błąd pobierania wydarzeń kalendarza:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (newEvent: { title: string; date: string; category: string; description: string }) => {
    try {
      await calendarApi.addEvent(newEvent);
      toast.success('Dodano wydarzenie do terminarza!');
      fetchEvents();
    } catch {
      // Optymistyczne dodanie lokalnie
      const localEvt: CalendarEventItem = {
        id: `local_${Date.now()}`,
        ...newEvent
      };
      setEvents((prev) => [localEvt, ...prev]);
      toast.success('Zapisano wydarzenie w lokalnym terminarzu');
    }
  };

  const handleDeleteEvent = async (id: string | number) => {
    try {
      await calendarApi.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Usunięto wydarzenie z terminarza');
    } catch {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Usunięto wydarzenie');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (activeTab === 'exams') {
      const c = (e.category || e.type || '').toLowerCase();
      return c.includes('sprawdzian') || c.includes('kartkówka') || c.includes('exam');
    }
    if (activeTab === 'absences') {
      const c = (e.category || e.type || '').toLowerCase();
      return c.includes('nieobecność') || c.includes('absence');
    }
    return true;
  });

  const tabs = [
    { id: 'all', label: 'Wszystkie Wydarzenia', icon: Calendar },
    { id: 'exams', label: 'Sprawdziany & Kartkówki', icon: AlertCircle },
    { id: 'absences', label: 'Nieobecności Nauczycieli', icon: UserX }
  ] as const;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <PageHeader
        icon={Calendar}
        title="Terminarz & Kalendarz Szkolny"
        subtitle="Zintegrowany kalendarz sprawdzianów, kartkówek i wydarzeń osobistych"
        badge="Terminarz v4.0"
        badgeVariant="sky"
        onRefresh={fetchEvents}
        isRefreshing={isRefreshing}
        refreshLabel="Odśwież"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowe Wydarzenie</span>
          </button>
        }
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <MonthGridCalendar
        events={filteredEvents}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onDeleteEvent={handleDeleteEvent}
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};
