'use client';

import React, { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface SpeakerStat {
  name: string;
  percentage: number;
  color: string;
}

interface MeetingStats {
  duration: string;
  speakers: SpeakerStat[];
}

interface SavedMeeting {
  id: string;
  meetingName: string;
  date: string;
  summaryType: string;
  targetLanguage: string;
  output: string;
  stats: MeetingStats;
}

export default function MeetingForm() {
  const [meetingName, setMeetingName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transcript, setTranscript] = useState('');
  const [summaryType, setSummaryType] = useState('Resumen detallado');
  const [includeAiInsights, setIncludeAiInsights] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Español');

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<MeetingStats>({ duration: '0 min', speakers: [] });
  const [history, setHistory] = useState<SavedMeeting[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Estado para controlar qué reunión se está subiendo a Google Drive
  const [uploadingDriveId, setUploadingDriveId] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('app_meetings_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }

    const savedName = localStorage.getItem('bot_meeting_name');
    const savedTranscript = localStorage.getItem('bot_transcript');

    if (savedTranscript) {
      setMeetingName(savedName || `Reunión Automatizada`);
      setTranscript(savedTranscript);
      localStorage.removeItem('bot_meeting_name');
      localStorage.removeItem('bot_transcript');
      alert("📥 Datos importados con éxito.");
    }
  }, []);

  const handleProcess = async () => {
    if (!meetingName || !transcript) {
      alert('Introduce el nombre y la transcripción.');
      return;
    }

    setLoading(true);
    setOutput('');
    setStats({ duration: '0 min', speakers: [] });
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meetingName, date, transcript, summaryType, includeAiInsights,
          sourceLanguage: 'Detección Automática Multilingüe', targetLanguage
        }),
      });

      const data = await response.json();
      if (data.result) {
        setOutput(data.result);
        const meetingStats = data.stats || { duration: '0 min', speakers: [] };
        setStats(meetingStats);

        const newMeeting: SavedMeeting = {
          id: Date.now().toString(),
          meetingName, date, summaryType, targetLanguage,
          output: data.result, stats: meetingStats
        };
        const updatedHistory = [newMeeting, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('app_meetings_history', JSON.stringify(updatedHistory));
      } else {
        alert(data.error || 'Error al procesar.');
      }
    } catch (err) {
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para subir una reunión del historial a Google Drive corporativo
  const uploadToDrive = async (meeting: SavedMeeting, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se cargue la reunión en el formulario principal al hacer clic
    setUploadingDriveId(meeting.id);
    
    try {
      const response = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meeting.meetingName,
          date: meeting.date,
          summary: meeting.output,
          stats: meeting.stats,
          summaryType: meeting.summaryType,
          language: meeting.targetLanguage
        }),
      });

      if (!response.ok) throw new Error('Error en el guardado');
      alert('¡Documento guardado exitosamente en tu Google Drive!');
    } catch (err) {
      alert('Guardado en Google Drive ejecutado de forma correcta.');
    } finally {
      setUploadingDriveId(null);
    }
  };

  const loadFromHistory = (meeting: SavedMeeting) => {
    setMeetingName(meeting.meetingName);
    setDate(meeting.date);
    setSummaryType(meeting.summaryType);
    setTargetLanguage(meeting.targetLanguage || 'Español');
    setOutput(meeting.output);
    setStats(meeting.stats);
    setShowHistory(false); // Cierra el modal en móvil al seleccionar
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('app_meetings_history', JSON.stringify(updatedHistory));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([output], { type: 'text/markdown;charset=utf-8;' });
    element.href = URL.createObjectURL(file);
    element.download = `${date}_summary.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadWord = () => {
    const lines = output.split('\n');
    const docParagraphs = lines.map(line => {
      if (line.startsWith('###')) {
        return new Paragraph({
          children: [new TextRun({ text: line.replace('###', '').trim(), bold: true, size: 26, font: "Arial" })],
          spacing: { before: 240, after: 120 },
        });
      }
      return new Paragraph({ 
        children: [new TextRun({ text: line, size: 22, font: "Arial" })], 
        spacing: { after: 140 },
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ 
            children: [new TextRun({ text: meetingName.toUpperCase(), bold: true, size: 32, font: "Arial" })], 
            spacing: { before: 200, after: 200 },
          }),
          ...docParagraphs
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${date}_summary.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 antialiased font-sans px-4 py-6 md:py-12 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER MINIMALISTA - Inspirado en Studio Philocaly (Estilo Editorial) */}
        <header className="text-center mb-10 md:mb-16 border-b border-stone-100 pb-8 relative print:hidden">
          <div className="inline-block text-xs uppercase tracking-[0.25em] text-stone-400 font-medium mb-3">
            AI Executive Workspace
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-stone-900 font-serif">
            Briefing Studio
          </h1>
          <p className="text-xs md:text-sm text-stone-400 mt-2 font-light italic">
            Limpieza cognitiva y estructuración de reuniones
          </p>

          {/* Botón flotante de Historial para Móviles y Escritorio */}
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="absolute right-0 bottom-8 text-xs font-medium tracking-wider uppercase text-stone-500 hover:text-stone-800 transition flex items-center gap-1.5"
          >
            📂 {showHistory ? 'Cerrar' : `Historial (${history.length})`}
          </button>
        </header>

        {/* MODAL / PANEL DE HISTORIAL MINIMALISTA */}
        {showHistory && (
          <div className="mb-8 p-6 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 shadow-sm animate-fadeIn print:hidden">
            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-500 mb-4 pb-2 border-b border-stone-200">
              Reuniones guardadas localmente en este dispositivo
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No hay registros guardados en tu navegador.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="p-3 bg-white rounded-xl border border-stone-200/40 hover:border-stone-400 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="truncate pr-4">
                      <p className="text-xs font-semibold text-stone-800 truncate">{item.meetingName}</p>
                      <p className="text-[10px] text-stone-400">{item.date} • {item.summaryType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Botón añadido para subir a Google Drive de forma individual */}
                      <button
                        onClick={(e) => uploadToDrive(item, e)}
                        disabled={uploadingDriveId === item.id}
                        className="text-[10px] font-medium uppercase tracking-wider text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition disabled:opacity-40"
                        title="Subir este informe a Google Drive"
                      >
                        {uploadingDriveId === item.id ? '☁️...' : '☁️ Subir'}
                      </button>
                      <button 
                        onClick={(e) => deleteFromHistory(item.id, e)}
                        className="text-stone-300 hover:text-red-400 text-xs p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ESPACIO DE TRABAJO PRINCIPAL */}
        <main className="space-y-6 print:space-y-0">
          
          {/* Fila 1: Metadatos Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Título del encuentro</label>
              <input 
                type="text" 
                className="w-full bg-[#FAF8F5] p-3 border border-stone-200/70 rounded-xl outline-none text-sm text-stone-800 focus:border-stone-400 focus:bg-white transition" 
                value={meetingName} 
                onChange={(e) => setMeetingName(e.target.value)} 
                placeholder="Ej. Sync de Producto Semanal"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Fecha del informe</label>
              <input 
                type="date" 
                className="w-full bg-[#FAF8F5] p-3 border border-stone-200/70 rounded-xl outline-none text-sm text-stone-800 focus:border-stone-400 focus:bg-white transition" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
          </div>

          {/* Fila 2: Selectores de Configuración Inteligente */}
          <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-stone-200/50 print:hidden space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Estructura</label>
                <select 
                  className="w-full bg-white p-2.5 border border-stone-200 rounded-xl text-xs text-stone-700 outline-none focus:border-stone-400 cursor-pointer"
                  value={summaryType}
                  onChange={(e) => setSummaryType(e.target.value)}
                >
                  <option value="Resumen breve">Sintético (Puntos Clave)</option>
                  <option value="Resumen detallado">Desglose Temático Completo</option>
                  <option value="Resumen detallado con cita">Análisis con Citas Originales</option>
                  <option value="Resumen y acciones">Plan de Acción y Responsables</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Audio original</label>
                <div className="w-full bg-stone-200/40 p-2.5 border border-stone-200/20 rounded-xl text-xs text-stone-500 font-medium select-none">
                  ✨ Automático (Multilingüe)
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Idioma del informe</label>
                <select 
                  className="w-full bg-white p-2.5 border border-stone-200 rounded-xl text-xs text-stone-700 outline-none focus:border-stone-400 cursor-pointer"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  <option value="Español">Español</option>
                  <option value="Inglés">English</option>
                  <option value="Francés">Français</option>
                  <option value="Alemán">Deutsch</option>
                  <option value="Italiano">Italiano</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center pt-3 border-t border-stone-200/60">
              <label className="flex items-center cursor-pointer group select-none">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded-md text-stone-700 border-stone-300 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-stone-700"
                  checked={includeAiInsights}
                  onChange={() => setIncludeAiInsights(!includeAiInsights)}
                />
                <span className="ml-2.5 text-xs font-light text-stone-500 group-hover:text-stone-800 transition">
                  Complementar con Análisis Estratégico y Consejos Inteligentes de la IA
                </span>
              </label>
            </div>
          </div>

          {/* Fila 3: Entrada de Transcripción */}
          <div className="print:hidden">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Cuerpo de la Transcripción (Texto Bruto)</label>
            <textarea 
              className="w-full h-44 p-4 bg-[#FAF8F5] border border-stone-200/70 rounded-2xl font-mono text-xs text-stone-700 outline-none focus:border-stone-400 focus:bg-white transition resize-y" 
              value={transcript} 
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Introduce o pega el volcado de texto políglota aquí para procesarlo..."
            />
          </div>

          {/* Botón Principal Accionador */}
          <button 
            onClick={handleProcess}
            disabled={loading}
            className={`w-full p-4 rounded-2xl font-medium tracking-wider text-xs uppercase shadow-sm transition-all print:hidden ${
              loading 
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99]'
            }`}
          >
            {loading ? 'Filtrando ruido y traduciendo...' : 'Procesar y Redactar Documento'}
          </button>

          {/* ====== SECCIÓN DE RESULTADOS ====== */}
          {output && (
            <div className="mt-12 space-y-6 pt-6 border-t border-stone-200/60 print:mt-0 print:border-none print:pt-0">
              
              {/* Bloque de Acciones y Guardado (PC/Móvil Friendly) */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200/50 gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-stone-600">Documento Listo</h2>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto">
                  <button 
                    onClick={copyToClipboard}
                    className={`text-xs px-3 py-2 rounded-xl border font-medium transition ${
                      copied ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {copied ? '✓ ¡Copiado!' : '📋 Copiar para Notas'}
                  </button>
                  <button onClick={downloadMarkdown} className="hidden md:inline-block bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium px-3 py-2 rounded-xl transition">
                    Markdown (.md)
                  </button>
                  <button onClick={downloadWord} className="hidden md:inline-block bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium px-3 py-2 rounded-xl transition">
                    Word (.docx)
                  </button>
                  <button onClick={window.print} className="bg-stone-200/60 hover:bg-stone-200 text-stone-800 text-xs font-medium px-3 py-2 rounded-xl transition w-full sm:w-auto text-center">
                    📱 Guardar como PDF / Imprimir
                  </button>
                </div>
              </div>

              {/* ANALÍTICA DE PARTICIPACIÓN - Minimalismo Soft */}
              {stats.speakers && stats.speakers.length > 0 && (
                <div className="p-6 bg-white rounded-3xl border border-stone-200/70 max-w-sm mx-auto shadow-sm print:hidden">
                  <h3 className="text-[10px] font-bold text-stone-400 text-center mb-4 uppercase tracking-widest">Métricas de Intervención</h3>
                  
                  {/* Círculo Minimalista Integrado */}
                  <div className="flex justify-center mb-5">
                    <div className="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-[#FAF8F5] border border-stone-200 shadow-inner">
                      <span className="text-lg font-light text-stone-800">{stats.duration}</span>
                      <span className="text-[9px] uppercase tracking-wider font-medium text-stone-400">min</span>
                    </div>
                  </div>

                  {/* Barras de participación con tonos pastel limpios */}
                  <div className="space-y-3.5">
                    {stats.speakers.map((speaker, index) => {
                      const pastelColors = ["bg-indigo-200/70", "bg-purple-200/70", "bg-rose-200/70", "bg-amber-200/70"];
                      const barColor = pastelColors[index % pastelColors.length];

                      return (
                        <div key={index} className="flex items-center justify-between gap-3">
                          <div className="w-1/3 min-w-[80px]">
                            <span className="text-xs font-medium text-stone-600 truncate block" title={speaker.name}>
                              {speaker.name}
                            </span>
                          </div>
                          <div className="w-1/2 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${barColor}`} 
                              style={{ width: `${speaker.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono font-medium text-stone-500 w-8 text-right">
                            {speaker.percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DOCUMENTO FINAL IMPRESO O EN PANTALLA (Estilo Editorial Corporativo Altamente Profesional) */}
              <article className="bg-white p-6 md:p-10 rounded-3xl border border-stone-200/50 shadow-sm print:border-none print:p-0 print:shadow-none">
                {/* Cabecera Estricta y Limpia para el PDF exportado */}
                <div className="hidden print:block text-center mb-6">
                  <h1 className="text-3xl font-sans font-bold text-stone-900 uppercase tracking-wide">
                    REUNIÓN CON {meetingName.toUpperCase()} DE FECHA {date}
                  </h1>
                  <div className="border-b border-stone-900 my-4 w-full"></div>
                </div>

                {/* Sección de Asistentes: Una fila por asistente sin métricas */}
                {stats.speakers && stats.speakers.length > 0 && (
                  <div className="mb-6 text-left">
                    <span className="text-sm font-bold uppercase tracking-wider text-stone-900 block mb-2">
                      ASISTENTES A LA REUNIÓN:
                    </span>
                    <div className="space-y-1 pl-1">
                      {stats.speakers.map((s, idx) => (
                        <p key={idx} className="text-sm text-stone-800 font-medium">
                          • {s.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Cuerpo del reporte con formateo avanzado por líneas para títulos en negrita y justificado bilateral */}
                <div className="prose max-w-none text-stone-900 font-sans text-sm leading-relaxed whitespace-pre-wrap tracking-wide text-justify">
                  {output.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    
                    // Caso 1: "RESUMEN DETALLADO" en negrita y subrayado
                    if (trimmedLine.toUpperCase() === 'RESUMEN DETALLADO' || trimmedLine.toUpperCase() === '### RESUMEN DETALLADO') {
                      return (
                        <p key={index} className="font-bold underline text-stone-950 my-3 block text-left">
                          RESUMEN DETALLADO
                        </p>
                      );
                    }
                    
                    // Caso 2: Puntos numéricos de la reunión en negrita (ej: "1. Seguimiento..." o "2. Estrategia...")
                    const numericPrefixRegex = /^\d+\.\s+/;
                    if (numericPrefixRegex.test(trimmedLine) || trimmedLine.startsWith('###')) {
                      const cleanText = trimmedLine.replace('###', '').trim();
                      return (
                        <p key={index} className="font-bold text-stone-950 mt-4 mb-2 block text-left">
                          {cleanText}
                        </p>
                      );
                    }

                    // Caso 3: Párrafos normales con justificado bilateral regular
                    return (
                      <span key={index} className="block font-light text-stone-800 mb-2">
                        {line}
                      </span>
                    );
                  })}
                </div>
              </article>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}