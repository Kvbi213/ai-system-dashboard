import React, { useState } from 'react';
import { BottomActionSheet } from '../../../components/ui/BottomActionSheet';
import { TaskItem } from './ExecutiveTodoWidget';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

interface TodoSlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, priority: 'low' | 'medium' | 'high') => void;
  onDeleteTask: (id: string) => void;
}

export const TodoSlideOverDrawer: React.FC<TodoSlideOverDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), 'medium');
    setNewTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  return (
    <BottomActionSheet isOpen={isOpen} onClose={onClose} title="Zadania">
      <div className="space-y-4 py-1">
        {/* Quick Add Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj nowe zadanie..."
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-sm flex items-center gap-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj</span>
          </button>
        </form>

        {/* Filters */}
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {(['all', 'pending', 'done'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                filter === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab === 'all' ? 'Wszystkie' : tab === 'pending' ? 'Do zrobienia' : 'Ukończone'}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              Brak zadań w wybranym filtrze.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs transition"
              >
                <div
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100 font-medium'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                  title="Usuń zadanie"
                  aria-label="Usuń zadanie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </BottomActionSheet>
  );
};
