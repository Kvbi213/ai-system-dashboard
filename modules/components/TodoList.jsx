import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckSquare, Square, ListTodo, Trash2, Plus, Flag, RotateCcw, X } from 'lucide-react';

const PRIORITY_CONFIG = {
  HIGH: { color: '#FF3366', label: 'HIGH', bg: 'rgba(255,51,102,0.12)', border: 'rgba(255,51,102,0.35)' },
  MEDIUM: { color: '#FF9900', label: 'MED', bg: 'rgba(255,153,0,0.12)', border: 'rgba(255,153,0,0.35)' },
  LOW: { color: '#8F9CAE', label: 'LOW', bg: 'rgba(143,156,174,0.12)', border: 'rgba(143,156,174,0.3)' },
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
};

const TodoList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'MEDIUM', category: 'jednorazowe' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get('/api/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try { await axios.patch(`/api/tasks/${id}/status`, { status: newStatus }); }
    catch { fetchTasks(); }
  };

  const deleteTask = async (id, e) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await axios.delete(`/api/tasks/${id}`); }
    catch { fetchTasks(); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await axios.post('/api/tasks', {
        title: form.title.trim(),
        priority: form.priority,
        category: form.category,
        target_date: new Date().toISOString().split('T')[0],
        target_time: '12:00',
      });
      setForm({ title: '', priority: 'MEDIUM', category: 'jednorazowe' });
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      console.error('Error adding task', err);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = tasks.filter(t => t.status === 'pending');
  const done = tasks.filter(t => t.status === 'completed');

  return (
    <div className="glass-panel h-full rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border pb-2.5 flex-shrink-0">
        <ListTodo className="text-accentSecondary w-5 h-5" />
        <h2 className="font-mono text-sm uppercase tracking-widest text-textMuted flex-1">Task Pipeline</h2>
        <span className="font-mono text-xs text-textMuted">{pending.length} aktywne</span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="p-1.5 rounded-lg text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10 transition-all"
          title="Dodaj zadanie"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 flex-shrink-0 p-3 rounded-xl border border-accentPrimary/20 bg-accentPrimary/5">
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Tytuł zadania..."
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-sans text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accentPrimary transition-colors"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
            >
              <option value="HIGH">Priorytet: HIGH</option>
              <option value="MEDIUM">Priorytet: MEDIUM</option>
              <option value="LOW">Priorytet: LOW</option>
            </select>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
            >
              <option value="jednorazowe">Jednorazowe</option>
              <option value="powtarzalne">Powtarzalne</option>
              <option value="inne">Inne</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="w-full py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider bg-accentPrimary/20 border border-accentPrimary/40 text-accentPrimary hover:bg-accentPrimary/30 transition-all disabled:opacity-40"
          >
            {submitting ? 'DODAWANIE...' : '+ DODAJ ZADANIE'}
          </button>
        </form>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-10 skeleton rounded w-full" style={{ animationDelay: `${i*100}ms` }} />)
        ) : tasks.length === 0 ? (
          <div className="text-center text-textMuted text-xs font-mono mt-6 space-y-2">
            <ListTodo className="w-8 h-8 mx-auto opacity-20" />
            <p>Brak aktywnych procesów.</p>
          </div>
        ) : (
          <>
            {pending.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 cursor-pointer group hover:bg-white/[0.03] border-l-2"
                style={{ borderColor: PRIORITY_CONFIG[task.priority]?.color || '#8F9CAE' }}
                onClick={() => toggleTask(task.id, task.status)}
              >
                <Square className="w-4 h-4 flex-shrink-0 text-accentPrimary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans text-textPrimary truncate">{task.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <PriorityBadge priority={task.priority} />
                    {task.category === 'powtarzalne' && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-accentSecondary/70">
                        <RotateCcw className="w-2.5 h-2.5" /> cykliczne
                      </span>
                    )}
                    {task.target_date && (
                      <span className="text-[9px] font-mono text-textMuted">{task.target_date}</span>
                    )}
                  </div>
                </div>
                <button onClick={e => deleteTask(task.id, e)} className="p-1 text-textMuted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {done.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <p className="font-mono text-[10px] text-textMuted uppercase tracking-widest mb-1.5 px-1">Ukończone ({done.length})</p>
                {done.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg opacity-30 cursor-pointer hover:opacity-50 transition-opacity"
                    onClick={() => toggleTask(task.id, task.status)}
                  >
                    <CheckSquare className="w-4 h-4 flex-shrink-0 text-textMuted" />
                    <p className="text-xs font-sans text-textMuted line-through truncate">{task.title}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoList;
