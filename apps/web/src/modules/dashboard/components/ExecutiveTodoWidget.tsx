import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { CheckCircle2, Circle, ChevronRight, CheckSquare } from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ExecutiveTodoWidgetProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onOpenDrawer: () => void;
}

export const ExecutiveTodoWidget: React.FC<ExecutiveTodoWidgetProps> = ({
  tasks,
  onToggleTask,
  onOpenDrawer
}) => {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length || 1;
  const percent = Math.round((completedCount / totalCount) * 100);

  // SVG ring radius & stroke
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <GlassCard className="p-4 flex flex-col justify-between" glow="none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Priorytety Dnia
            </h3>
            <p className="text-sm font-bold text-slate-100">
              {completedCount} z {tasks.length} ukończone
            </p>
          </div>
        </div>

        {/* Circular Progress SVG Ring */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="text-indigo-400 transition-all duration-500"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[11px] font-mono font-bold text-indigo-300">
            {percent}%
          </span>
        </div>
      </div>

      {/* Top 2 Urgent Tasks */}
      <div className="space-y-2 mb-3">
        {tasks.slice(0, 2).map((task) => (
          <div
            key={task.id}
            onClick={() => onToggleTask(task.id)}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition"
          >
            {task.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span
              className={`text-xs truncate ${
                task.completed ? 'line-through text-slate-500' : 'text-slate-200'
              }`}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onOpenDrawer}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-indigo-300 font-medium transition"
      >
        <span>Zobacz wszystkie zadania</span>
        <ChevronRight className="w-4 h-4 text-indigo-400" />
      </button>
    </GlassCard>
  );
};
