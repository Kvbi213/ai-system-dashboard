import React, { useState, useEffect } from 'react';
import { ITNewsTickerBar } from './components/ITNewsTickerBar';
import { DashboardKpiDeck } from './components/DashboardKpiDeck';
import { CurrentLessonHero } from './components/CurrentLessonHero';
import { WeatherTrafficCapsule } from './components/WeatherTrafficCapsule';
import { DailyTimelineWidget } from './components/DailyTimelineWidget';
import { TodoSlideOverDrawer } from './components/TodoSlideOverDrawer';
import { TaskItem } from './components/ExecutiveTodoWidget';
import { tasksApi } from '../../api/client';

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Przygotować sprawdzian z Systemów Operacyjnych', completed: true, priority: 'high' },
    { id: '2', title: 'Wdrożyć audyt zabezpieczeń CSP Level 3 i RLS', completed: true, priority: 'high' },
    { id: '3', title: 'Trening FBW: drążek 5x5 i pompki na poręczach', completed: false, priority: 'medium' },
    { id: '4', title: 'Zaktualizować rejestr wydatków (koperta 50%)', completed: false, priority: 'low' },
    { id: '5', title: 'Zweryfikować stan kontenerów Docker w Mikr.us', completed: false, priority: 'medium' }
  ]);
  const [isTasksDrawerOpen, setIsTasksDrawerOpen] = useState(false);

  useEffect(() => {
    tasksApi.getAll()
      .then((res) => {
        if (res.tasks && res.tasks.length > 0) {
          setTasks(
            res.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              priority: (t.priority?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high'
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    tasksApi.toggle(id).catch(() => {});
  };

  const handleAddTask = (title: string, priority: 'low' | 'medium' | 'high') => {
    const newTask: TaskItem = { id: Date.now().toString(), title, completed: false, priority };
    setTasks((prev) => [newTask, ...prev]);
    tasksApi.create({ title, priority: priority.toUpperCase() }).catch(() => {});
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    tasksApi.delete(id).catch(() => {});
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
    percent: tasks.length > 0 ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0
  };

  return (
    <div className="space-y-2.5 max-w-7xl mx-auto">
      {/* 1. IT News Ticker */}
      <ITNewsTickerBar />

      {/* 2. Top 3-KPI Deck (Zadania, FBW, Budżet) */}
      <DashboardKpiDeck taskStats={taskStats} onOpenTasks={() => setIsTasksDrawerOpen(true)} />

      {/* 3. Core Lesson & Traffic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-stretch">
        <div className="lg:col-span-2 flex">
          <CurrentLessonHero />
        </div>
        <div className="lg:col-span-1 flex">
          <WeatherTrafficCapsule />
        </div>
      </div>

      {/* 4. Daily Timeline */}
      <DailyTimelineWidget />

      {/* Slide-over sheet for full task management */}
      <TodoSlideOverDrawer
        isOpen={isTasksDrawerOpen}
        onClose={() => setIsTasksDrawerOpen(false)}
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};
