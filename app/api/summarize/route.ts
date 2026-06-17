import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

const qwenClient = createOpenAI({
  baseURL: process.env.QWEN_API_URL,
  apiKey: process.env.QWEN_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { 
      transcript, 
      meetingName, 
      date, 
      summaryType, 
      includeAiInsights,
      sourceLanguage,
      targetLanguage 
    } = await req.json();

// 1. INSTRUCCIONES DE LIMPIEZA MULTILINGÜE INTELIGENTE
    let systemPrompt = `Eres un asistente ejecutivo de IA de nivel experto y consultor estratégico empresarial.\n`;
    systemPrompt += `Estás procesando la transcripción de la reunión titulada "${meetingName}" con fecha ${date}.\n`;
    systemPrompt += `REQUERIMIENTO MULTILINGÜE: La reunión puede ser políglota o multilingüe (contener intervenciones en diferentes idiomas como español, inglés, francés, etc.). Debes detectar automáticamente cada uno de ellos.\n`;
    systemPrompt += `DEBES traducir, consolidar y generar absolutamente todo el informe, análisis y estadísticas en el idioma de destino solicitado: [${targetLanguage}] y formateado en Markdown limpio.\n\n`;
    
    systemPrompt += `=== PROTOCOLO DE LIMPIEZA PREMIUM (PRE-PROCESSING) ===\n`;
    systemPrompt += `Antes de analizar el texto, realiza una limpieza profunda de la transcripción en cualquiera de los idiomas presentes:\n`;
    systemPrompt += `- Ignora muletillas, tartamudeos o expresiones de relleno (ej: "ehh", "bueno", "you know", "actually", "vale vale").\n`;
    systemPrompt += `- Filtra saludos repetitivos, despedidas triviales o interrupciones por problemas técnicos de audio.\n`;
    systemPrompt += `- Concéntrate exclusivamente en el núcleo informativo, los argumentos de peso, las decisiones y los debates reales.\n\n`;

    systemPrompt += `El usuario ha seleccionado el formato de salida: [${summaryType}]. Cumple estrictamente las siguientes directrices para este formato:\n`;

    switch (summaryType) {
      case 'Resumen breve':
        systemPrompt += `- Genera una sinopsis ejecutiva ultra-concisa.\n`;
        systemPrompt += `- Extrae un máximo de 3 a 4 puntos clave globales en viñetas rápidas.\n`;
        break;
      case 'Resumen detallado':
        systemPrompt += `- Realiza un desglose minucioso, profundo y temático de la reunión.\n`;
        systemPrompt += `- Detalla los contextos de los problemas planteados y las decisiones tomadas sin omitir datos de valor.\n`;
        break;
      case 'Resumen detallado con cita':
        systemPrompt += `- Realiza un desglose minucioso de la reunión.\n`;
        systemPrompt += `- DEBES incluir citas textuales clave entrecomilladas indicando qué interlocutor la dijo. Si el idioma de destino es diferente al de origen, traduce la cita fielmente manteniendo el sentido exacto.\n`;
        break;
      case 'Resumen y acciones':
        systemPrompt += `- Proporciona un resumen ejecutivo intermedio.\n`;
        systemPrompt += `- Crea una sección titulada obligatoriamente '### 📋 Acciones a Acometer' (o su traducción exacta al idioma de destino).\n`;
        systemPrompt += `- Lista las tareas pendientes detectando y asignando de forma explícita al encargado de cada una usando corchetes, por ejemplo: "[Responsable: Nombre]".\n`;
        break;
    }

    if (includeAiInsights) {
      systemPrompt += `\n\n=== MODIFICADOR ADICIONAL: CONSEJOS INTELIGENTES DE IA ===\n`;
      systemPrompt += `Al final de tu respuesta, añade una sección independiente titulada '### 💡 Consejos Inteligentes de IA' (o su traducción al idioma de destino).\n`;
      systemPrompt += `Aporta valor de consultoría externa:\n`;
      systemPrompt += `1. **Recomendaciones Estratégicas**: Analiza riesgos o mejoras metodológicas sectoriales aplicables a lo hablado.\n`;
      systemPrompt += `2. **Enlaces de Interés**: Proporciona nombres de recursos oficiales, marcos de trabajo o normativas vigentes en formato [Texto](URL) con URLs lógicas.\n`;
      systemPrompt += `3. **Noticias Relevantes**: Aporta corrientes o novedades fiables actuales del mercado vinculadas al núcleo temático citando fuentes de alta credibilidad.\n`;
    }

    // Directiva para el bloque matemático de estadísticas
    systemPrompt += `\n\nCRÍTICO: Al final de TODO tu texto, debes calcular el porcentaje de participación aproximado de cada interlocutor según el volumen de sus intervenciones en la transcripción. Genera un bloque JSON final encerrado estrictamente entre las etiquetas ---START_STATS--- y ---END_STATS--- con la estructura de este ejemplo:
    {
      "duration": "58 min",
      "speakers": [
        {"name": "Nombre 1", "percentage": 75, "color": "bg-blue-500"},
        {"name": "Nombre 2", "percentage": 25, "color": "bg-purple-500"}
      ]
    }`;

    const { text } = await generateText({
      model: qwenClient('qwen-2.5-72b-instruct'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Aquí tienes la transcripción para limpiar y analizar:\n\n${transcript}`,
        },
      ],
    });

    const parts = text.split('---START_STATS---');
    const markdownOutput = parts[0].trim();
    let stats = { duration: '0 min', speakers: [] };

    if (parts[1]) {
      try {
        const rawJson = parts[1].split('---END_STATS---')[0].trim();
        stats = JSON.parse(rawJson);
      } catch (e) {
        console.error("Error al parsear estadísticas:", e);
      }
    }

    return NextResponse.json({ result: markdownOutput, stats });
  } catch (error) {
    console.error('Error en el backend:', error);
    return NextResponse.json({ error: 'Error interno de procesamiento.' }, { status: 500 });
  }
}