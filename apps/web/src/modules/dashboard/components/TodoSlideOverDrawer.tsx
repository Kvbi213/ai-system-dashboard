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
    <BottomActionSheet isOpen={isOpen} onClose={onClose} title="Zadania Wykonawcze">
      <div className="space-y-4 py-1">
        {/* Quick Add Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj nowe zadanie priorytetowe..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj</span>
          </button>
        </form>

        {/* Filters */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          {(['all', 'pending', 'done'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition capitalize ${
                filter === tab
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
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
                className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-slate-200/80 hover:border-slate-300 shadow-sm transition"
              >
                <div
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-800 font-semibold'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Usuń zadanie"
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
