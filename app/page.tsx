'use client';

import React, { useState, useEffect } from 'react';
import { Share2, FileText, Calendar, Clock, BarChart3, ArrowRight, Download, Cloud, Check, AlertCircle } from 'lucide-react';

interface MeetingReport {
  id: string;
  title: string;
  date: string;
  duration?: string;
  summary: string;
  insights: string[];
  participation: { name: string; percentage: number }[];
}

export default function Home() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [history, setHistory] = useState<MeetingReport[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('meeting_reports_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !title.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la información');
      }

      const newReport: MeetingReport = {
        id: Date.now().toString(),
        title,
        date,
        summary: data.summary || '',
        insights: data.insights || [],
        participation: data.participation || [],
      };

      setReport(newReport);
      const updatedHistory = [newReport, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('meeting_reports_history', JSON.stringify(updatedHistory));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans antialiased selection:bg-slate-200">
      {/* HEADER MINIMALISTA CON LOGO OPCIÓN 3 */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* LOGO OPCIÓN 3: Escudo de Texto Estructurado + Rayo */}
            <svg className="w-8 h-8 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 11h6" />
              <path d="M9 15h4" />
              <path d="M13 7l-2 4h4l-2 4" className="text-blue-600 stroke-[2.5]" />
            </svg>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">MinuteMind</h1>
              <p className="text-[11px] text-neutral-500 font-medium">Análisis Editorial de Videoconferencias</p>
            </div>
          </div>
          <div className="text-[11px] font-mono bg-neutral-100 border border-neutral-200 text-neutral-700 px-3 py-1 rounded-md shadow-sm font-semibold">
            Motor Gemini Conectado
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: FORMULARIO Y RESULTADO */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900 mb-5 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <FileText className="w-4 h-4 text-neutral-500" /> Cargar Nueva Reunión
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Título del Encuentro</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Análisis de Operaciones FLORSANI"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-medium placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Fecha del Informe</label>
                  <input 
                    type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-medium focus:outline-none focus:border-neutral-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Transcripción Completa (Texto Bruto)</label>
                <textarea 
                  required value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Pega aquí el bloque de texto de la videoconferencia sin importar su duración..."
                  rows={10}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-mono text-xs placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-white transition-all resize-y leading-relaxed"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
              >
                {loading ? (
                  <span className="animate-pulse">Estructurando datos con Gemini...</span>
                ) : (
                  <>Procesar Transcripción <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </section>

          {/* MENSAJES DE ERROR */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-red-800 mb-0.5">Aviso del Servidor</h4>
                <p className="text-xs font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* VISTA DEL INFORME PROCESADO */}
          {report && (
            <article className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">{report.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {report.date}</span>
                    <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Transcripción Procesada</span>
                  </div>
                </div>
              </div>

              {/* SÍNTESIS EDITORIAL (CON ALTO CONTRASTE TIPOGRÁFICO) */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase">Síntesis Ejecutiva</h4>
                <p className="text-sm text-neutral-900 leading-relaxed font-normal whitespace-pre-line bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  {report.summary}
                </p>
              </section>

              {/* GRID DETALLES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
                {/* ACUERDOS CLAVE */}
                <section className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase">Puntos Críticos y Acuerdos</h4>
                  <ul className="space-y-2">
                    {report.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-900 bg-white border border-neutral-200 p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-xs text-neutral-400 mt-0.5">{idx + 1}.</span>
                        <span className="font-medium">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* GRÁFICO DE PARTICIPACIÓN */}
                <section className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase">Métrica de Participación</h4>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-5">
                    {/* Donut SVG */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e5e5" strokeWidth="3" />
                        {(() => {
                          let accumulated = 0;
                          const colors = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1', '#e2e8f0'];
                          return report.participation.map((p, i) => {
                            const strokeDasharray = `${p.percentage} ${100 - p.percentage}`;
                            const strokeDashoffset = 100 - accumulated;
                            accumulated += p.percentage;
                            return (
                              <circle 
                                key={i} cx="18" cy="18" r="15.915" fill="none" 
                                stroke={colors[i % colors.length]} strokeWidth="3.2" 
                                strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} 
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-neutral-500" />
                      </div>
                    </div>

                    {/* Leyenda minimalista */}
                    <div className="space-y-1.5 w-full">
                      {report.participation.map((p, i) => {
                        const colors = ['bg-slate-900', 'bg-slate-600', 'bg-slate-400', 'bg-slate-300', 'bg-slate-200'];
                        return (
                          <div key={i} className="flex items-center justify-between text-xs border-b border-neutral-200 pb-1 last:border-0">
                            <div className="flex items-center gap-2 font-semibold text-neutral-800 truncate max-w-[120px]">
                              <span className={`w-2 h-2 ${colors[i % colors.length]} rounded-full shrink-0`} />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold text-neutral-900">{p.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            </article>
          )}
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center justify-between border-b border-neutral-100 pb-2">
              <span>Historial Grabado</span>
              <span className="bg-neutral-100 text-neutral-700 font-mono text-xs px-2 py-0.5 rounded-md font-semibold border border-neutral-200">{history.length}</span>
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-neutral-200 rounded-lg bg-neutral-50">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Historial vacío</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {history.map((h) => (
                  <div 
                    key={h.id} onClick={() => setReport(h)}
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer bg-white group ${
                      report?.id === h.id 
                        ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-sm' 
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-xs text-neutral-900 truncate group-hover:text-neutral-700">{h.title}</h3>
                      <span className="text-[10px] font-mono font-semibold text-neutral-400 whitespace-nowrap bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 rounded">
                        {h.date}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {h.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-neutral-100 justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); alert('¡Preparado para conectar con tu Webhook de Drive!'); }}
                        className="text-[10px] font-bold uppercase text-neutral-500 hover:text-neutral-900 flex items-center gap-1 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded transition-colors"
                      >
                        <Cloud className="w-2.5 h-2.5" /> Subir a Drive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}