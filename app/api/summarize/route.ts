import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { meetingName, date, transcript, summaryType, targetLanguage, includeAiInsights } = body;

    const apiUrl = process.env.QWEN_API_URL;
    const apiKey = process.env.QWEN_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: 'Faltan las credenciales de la API en el servidor.' }, { status: 500 });
    }

    // Limpieza de URL
    let cleanUrl = apiUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/v1') && !cleanUrl.endsWith('/openai/v1')) {
      cleanUrl = `${cleanUrl}/v1`;
    }

    const systemPrompt = `Eres un asistente ejecutivo de alta dirección. 
Procesa la siguiente transcripción de reunión y genera un informe estructurado elegantemente en idioma: ${targetLanguage}.
Estructura solicitada: ${summaryType}.
${includeAiInsights ? 'Incluye un apartado final con análisis estratégico y consejos clave.' : ''}

IMPORTANTE: Al final de tu respuesta, debes añadir OBLIGATORIAMENTE un bloque JSON exacto con las estadísticas de participación y duración estimada, usando estrictamente este formato de marcas:
[[STATS_START]]
{
  "duration": "15", 
  "speakers": [
    {"name": "Nombre1", "percentage": 60},
    {"name": "Nombre2", "percentage": 40}
  ]
}
[[STATS_END]]
Analiza el texto bruto para estimar la duración y calcular los porcentajes reales de intervención basándote en lo que habla cada participante de la transcripción.`;

    // Llamada con el modelo ultra-estable y disponible de Groq
    const response = await fetch(`${cleanUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash', // El modelo de producción más compatible y con mayor límite en Google AI Studio
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Reunión: ${meetingName}\nFecha: ${date}\n\nTranscripción:\n${transcript}` }
        ],
        temperature: 0.3
      })
    });

//    if (!response.ok) {
//      const errorData = await response.json().catch(() => ({}));
//      const errorMessage = errorData?.error?.message || `Código de estado: ${response.status}`;
//      console.error('Error directo de Groq:', errorMessage);
//      // Ahora la app te pintará en la alerta el motivo exacto que da Groq
//      return NextResponse.json({ error: `Groq rechaza la petición: ${errorMessage}` }, { status: response.status });
//    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Respuesta de error bruta de Groq:', errorText);
      return NextResponse.json({ error: `Groq responde: ${errorText.substring(0, 150)}` }, { status: response.status });
    }

    const data = await response.json();
    const fullText = data.choices[0].message.content;

    let resultText = fullText;
    let stats = { duration: '0 min', speakers: [] };

    if (fullText.includes('[[STATS_START]]') && fullText.includes('[[STATS_END]]')) {
      try {
        const parts = fullText.split('[[STATS_START]]');
        resultText = parts[0].trim();
        const statsPart = parts[1].split('[[STATS_END]]')[0].trim();
        const parsedStats = JSON.parse(statsPart);
        
        stats = {
          duration: parsedStats.duration ? `${parsedStats.duration} min` : '10 min',
          speakers: parsedStats.speakers || []
        };
      } catch (e) {
        console.error('Error al parsear estadísticas de la IA:', e);
      }
    }

    return NextResponse.json({ result: resultText, stats });

  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json({ error: 'Error interno de procesamiento.' }, { status: 500 });
  }
}