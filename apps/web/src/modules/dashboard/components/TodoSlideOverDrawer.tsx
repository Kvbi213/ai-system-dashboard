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
      <div className="space-y-4 py-2">
        {/* Quick Add Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj nowe zadanie priorytetowe..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-sky-500 text-white font-medium text-sm flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj</span>
          </button>
        </form>

        {/* Filters */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          {(['all', 'pending', 'done'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition capitalize ${
                filter === tab
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'Wszystkie' : tab === 'pending' ? 'Do zrobienia' : 'Ukończone'}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Brak zadań w wybranym filtrze.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
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
