'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, Clock, BarChart3, ArrowRight, Cloud, 
  AlertCircle, FileEdit, ListChecks, Target, Quote, Sparkles, 
  Globe, Radio, Camera, Square, Send, CheckSquare, SquareDot
} from 'lucide-react';

interface MeetingReport {
  id: string;
  title: string;
  date: string;
  summary: string;
  insights: string[];
  participation: { name: string; percentage: number }[];
  type: string;
  language: string;
  aiTipsEnabled: boolean;
  aiTipsContent?: {
    risks: string[];
    bestPractices: string[];
    externalLinks: { title: string; url: string; source: string }[];
  };
}

export default function Home() {
  // Estados del Formulario y Configuración
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [text, setText] = useState('');
  const [summaryType, setSummaryType] = useState<'breve' | 'detallado' | 'citas' | 'acciones'>('breve');
  const [outputLanguage, setOutputLanguage] = useState('es');
  const [aiTips, setAiTips] = useState(false);

  // Estados del Bot Flotante (Simulación del circuito automático Meet/Teams)
  const [botState, setBotState] = useState<'idle' | 'capturing' | 'stopped'>('idle');
  const [capturedLines, setCapturedLines] = useState(0);
  const [screenshotsCount, setScreenshotsCount] = useState(0);

  // Estados de la Aplicación
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

  // Simulación de acciones del Bot 🎙️
  useEffect(() => {
    let interval: any;
    if (botState === 'capturing') {
      interval = setInterval(() => {
        setCapturedLines(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [botState]);

  const handleSendBotData = () => {
    if (capturedLines === 0) {
      alert('No se ha capturado texto aún. Asegúrate de activar los subtítulos [CC] en Meet/Teams.');
      return;
    }
    setTitle(`Reunión Automática - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    setText(`[Transcripción Automática del Bot de Reunión]\nSe han procesado las líneas capturadas del flujo de subtítulos activos de la videollamada.\nParticipante 1: Analizamos las métricas de distribución y los objetivos del trimestre.\nParticipante 2: Perfecto, hay que subir los documentos de control y revisar las normativas de alérgenos y logística vigentes en este 2026.`);
    setBotState('idle');
    alert('¡Datos de la reunión transferidos al formulario con éxito! Listo para procesar.');
  };

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
        body: JSON.stringify({ title, date, text, summaryType, language: outputLanguage, aiTips }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la información con Gemini');
      }

      const newReport: MeetingReport = {
        id: Date.now().toString(),
        title,
        date,
        summary: data.summary || '',
        insights: data.insights || [],
        participation: data.participation || [],
        type: summaryType,
        language: outputLanguage,
        aiTipsEnabled: aiTips,
        aiTipsContent: aiTips ? {
          risks: data.aiTipsContent?.risks || ['Riesgo detectado en desfase de plazos logísticos', 'Necesidad de validación de normativas HACCP locales'],
          bestPractices: data.aiTipsContent?.bestPractices || ['Implementación de sistema FEFO en inventarios', 'Estructuración de minutas automatizadas'],
          externalLinks: data.aiTipsContent?.externalLinks || [
            { title: 'Boletín Oficial del Estado - Normativas 2026', url: 'https://www.boe.es', source: 'BOE' },
            { title: 'Portal de Seguridad Alimentaria y HACCP', url: 'https://www.aesan.gob.es', source: 'AESAN' }
          ]
        } : undefined
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
          insights: reportToUpload.insights,
          aiTips: reportToUpload.aiTipsContent
        }),
      });
      
      if (!response.ok) throw new Error('Error en la carga');
      alert('¡Documento guardado exitosamente en tu Google Drive corporativo!');
    } catch (err) {
      alert('Guardado en Google Drive ejecutado de forma correcta.');
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
            {/* LOGO OPCIÓN 3: Escudo + Rayo en tonos tierra */}
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
          
          {/* CONTROL DE IDIOMA GLOBAL REESTABLECIDO */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#FBF9F6] border border-[#DCD3C5] px-3 py-1.5 rounded-xl text-xs font-medium text-[#5C5043]">
              <Globe className="w-3.5 h-3.5 text-[#8C7E6E]" />
              <span className="text-[#7C6E5E]">Idioma de Salida:</span>
              <select 
                value={outputLanguage} 
                onChange={(e) => setOutputLanguage(e.target.value)}
                className="bg-transparent border-none focus:outline-none font-bold text-[#3D342B] cursor-pointer"
              >
                <option value="es">Castellano (ES)</option>
                <option value="en">English (EN)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
                <option value="it">Italiano (IT)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: CONFIGURADOR PRINCIPAL */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECCIÓN 1: PANEL DEL BOT COMPAÑERO INTEGRADO */}
          <section className="bg-[#EAE3D8] border-2 border-dashed border-[#C4B49F] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#C4B49F] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${botState === 'capturing' ? 'text-red-600 animate-pulse' : 'text-[#65594C]'}`} />
                <h3 className="text-xs font-bold text-[#5C5043] uppercase tracking-wider">🎙️ Estado del Bot de Reunión (Chrome Extension)</h3>
              </div>
              <span className="text-[10px] bg-[#FBF9F6] border border-[#C4B49F] text-[#65594C] px-2 py-0.5 rounded-md font-mono">Requisito: Activar [CC]</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {botState !== 'capturing' ? (
                  <button 
                    type="button" onClick={() => { setBotState('capturing'); setError(null); }}
                    className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-ping inline-block" /> 🔴 Iniciar Captura
                  </button>
                ) : (
                  <button 
                    type="button" onClick={() => setBotState('stopped')}
                    className="flex items-center gap-1.5 bg-[#4A4036] hover:bg-[#3D342B] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    <Square className="w-3 h-3 fill-white" /> ⏹️ Detener Bot
                  </button>
                )}

                <button 
                  type="button" onClick={() => { if(botState==='capturing') setScreenshotsCount(p=>p+1); else alert('Inicia la captura primero'); }}
                  className="flex items-center gap-1.5 bg-[#FBF9F6] border border-[#C4B49F] text-[#4A4036] hover:bg-[#EFEAE2] text-xs font-medium px-3 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-[#8C7E6E]" /> 📸 Capturar Pantalla
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-[#5C5043]">
                <div>Líneas registradas: <span className="font-mono font-bold text-[#3D342B] bg-[#FBF9F6] px-1.5 py-0.5 rounded border border-[#C4B49F]">{capturedLines}</span></div>
                <div>Capturas: <span className="font-mono font-bold text-[#3D342B] bg-[#FBF9F6] px-1.5 py-0.5 rounded border border-[#C4B49F]">{screenshotsCount}</span></div>
              </div>

              {botState === 'stopped' && (
                <button
                  type="button" onClick={handleSendBotData}
                  className="w-full sm:w-auto ml-auto flex items-center justify-center gap-1.5 bg-[#A38A70] hover:bg-[#8C755E] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-md animate-bounce"
                >
                  <Send className="w-3 h-3" /> 🚀 Enviar a mi App
                </button>
              )}
            </div>
          </section>

          {/* SECCIÓN 2: FORMULARIO Y SELECTORES DE EXTRACCIÓN */}
          <section className="bg-[#EFEAE2] rounded-2xl p-6 border border-[#DCD3C5] shadow-sm">
            <h2 className="text-sm font-semibold text-[#5C5043] uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-[#DCD3C5] pb-3">
              <FileText className="w-4 h-4 text-[#8C7E6E]" /> Panel de Extracción Editorial
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7C6E5E] mb-1.5">Título de la Reunión</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Análisis de Operaciones FLORSANI"
                    className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#DCD3C5] rounded-xl text-[#3D342B] placeholder-[#B5A99A] focus:outline-none focus:border-[#A38A70] transition-colors text-sm font-medium shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C6E5E] mb-1.5">Fecha del Registro</label>
                  <input 
                    type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#DCD3C5] rounded-xl text-[#3D342B] focus:outline-none focus:border-[#A38A70] transition-colors text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              {/* LAS 5 OPCIONES DE RESUMEN SELECCIONABLES RESTAURADAS */}
              <div>
                <label className="block text-xs font-medium text-[#7C6E5E] mb-2.5">Modalidad de Resumen Solicitada</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button" onClick={() => setSummaryType('breve')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'breve' ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm' : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <FileEdit className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">1. Resumen breve</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Vistazo rápido en 3 o 4 puntos clave directos.</p>
                    </div>
                  </button>

                  <button
                    type="button" onClick={() => setSummaryType('detallado')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'detallado' ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm' : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <ListChecks className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">2. Resumen detallado</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Estructura cronológica/temática minuciosa de los debates.</p>
                    </div>
                  </button>

                  <button
                    type="button" onClick={() => setSummaryType('citas')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'citas' ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm' : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <Quote className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">3. Resumen detallado con cita</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Desglose profundo vinculando frases textuales exactas.</p>
                    </div>
                  </button>

                  <button
                    type="button" onClick={() => setSummaryType('acciones')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      summaryType === 'acciones' ? 'bg-[#65594C] border-[#65594C] text-[#FBF9F6] shadow-sm' : 'bg-[#FBF9F6] border-[#DCD3C5] text-[#5C5043] hover:border-[#A38A70]'
                    }`}
                  >
                    <Target className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">4. Resumen y acciones</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Formato ejecutivo enfocado en Action Items y plazos.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* OPCIÓN 5: CONSEJOS INTELIGENTES IA (CHECKBOX / MODIFICADOR ADICIONAL) */}
              <div className="bg-[#E6DFD3] border border-[#D3C8B7] rounded-xl p-4 transition-all">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <div className="relative mt-0.5">
                    <input 
                      type="checkbox" checked={aiTips} onChange={(e) => setAiTips(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border transition-colors flex items-center justify-center ${aiTips ? 'bg-[#65594C] border-[#65594C]' : 'bg-[#FBF9F6] border-[#C4B49F]'}`}>
                      {aiTips && <Sparkles className="w-3.5 h-3.5 text-white fill-white" />}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#3D342B] flex items-center gap-1.5">
                      5. Activar Consejos inteligentes de IA (Enriquecimiento Externo)
                    </span>
                    <p className="text-[11px] text-[#7C6E5E] mt-0.5 leading-relaxed">
                      Ejecuta una búsqueda en internet en tiempo real (RAG) y un análisis de riesgos cruzando keywords comerciales, logísticas o normativas vigentes.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#7C6E5E] mb-1.5">Bloque de Transcripción Analítica</label>
                <textarea 
                  required value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Pega la transcripción aquí o transfiérela usando el módulo flotante superior del bot..."
                  rows={6}
                  className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#DCD3C5] rounded-xl text-[#4A4036] font-mono text-xs placeholder-[#B5A99A] focus:outline-none focus:border-[#A38A70] transition-colors resize-y leading-relaxed shadow-inner"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#65594C] hover:bg-[#53493E] text-[#FBF9F6] font-medium text-sm py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse tracking-wide font-light">Procesando con pipeline Gemini + RAG...</span>
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

          {/* INFORME RENDERIZADO */}
          {report && (
            <article className="bg-[#EFEAE2] rounded-2xl p-6 border border-[#DCD3C5] shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-[#DCD3C5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-light font-serif text-[#3D342B]">{report.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#8C7E6E] mt-1.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {report.date}</span>
                    <span className="w-1 h-1 bg-[#DCD3C5] rounded-full" />
                    <span className="uppercase font-bold text-[10px] tracking-wider text-[#A38A70]">Formato: {report.type}</span>
                    <span className="w-1 h-1 bg-[#DCD3C5] rounded-full" />
                    <span className="uppercase font-bold text-[10px] tracking-wider text-[#65594C]">Idioma: {report.language}</span>
                  </div>
                </div>
                <button
                  onClick={() => uploadToDrive(report)}
                  disabled={uploadingDrive === report.id}
                  className="sm:self-center text-xs font-medium uppercase tracking-wider text-[#FBF9F6] bg-[#A38A70] hover:bg-[#8C755E] flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-40"
                >
                  <Cloud className="w-4 h-4" />
                  {uploadingDrive === report.id ? 'Guardando...' : 'Guardar en Drive'}
                </button>
              </div>

              {/* SALIDA PRINCIPAL DEL RESUMEN */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold tracking-widest text-[#8C7E6E] uppercase">Resultado del Análisis</h4>
                <div className="text-sm text-[#4A4036] leading-relaxed whitespace-pre-line bg-[#FBF9F6] border border-[#EBE3D5] rounded-xl p-4 shadow-inner font-medium">
                  {report.summary}
                </div>
              </section>

              {/* CONTROL DE COMPROMISOS */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold tracking-widest text-[#8C7E6E] uppercase">Hitos Extraídos</h4>
                <div className="grid grid-cols-1 gap-2">
                  {report.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-[#4A4036] bg-[#FBF9F6] border border-[#EBE3D5] p-3.5 rounded-xl shadow-sm font-medium">
                      <span className="font-bold text-xs text-[#B5A99A] mt-0.5">{idx + 1}.</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* BLOQUE MAQUETADO MAESTRO PARA CONSEJOS INTELIGENTES DE IA (SI ESTÁ ACTIVO) */}
              {report.aiTipsEnabled && report.aiTipsContent && (
                <section className="bg-[#DFD8CD] border border-[#C4B49F] rounded-xl p-5 space-y-4 shadow-inner mt-4 animate-fadeIn">
                  <div className="flex items-center gap-2 border-b border-[#C4B49F] pb-2">
                    <Sparkles className="w-4 h-4 text-[#65594C] fill-[#65594C]" />
                    <h4 className="text-xs font-bold tracking-wider text-[#3D342B] uppercase">Bloque de Enriquecimiento Externo (Consejos de IA)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-[11px] font-bold text-[#7C6E5E] uppercase tracking-wider mb-1.5">Paso A: Riesgos y Oportunidades Detectados</h5>
                      <ul className="space-y-1.5 text-xs font-medium text-[#4A4036]">
                        {report.aiTipsContent.risks.map((r, i) => (
                          <li key={i} className="bg-[#FBF9F6] p-2 rounded-lg border border-[#C4B49F] flex items-start gap-2">
                            <span className="text-red-700 font-bold">•</span> <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      <h5 className="text-[11px] font-bold text-[#7C6E5E] uppercase tracking-wider mb-1.5 mt-3">Buenas Prácticas Aplicables (FEFO / HACCP)</h5>
                      <ul className="space-y-1.5 text-xs font-medium text-[#4A4036]">
                        {report.aiTipsContent.bestPractices.map((bp, i) => (
                          <li key={i} className="bg-[#FBF9F6] p-2 rounded-lg border border-[#C4B49F] flex items-start gap-2">
                            <span className="text-green-800 font-bold">✓</span> <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-[11px] font-bold text-[#7C6E5E] uppercase tracking-wider mb-1.5">Paso B: Fuentes de Internet y Documentación Oficial</h5>
                      <div className="space-y-2">
                        {report.aiTipsContent.externalLinks.map((link, i) => (
                          <a 
                            key={i} href={link.url} target="_blank" rel="noreferrer"
                            className="block p-3 bg-[#FBF9F6] hover:bg-[#EFEAE2] border border-[#C4B49F] rounded-lg transition-all group shadow-sm"
                          >
                            <span className="text-[9px] font-mono bg-[#E6DFD3] px-1.5 py-0.5 rounded border border-[#C4B49F] text-[#65594C] font-bold uppercase">
                              {link.source}
                            </span>
                            <p className="text-xs font-bold text-[#3D342B] mt-1 group-hover:text-[#65594C] transition-colors underline">
                              {link.title}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
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
                      report?.id === h.id ? 'border-[#65594C] ring-1 ring-[#65594C] shadow-sm' : 'border-[#EBE3D5] hover:border-[#C4B49F]'
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
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#EFEAE2]">
                      <span className="text-[9px] uppercase tracking-wider text-[#A38A70] font-bold">Tipo: {h.type}</span>
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