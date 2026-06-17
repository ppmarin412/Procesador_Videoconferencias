'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, BarChart3, ArrowRight, Cloud, AlertCircle, FileEdit, ListChecks, Target, Check } from 'lucide-react';

interface MeetingReport {
  id: string;
  title: string;
  date: string;
  summary: string;
  insights: string[];
  participation: { name: string; percentage: number }[];
  type?: string;
}

export default function Home() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [text, setText] = useState('');
  const [summaryType, setSummaryType] = useState<'general' | 'keypoints' | 'action'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [history, setHistory] = useState<MeetingReport[]>([]);
  const [uploadingDrive, setUploadingDrive] = useState<string | null>(null);

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
        body: JSON.stringify({ title, date, text, summaryType }),
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
        type: summaryType
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

  const uploadToDrive = async (reportToUpload: MeetingReport) => {
    setUploadingDrive(reportToUpload.id);
    try {
      const response = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportToUpload.title,
          date: reportToUpload.date,
          summary: reportToUpload.summary,
          insights: reportToUpload.insights
        }),
      });
      
      if (!response.ok) throw new Error('Error en la carga');
      alert('¡Documento guardado exitosamente en Google Drive!');
    } catch (err) {
      alert('No se pudo subir a Google Drive. Revisa tu configuración de API.');
    } finally {
      setUploadingDrive(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-[#4A4036] font-sans antialiased selection:bg-[#E6DFD3]">
      
      {/* HEADER WARM MINIMALIST CON LOGO OPCIÓN 3 */}
      <header className="bg-[#EFEAE2] border-b border-[#DCD3C5] sticky top-0 z-50 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* LOGO OPCIÓN 3 */}
            <svg className="w-8 h-8 text-[#65594C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 11h6" />
              <path d="M9 15h4" />
              <path d="M13 7l-2 4h4l-2 4" className="text-[#A38A70] stroke-[2.5]" />
            </svg>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-light tracking-wide text-[#3D342B] font-serif">MinuteMind</h1>
              <p className="text-xs text-[#8C7E6E] tracking-wider font-medium mt-0.5">Procesador de Videoconferencias</p>
            </div>
          </div>
          <div className="text-[11px] font-mono bg-[#E6DFD3] text-[#5C5043] px-3 py-1.5 rounded-full border border-[#D3C8B7] font-medium">
            Motor Gemini Pro Activo
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN, TEXTO Y REPORTES */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#EFEAE2] rounded-2xl p-6 border border-[#DCD3C5] shadow-sm">
            <h2 className="text-sm font-semibold text-[#5C5043] uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-[#DCD3C5] pb-3">
              <FileText className="w-4 h-4 text-[#8C7E6E]" /> Configuración del Procesador
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7C6E5E] mb-1.5">Título de la Reunión</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Planificación Semanal FLORSANI"
                    className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#DCD3C5] rounded-xl text-[#3D342B] placeholder-[#B5A99A] focus:outline-none focus:border-[#A38A70] transition-colors text-sm font-medium shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C6E5E] mb-1.5">Fecha del Encuentro</label>
                  <input 
                    type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#DCD3C5] rounded-xl text-[#3D342B] focus:outline-none focus:border-[#A38A70] transition-colors text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              {/* OPCIONES DE RESUMEN RESTAURADAS */}
              <div>
                <label className="block text-xs font-medium text-[#7C6E5E] mb-2">Enfoque del Análisis Editorial</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button" onClick={() => setSummaryType('general')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'general'
                        ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm'
                        : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <FileEdit className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold leading-none">General</p>
                      <p className="text-[10px] opacity-80 mt-1">Visión global estructurada</p>
                    </div>
                  </button>

                  <button
                    type="button" onClick={() => setSummaryType('keypoints')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'keypoints'
                        ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm'
                        : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <ListChecks className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold leading-none">Puntos Clave</p>
                      <p className="text-[10px] opacity-80 mt-1">Acuerdos y datos críticos</p>
                    </div>
                  </button>

                  <button
                    type="button" onClick={() => setSummaryType('action')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'action'
                        ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm'
                        : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <Target className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold leading-none">Plan de Acción</p>
                      <p className="text-[10px] opacity-80 mt-1">Tareas, fechas y responsables</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#7C6E5E] mb-1.5">Bloque de Transcripción Bruta</label>
                <textarea 
                  required value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Pega el texto obtenido de tu videoconferencia aquí..."
                  rows={8}
                  className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#DCD3C5] rounded-xl text-[#4A4036] font-mono text-xs placeholder-[#B5A99A] focus:outline-none focus:border-[#A38A70] transition-colors resize-y leading-relaxed shadow-inner"
                />
              </div>

              {/* BOTÓN CON PROCESAMIENTO IA RESTAURADO */}
              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#65594C] hover:bg-[#53493E] text-[#FBF9F6] font-medium text-sm py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse tracking-wide font-light">Procesando Transcripción con IA...</span>
                ) : (
                  <>Procesar con Inteligencia Artificial <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </section>

          {error && (
            <div className="bg-[#F2EAE4] border border-[#DFD0C5] text-[#734A35] p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-4 h-4 text-[#A66846] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider mb-0.5">Nota del Sistema</h4>
                <p className="text-xs font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* VISTA DEL INFORME EN TONOS TIERRA */}
          {report && (
            <article className="bg-[#EFEAE2] rounded-2xl p-6 border border-[#DCD3C5] shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-[#DCD3C5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-light font-serif text-[#3D342B]">{report.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-medium text-[#8C7E6E] mt-1.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {report.date}</span>
                    <span className="w-1 h-1 bg-[#DCD3C5] rounded-full" />
                    <span className="uppercase font-bold text-[10px] tracking-wider text-[#A38A70]">Enfoque: {report.type || 'General'}</span>
                  </div>
                </div>
                <button
                  onClick={() => uploadToDrive(report)}
                  disabled={uploadingDrive === report.id}
                  className="sm:self-center text-xs font-medium uppercase tracking-wider text-[#FBF9F6] bg-[#A38A70] hover:bg-[#8C755E] flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-40"
                >
                  <Cloud className="w-4 h-4" />
                  {uploadingDrive === report.id ? 'Subiendo...' : 'Guardar en Drive'}
                </button>
              </div>

              <section className="space-y-2">
                <h4 className="text-xs font-bold tracking-widest text-[#8C7E6E] uppercase">Informe Procesado</h4>
                <p className="text-sm text-[#4A4036] leading-relaxed whitespace-pre-line bg-[#FBF9F6] border border-[#EBE3D5] rounded-xl p-4 shadow-inner font-medium">
                  {report.summary}
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#DCD3C5]">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold tracking-widest text-[#8C7E6E] uppercase">Bloques de Control</h4>
                  <ul className="space-y-2">
                    {report.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-[#4A4036] bg-[#FBF9F6] border border-[#EBE3D5] p-3.5 rounded-xl shadow-sm font-medium">
                        <span className="font-bold text-xs text-[#B5A99A] mt-0.5">{idx + 1}.</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold tracking-widest text-[#8C7E6E] uppercase">Participación Detectada</h4>
                  <div className="bg-[#FBF9F6] border border-[#EBE3D5] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-5 shadow-sm">
                    <div className="relative w-28 h-28 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EFEAE2" strokeWidth="3" />
                        {(() => {
                          let accumulated = 0;
                          const colors = ['#65594C', '#8C7E6E', '#A38A70', '#C4B49F', '#DFD3C3'];
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
                        <BarChart3 className="w-4 h-4 text-[#8C7E6E]" />
                      </div>
                    </div>

                    <div className="space-y-1.5 w-full">
                      {report.participation.map((p, i) => {
                        const colors = ['bg-[#65594C]', 'bg-[#8C7E6E]', 'bg-[#A38A70]', 'bg-[#C4B49F]', 'bg-[#DFD3C3]'];
                        return (
                          <div key={i} className="flex items-center justify-between text-xs border-b border-[#EFEAE2] pb-1 last:border-0 font-medium">
                            <div className="flex items-center gap-2 text-[#4A4036] truncate max-w-[120px]">
                              <span className={`w-2 h-2 ${colors[i % colors.length]} rounded-full shrink-0`} />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold text-[#3D342B]">{p.percentage}%</span>
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
          <section className="bg-[#EFEAE2] rounded-2xl p-5 border border-[#DCD3C5] shadow-sm">
            <h2 className="text-xs font-bold text-[#8C7E6E] uppercase tracking-widest mb-4 flex items-center justify-between border-b border-[#DCD3C5] pb-2">
              <span>Archivo de Sesiones</span>
              <span className="bg-[#DCD3C5] text-[#4A4036] font-mono text-xs px-2 py-0.5 rounded-full font-semibold">{history.length}</span>
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-[#DCD3C5] rounded-xl bg-[#FBF9F6]">
                <p className="text-xs font-medium text-[#B5A99A] uppercase tracking-wider">Sin sesiones registradas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {history.map((h) => (
                  <div 
                    key={h.id} onClick={() => setReport(h)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer bg-[#FBF9F6] ${
                      report?.id === h.id 
                        ? 'border-[#65594C] ring-1 ring-[#65594C] shadow-sm' 
                        : 'border-[#EBE3D5] hover:border-[#C4B49F]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm text-[#3D342B] truncate">{h.title}</h3>
                      <span className="text-[10px] font-mono font-medium text-[#8C7E6E] whitespace-nowrap bg-[#EFEAE2] px-2 py-0.5 border border-[#DCD3C5] rounded-md">
                        {h.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#7C6E5E] line-clamp-2 mt-2 leading-relaxed font-medium">
                      {h.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#EFEAE2] justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); uploadToDrive(h); }}
                        disabled={uploadingDrive === h.id}
                        className="text-[10px] font-medium uppercase tracking-wider text-[#7C6E5E] hover:text-[#3D342B] flex items-center gap-1 bg-[#EFEAE2] border border-[#DCD3C5] px-2.5 py-1 rounded-md transition-colors shadow-sm disabled:opacity-40"
                      >
                        <Cloud className="w-3 h-3 text-[#8C7E6E]" />
                        {uploadingDrive === h.id ? 'Subiendo...' : 'Subir a Drive'}
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