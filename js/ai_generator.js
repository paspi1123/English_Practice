/**
 * TOEFL iBT Practice App - Gemini AI Generation Service
 * 
 * Works in two modes:
 * 1. Static Mode (Universal for any device): Calls Google Gemini REST API directly using user's API Key.
 * 2. Local Bridge Mode (Linux localhost): Calls local Python server bridge which uses the system's Gemini CLI (agy).
 * 
 * Modular and extensible for Reading, Writing, and future sections!
 */

import { parseExercise } from './exercises.js?v=4.0';

export const SECTION_CONFIGS = {
  reading: {
    name: "Reading: Complete the Words",
    badge: "📖 Reading",
    defaultCategory: "Academic Passage",
    level: "Academic (TOEFL iBT)",
    buildPrompt: (avoidTitles = [], avoidIds = [], customTopic = "") => {
      const avoidStr = avoidTitles.length > 0 
        ? `\nIMPORTANTE: NO repitas NI te inspires en ninguno de los siguientes temas o títulos ya existentes:\n${avoidTitles.slice(0, 30).map(t => `- ${t}`).join('\n')}` 
        : "";
      
      const topicStr = customTopic 
        ? `Enfócate en este tema: ${customTopic}.` 
        : `Elige un tema académico riguroso, fascinante y fresco (ej. astrobiología, neuroplasticidad, vulcanología marina, paleoclimatología, arqueometría, biomimética, lingüística evolutiva, glaciología, etc.).`;

      return `Actúa como un examinador oficial del TOEFL iBT®. Genera exactamente UN ejercicio inédito de práctica tipo 'Complete the Words' (C-Test) para la sección de Reading.
${topicStr}
${avoidStr}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO:
1. Longitud del pasaje: exactamente de 70 a 100 palabras de nivel académico formal (C1/B2) sobre una disciplina científica, histórica o artística.
2. La PRIMERA ORACIÓN del pasaje debe permanecer 100% INTACTA (sin corchetes ni palabras cortadas).
3. En las oraciones restantes, selecciona EXACTAMENTE 10 palabras académicas de contenido (sustantivos, verbos, adjetivos o adverbios).
4. Divide cada una de esas 10 palabras en dos mitades: la primera mitad queda visible como prefijo, y la segunda mitad va encerrada en corchetes rectangulares [ ].
   Ejemplo de corte: Mill[ions] mas[sive] thou[sands] colo[rful] she[lter] coun[tless] Ris[ing] poll[ution] surv[ival] blea[ching].
   Asegúrate de que haya EXACTAMENTE 10 palabras con corchetes en todo el texto.
5. Genera un ID único en minúsculas con guiones (ej. 'deepsea-hydrothermal' o 'pulsar-astronomy').
6. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con la siguiente estructura exacta:
{
  "id": "slug-identificador-unico",
  "title": "Título Académico Preciso",
  "category": "Área de Estudio (ej. Marine Biology, Cognitive Ethology)",
  "level": "Academic (TOEFL iBT)",
  "rawText": "Primera oración intacta aquí. Seg[unda] oración co[n] pala[bras] cor[tadas]..."
}`;
    },
    validate: (data) => {
      if (!data || typeof data !== 'object') throw new Error("Respuesta inválida de la IA.");
      if (!data.title) throw new Error("Falta el título del ejercicio.");
      if (!data.rawText) throw new Error("Falta el texto 'rawText' del ejercicio.");
      
      const parsed = parseExercise(data.rawText);
      if (parsed.totalBlanks < 8 || parsed.totalBlanks > 12) {
        throw new Error(`El texto generado tiene ${parsed.totalBlanks} palabras con corchetes (se esperaban 10).`);
      }
      return true;
    }
  },

  writing: {
    name: "Writing: Make an Appropriate Sentence",
    badge: "✍️ Writing",
    defaultCategory: "Academic & Campus Life",
    buildPrompt: (avoidTitles = [], avoidIds = [], customTopic = "") => {
      const avoidStr = avoidTitles.length > 0 
        ? `\nIMPORTANTE: NO repitas NI te inspires en ninguno de los siguientes temas o preguntas ya existentes:\n${avoidTitles.slice(0, 30).map(t => `- ${t}`).join('\n')}` 
        : "";
      
      const topicStr = customTopic 
        ? `Enfócate en este contexto o tema: ${customTopic}.` 
        : `Elige un contexto universitario variado y realista (ej. asesoría académica, biblioteca, laboratorio de química, entrega de proyectos, becas, pasantías, residencia estudiantil, etc.).`;

      return `Actúa como un examinador oficial del TOEFL iBT® para la tarea de Writing 'Make an Appropriate Sentence' (construcción sintáctica de oraciones).
${topicStr}
${avoidStr}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO:
1. Contexto: Una conversación breve de 2 interlocutores en un ambiente universitario (estudiantes, profesores, asesores académicos o personal del campus).
2. Speaker 1 hace una pregunta clara ('promptQuestion').
3. Speaker 2 responde comenzando con una palabra o frase fija ('sentencePrefix') y terminando con puntuación fija ('sentenceSuffix', típicamente '.' o palabra final).
4. La parte intermedia que el estudiante debe armar consiste en una lista de piezas ('solution') de entre 5 y 7 fragmentos sintácticos en su orden gramatical exacto.
5. Añade EXACTAMENTE 1 distractor gramatical plausible ('distractors') que NO debe encajar (ej. distractor de concordancia singular/plural como 'was' vs 'were', tiempo verbal incorrecto o forma no conjugada como gerundio 'submitting' vs forma base 'submit', preposición incorrecta, o pronombre relativo erróneo).
6. El campo 'tokens' debe ser la lista completa de todas las piezas de 'solution' MÁS el distractor, todo mezclado en orden aleatorio (desordenado).
7. Proporciona una explicación gramatical pedagógica y clara en español en el campo 'explanation' detallando por qué el orden es correcto y cuál es el error con el distractor.
8. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{
  "id": "slug-identificador-unico",
  "title": "Título Descriptivo",
  "category": "Contexto (ej. Campus Life / Academic Advising / Chemistry Lab)",
  "promptQuestion": "¿Pregunta de Speaker 1?",
  "sentencePrefix": "Palabra inicial fija (ej. 'The' o 'She' o 'Fortunately, the')",
  "sentenceSuffix": "Puntuación o palabra final (ej. '.' o 'desk.')",
  "tokens": ["fragmento 1", "fragmento 2", "distractor", "fragmento 3"],
  "solution": ["fragmento 1", "fragmento 2", "fragmento 3"],
  "distractors": ["distractor"],
  "explanation": "Oración correcta: '...'. Explicación gramatical en español."
}`;
    },
    validate: (data) => {
      if (!data || typeof data !== 'object') throw new Error("Respuesta inválida de la IA.");
      if (!data.title) throw new Error("Falta el título del ejercicio.");
      if (!data.promptQuestion) throw new Error("Falta la pregunta de Speaker 1 ('promptQuestion').");
      if (!Array.isArray(data.solution) || data.solution.length < 3) throw new Error("La solución debe contener al menos 3 piezas.");
      if (!Array.isArray(data.tokens) || data.tokens.length <= data.solution.length) throw new Error("Los tokens deben incluir la solución más al menos 1 distractor.");
      if (!Array.isArray(data.distractors) || data.distractors.length === 0) throw new Error("Debe existir al menos 1 distractor en 'distractors'.");
      return true;
    }
  }
};

class GeminiAIService {
  constructor() {
    this.storageKeyApiKey = "toefl_gemini_api_key";
    this.storageKeyModel = "toefl_gemini_model";
    this.storageKeyMode = "toefl_gemini_mode"; // 'auto', 'local', 'direct'
    this.defaultModel = "gemini-3.8-flash-high";
  }

  getApiKey() {
    return localStorage.getItem(this.storageKeyApiKey) || "";
  }

  setApiKey(key) {
    if (key) {
      localStorage.setItem(this.storageKeyApiKey, key.trim());
    } else {
      localStorage.removeItem(this.storageKeyApiKey);
    }
  }

  getModel() {
    return localStorage.getItem(this.storageKeyModel) || this.defaultModel;
  }

  setModel(model) {
    localStorage.setItem(this.storageKeyModel, model);
  }

  getMode() {
    return localStorage.getItem(this.storageKeyMode) || "auto";
  }

  setMode(mode) {
    localStorage.setItem(this.storageKeyMode, mode);
  }

  /**
   * Checks if local server bridge is reachable.
   */
  async checkLocalBridge() {
    try {
      const res = await fetch('/api/status', { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return data.cli_available ? true : false;
      }
    } catch (e) {
      // Local server not running or static host
    }
    return false;
  }

  /**
   * Cleans raw text from Gemini if it wrapped JSON in markdown code blocks.
   */
  cleanJsonResponse(text) {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      const lines = clean.split('\n');
      if (lines[0].startsWith('```')) {
        lines.shift();
      }
      if (lines.length > 0 && lines[lines.length - 1].trim().startsWith('```')) {
        lines.pop();
      }
      clean = lines.join('\n').trim();
    }
    return JSON.parse(clean);
  }

  /**
   * Calls the local server bridge (Linux with agy / gemini CLI).
   * Supports batch generation with count parameter.
   */
  async generateViaLocalBridge(section, avoidTitles, avoidIds, customTopic, count = 1, model = null) {
    const activeModel = model || this.getModel() || "gemini-3.8-flash-high";
    const res = await fetch('/api/generate-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section,
        avoidTitles,
        avoidIds,
        customTopic,
        count,
        model: activeModel
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Error del servidor local: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "No se pudo generar el ejercicio.");
    }

    const exercises = data.exercises || (data.exercise ? [data.exercise] : []);
    if (exercises.length === 0) {
      throw new Error("El servidor local no devolvió ejercicios.");
    }

    return {
      exercises,
      exercise: exercises[0],
      count: exercises.length,
      engine: data.engine || "local-gemini-cli"
    };
  }

  /**
   * Calls Google Gemini REST API directly from the browser (Universal for static sites).
   */
  async generateViaGeminiApi(prompt, modelOverride = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("NO_API_KEY");
    }

    const model = modelOverride || this.getModel();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errMsg = errorJson?.error?.message || `Error de Gemini API: HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const json = await response.json();
    const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Gemini no devolvió texto en su respuesta.");
    }

    return this.cleanJsonResponse(candidateText);
  }

  /**
   * Main generation dispatcher.
   * Automatically attempts local bridge if available, falling back to direct API,
   * or respects explicit user configuration.
   * Supports generating 1 or multiple exercises at once!
   */
  async generateExercise(section = "reading", options = {}) {
    const config = SECTION_CONFIGS[section];
    if (!config) {
      throw new Error(`Sección '${section}' no soportada por el generador de IA.`);
    }

    const avoidTitles = [...(options.avoidTitles || [])];
    const avoidIds = [...(options.avoidIds || [])];
    const customTopic = options.customTopic || "";
    const count = Math.max(1, Math.min(parseInt(options.count, 10) || 1, 10));
    const model = options.model || this.getModel();
    const onProgress = options.onProgress || null;

    let exercises = [];
    let engineUsed = "";
    const mode = this.getMode(); // 'auto', 'local', 'direct'

    // Try Local Bridge if mode is 'auto' or 'local'
    if (mode === "auto" || mode === "local") {
      try {
        const hasLocal = await this.checkLocalBridge();
        if (hasLocal) {
          const bridgeResult = await this.generateViaLocalBridge(section, avoidTitles, avoidIds, customTopic, count, model);
          exercises = bridgeResult.exercises;
          engineUsed = bridgeResult.engine;
        } else if (mode === "local") {
          throw new Error("El servidor local con Gemini CLI no está activo. Ejecuta 'python3 server.py' o usa el modo API directa.");
        }
      } catch (err) {
        if (mode === "local") throw err;
        console.warn("Fallo en bridge local, intentando Gemini API directa:", err);
      }
    }

    // Direct Gemini API generation if local bridge didn't handle it
    if (exercises.length === 0) {
      engineUsed = `gemini-api-${model}`;
      for (let i = 0; i < count; i++) {
        if (onProgress) {
          onProgress(i + 1, count);
        }
        const prompt = config.buildPrompt(avoidTitles, avoidIds, customTopic);
        const singleEx = await this.generateViaGeminiApi(prompt, model);
        exercises.push(singleEx);
        if (singleEx.title) avoidTitles.push(singleEx.title);
        if (singleEx.id) avoidIds.push(singleEx.id);
      }
    }

    // Validate and guarantee unique IDs for all generated exercises
    const existingIdSet = new Set(options.avoidIds || []);
    exercises.forEach((ex, idx) => {
      const baseId = ex.id || `${section}-${Date.now()}-${idx}`;
      let uniqueId = baseId;
      let suffix = 1;
      while (existingIdSet.has(uniqueId)) {
        uniqueId = `${baseId}-${suffix++}`;
      }
      ex.id = uniqueId;
      existingIdSet.add(uniqueId);
      ex.isAiGenerated = true;

      // Validate structure
      config.validate(ex);
    });

    return {
      exercise: exercises[0],
      exercises,
      count: exercises.length,
      engineUsed
    };
  }

  /**
   * Tests API key validity with a small ping.
   */
  async testApiKey(key, model = null) {
    const activeModel = model || this.getModel();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${key}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Responde únicamente: PING_OK" }] }]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return !!data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

export const geminiAI = new GeminiAIService();
