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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100">
      {/* HEADER DE ALTO CONTRASTE CON NUEVO LOGOTIPO */}
      <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-50 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* LOGO OPCIÓN A: Bombilla + Ondas de Audio */}
            <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M2 8h2" />
              <path d="M20 8h2" />
              <path d="M5 3l1.5 1.5" />
              <path d="M17.5 4.5L19 3" />
            </svg>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">MinuteMind</h1>
              <p className="text-xs font-bold text-blue-700 tracking-wider uppercase">Analista Editorial de Reuniones</p>
            </div>
          </div>
          <div className="text-xs font-mono bg-slate-950 text-white px-3 py-1.5 rounded-md uppercase font-bold tracking-md shadow-sm">
            Entorno de Alta Capacidad • Gemini Activo
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide border-b-2 border-slate-200 pb-2">
              <FileText className="w-5 h-5 text-blue-600" /> Nueva Transcripción
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-900 mb-1.5 tracking-wider">Título del Encuentro</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Reunión Mensual FLORSANI"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-lg text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-900 mb-1.5 tracking-wider">Fecha del Informe</label>
                  <input 
                    type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-900 mb-1.5 tracking-wider">Cuerpo de la Transcripción (Texto Bruto)</label>
                <textarea 
                  required value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Pega aquí todo el texto copiado de la videoconferencia sin importar su longitud..."
                  rows={12}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-lg text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-y"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4 px-6 rounded-lg border-2 border-slate-900 transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-pulse">Analizando Reunión Masiva...</span>
                  </>
                ) : (
                  <>Procesar con Inteligencia Artificial <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </section>

          {/* MENSAJES DE ERROR */}
          {error && (
            <div className="bg-red-50 border-2 border-red-900 text-red-950 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold uppercase text-xs tracking-wider text-red-900 mb-1">Error de Comunicación</h4>
                <p className="text-sm font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* PANEL DE RESULTADOS RE-DISEÑADO */}
          {report && (
            <article className="bg-white rounded-xl border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-8 animate-fadeIn">
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase text-blue-700 tracking-widest">Informe Generado</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">{report.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {report.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Documento Completo</span>
                  </div>
                </div>
              </div>

              {/* RESUMEN EDITORIAL */}
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 inline-block border border-slate-400 rounded">
                  SÍNTESIS EJECUTIVA
                </h4>
                <p className="text-base text-slate-800 leading-relaxed font-normal whitespace-pre-line bg-slate-50 p-4 border border-slate-300 rounded-lg">
                  {report.summary}
                </p>
              </section>

              {/* DOS COLUMNAS: INSIGHTS + GRÁFICO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
                {/* ACUERDOS ClAVE */}
                <section className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 inline-block border border-slate-400 rounded">
                    PUNTOS CRÍTICOS Y ACUERDOS
                  </h4>
                  <ul className="space-y-2.5">
                    {report.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-800 font-medium leading-relaxed bg-white border border-slate-200 p-2.5 rounded-md shadow-sm">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs rounded flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* GRÁFICO DE DONUT DE ALTO CONTRASTE */}
                <section className="space-y-3 flex flex-col">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 inline-block border border-slate-400 rounded self-start">
                    MÉTRICA DE PARTICIPACIÓN
                  </h4>
                  
                  <div className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                    {/* Gráfico Donut SVG */}
                    <div className="relative w-32 h-32 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                        {(() => {
                          let accumulated = 0;
                          const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                          return report.participation.map((p, i) => {
                            const strokeDasharray = `${p.percentage} ${100 - p.percentage}`;
                            const strokeDashoffset = 100 - accumulated;
                            accumulated += p.percentage;
                            return (
                              <circle 
                                key={i} cx="18" cy="18" r="15.915" fill="none" 
                                stroke={colors[i % colors.length]} strokeWidth="3.8" 
                                strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} 
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent">
                        <BarChart3 className="w-5 h-5 text-slate-700" />
                        <span className="text-[10px] font-black uppercase text-slate-600 mt-0.5">Voz %</span>
                      </div>
                    </div>

                    {/* Leyenda con textos oscuros */}
                    <div className="space-y-1.5 w-full">
                      {report.participation.map((p, i) => {
                        const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-pink-500'];
                        return (
                          <div key={i} className="flex items-center justify-between text-xs border-b border-slate-200 pb-1 last:border-0">
                            <div className="flex items-center gap-2 font-bold text-slate-800 truncate max-w-[120px]">
                              <span className={`w-2.5 h-2.5 ${colors[i % colors.length]} rounded-full shrink-0`} />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-slate-950">{p.percentage}%</span>
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

        {/* COLUMNA DERECHA: HISTORIAL DE ALTO CONTRASTE */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-between border-b-2 border-slate-200 pb-2">
              <span>Historial Grabado</span>
              <span className="bg-slate-950 text-white font-mono text-xs px-2 py-0.5 rounded-full font-bold">{history.length}</span>
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Sin registros locales</p>
                <p className="text-xs text-slate-400 mt-1">Los informes procesados se guardarán automáticamente aquí.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {history.map((h) => (
                  <div 
                    key={h.id} onClick={() => setReport(h)}
                    className={`p-3.5 rounded-lg border-2 text-left transition-all cursor-pointer bg-white group ${
                      report?.id === h.id 
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' 
                        : 'border-slate-300 hover:border-slate-900 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-blue-700">{h.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded">
                        {h.date}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {h.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); alert('¡Próximamente disponible para configurar con tu Webhook!'); }}
                        className="text-[11px] font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1 bg-slate-100 border border-slate-300 px-2 py-1 rounded transition-colors"
                        title="Subir a Google Drive"
                      >
                        <Cloud className="w-3 h-3" /> Drive
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