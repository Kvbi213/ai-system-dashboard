import React, { useState, useEffect } from 'react';
import { CurrentLessonHero } from './components/CurrentLessonHero';
import { WeatherTrafficCapsule } from './components/WeatherTrafficCapsule';
import { ExecutiveTodoWidget, TaskItem } from './components/ExecutiveTodoWidget';
import { SystemTelemetryWidget } from './components/SystemTelemetryWidget';
import { ITNewsTickerBar } from './components/ITNewsTickerBar';
import { TodoSlideOverDrawer } from './components/TodoSlideOverDrawer';
import { tasksApi } from '../../api/client';

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Przygotować sprawdzian z Systemów Operacyjnych', completed: true, priority: 'high' },
    { id: '2', title: 'Wdrożyć audyt zabezpieczeń CSP Level 3 i RLS', completed: true, priority: 'high' },
    { id: '3', title: 'Trening FBW: drążek 5x5 i pompki na poręczach', completed: false, priority: 'medium' },
    { id: '4', title: 'Zaktualizować rejestr wydatków (koperta 50%)', completed: false, priority: 'low' },
    { id: '5', title: 'Zweryfikować stan kontenerów Docker w Mikr.us', completed: false, priority: 'medium' }
  ]);

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

  const [isTasksDrawerOpen, setIsTasksDrawerOpen] = useState(false);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    tasksApi.toggle(id).catch(() => {});
  };

  const handleAddTask = (title: string, priority: 'low' | 'medium' | 'high') => {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title,
      completed: false,
      priority
    };
    setTasks((prev) => [newTask, ...prev]);
    tasksApi.create({ title, priority: priority.toUpperCase() }).catch(() => {});
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    tasksApi.delete(id).catch(() => {});
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Ticker */}
      <ITNewsTickerBar />

      {/* Main Grid: Responsive layout for Phone, Tablet, Laptop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Lesson Hero - spans 2 cols on desktop */}
        <div className="md:col-span-2">
          <CurrentLessonHero />
        </div>

        {/* Weather & Road radar */}
        <div className="md:col-span-1">
          <WeatherTrafficCapsule />
        </div>

        {/* Priority Executive Tasks */}
        <div className="md:col-span-1">
          <ExecutiveTodoWidget
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onOpenDrawer={() => setIsTasksDrawerOpen(true)}
          />
        </div>

        {/* Edge Server Telemetry */}
        <div className="md:col-span-1 lg:col-span-2">
          <SystemTelemetryWidget />
        </div>
      </div>

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
