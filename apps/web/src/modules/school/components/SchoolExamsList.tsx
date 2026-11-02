import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { schoolApi } from '../../../api/client';

export interface ExamItem {
  id: string;
  date: string;
  subject: string;
  type: 'sprawdzian' | 'kartkowka' | 'projekt' | 'absence';
  topic: string;
  classroom: string;
}

const FALLBACK_EXAMS: ExamItem[] = [
  {
    id: 'e1',
    date: '31 paź (Wtorek)',
    subject: 'Bazy Danych SQL',
    type: 'sprawdzian',
    topic: 'Złożone zapytania SELECT, JOIN, klauzule GROUP BY i HAVING',
    classroom: 'Pracownia 202'
  },
  {
    id: 'e2',
    date: '02 lis (Czwartek)',
    subject: 'Sieci Komputerowe Cisco',
    type: 'kartkowka',
    topic: 'Adresacja IPv4 / IPv6 i maski podsieci VLSM',
    classroom: 'Pracownia 208'
  },
  {
    id: 'e3',
    date: '06 lis (Poniedziałek)',
    subject: 'Projektowanie Oprogramowania',
    type: 'projekt',
    topic: 'Oddanie diagramu klas UML i wzorców projektowych GoF',
    classroom: 'Pracownia 204'
  }
];

export const SchoolExamsList: React.FC = () => {
  const [exams, setExams] = useState<ExamItem[]>(FALLBACK_EXAMS);

  useEffect(() => {
    schoolApi.getEvents()
      .then((res) => {
        if (res?.events && res.events.length > 0) {
          const mapped: ExamItem[] = res.events.map((ev: any) => ({
            id: String(ev.id),
            date: ev.date,
            subject: ev.category || 'Wydarzenie',
            type: ev.type === 'sprawdzian' ? 'sprawdzian' : ev.type === 'kartkowka' ? 'kartkowka' : 'projekt',
            topic: ev.title,
            classroom: ev.teacher ? `Nauczyciel: ${ev.teacher}` : 'Sala lekcyjna'
          }));
          setExams(mapped);
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Terminarz Sprawdzianów</h3>
            <p className="text-xs text-slate-500 font-medium">Najbliższe wydarzenia z Librusa</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
          {exams.length} zaplanowane
        </span>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5 shrink-0">
                <BookOpen className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">{exam.subject}</h4>
                  <Badge variant={exam.type === 'sprawdzian' ? 'danger' : exam.type === 'kartkowka' ? 'warning' : 'info'}>
                    {exam.type === 'sprawdzian' ? 'Sprawdzian' : exam.type === 'kartkowka' ? 'Kartkówka' : 'Projekt'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">{exam.topic}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{exam.classroom}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-700 font-mono shrink-0 self-start sm:self-center">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{exam.date}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
