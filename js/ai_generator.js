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
    badge: "✍️ Sentence Builder",
    defaultCategory: "Academic & Campus Life",
    buildPrompt: (avoidTitles = [], avoidIds = [], customTopic = "") => {
      const avoidStr = avoidTitles.length > 0 
        ? `\nIMPORTANTE: NO repitas NI te inspires en ninguno de los siguientes temas o preguntas ya existentes:\n${avoidTitles.slice(0, 30).map(t => `- ${t}`).join('\n')}` 
        : "";
      
      const topicStr = customTopic 
        ? `Enfócate en este contexto o tema: ${customTopic}.` 
        : `Elige un contexto universitario variado y realista (ej. asesoría académica, biblioteca, laboratorio de química, entrega de proyectos, becas, pasantías, residencia estudiantil, etc.).`;

      return `Actúa como un examinador oficial del TOEFL iBT® para la tarea de Writing 'Make an Appropriate Sentence' / 'Build a Sentence' (basado en el diseño oficial de ETS y TOEFL Resources).
${topicStr}
${avoidStr}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO (RIGUROSAMENTE APEGADAS A ETS):
1. Contexto: Una conversación breve de 2 interlocutores en un ambiente universitario (estudiantes, profesores, biblioteca, laboratorio de química, trámites o asesoría académica).
2. Speaker 1 hace una pregunta clara ('promptQuestion').
3. Speaker 2 responde comenzando con una palabra o frase fija ('sentencePrefix', ej. 'The', 'She', 'No,', 'It') y terminando con puntuación o palabra fija ('sentenceSuffix', típicamente '.' o palabra de cierre).
4. REGLA FUNDAMENTAL DE TOKENS (PALABRAS POR CUADRO):
   - Cada cuadro/token DEBE SER DE UNA SOLA PALABRA (o a lo sumo 2 palabras en caso de sustantivo compuesto corto como 'old city', 'tour guides' o 'chemistry building').
   - NUNCA pongas cláusulas, frases largas o más de 2 palabras en un solo token (ESTÁ ESTRICTAMENTE PROHIBIDO poner piezas como 'backed up to the' o 'a proposal that impressed').
   - El 80% o más de los tokens DEBEN SER PALABRAS INDIVIDUALES.
   - Ejemplos oficiales reales de ETS:
     Tokens: ["were", "the", "was", "old city", "showed us around", "who", "tour guides"]
     Solución: ["tour guides", "who", "showed us around", "the", "old city", "were"] (Distractor: "was")
   - Ejemplo oficial TOEFL Resources:
     Tokens: ["it", "not", "she", "finished", "has", "writing"]
     Solución: ["she", "has", "not", "finished", "writing", "it"]
5. La solución ('solution') debe constar de entre 5 y 7 tokens en su orden sintáctico exacto.
6. Añade EXACTAMENTE 1 distractor gramatical plausible de 1 palabra en 'distractors' que NO encaje en la oración (ej. concordancia singular/plural como 'was' vs 'were', forma no conjugada como 'submitting' vs 'submitted', o tiempo verbal incorrecto).
7. 'tokens' debe ser la lista completa de todas las piezas de 'solution' MÁS el distractor, mezclados en orden aleatorio (desordenados).
8. Proporciona una explicación gramatical pedagógica y clara en español en el campo 'explanation' detallando por qué el orden es correcto y cuál es el error con el distractor.
9. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{
  "id": "slug-identificador-unico",
  "title": "Título Descriptivo",
  "category": "Contexto (ej. Campus Life / Academic Advising / Chemistry Lab)",
  "promptQuestion": "¿Pregunta de Speaker 1?",
  "sentencePrefix": "Palabra fija inicial (ej. 'The' o 'She' o 'No,')",
  "sentenceSuffix": "Puntuación final (ej. '.' o 'fantastic.')",
  "tokens": ["palabra1", "palabra2", "palabra3", "distractor", "palabra4"],
  "solution": ["palabra1", "palabra2", "palabra3", "palabra4"],
  "distractors": ["distractor"],
  "explanation": "Oración correcta: '...'. Explicación gramatical en español de por qué es correcto y por qué sobra el distractor."
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
  },

  email: {
    name: "Writing: Write an Email",
    badge: "✉️ Write an Email",
    defaultCategory: "Campus Life & Community",
    level: "TOEFL iBT (2026 Redesign)",
    buildPrompt: (avoidTitles = [], avoidIds = [], customTopic = "") => {
      const avoidStr = avoidTitles.length > 0 
        ? `\nIMPORTANTE: NO repitas NI te inspires en ninguno de los siguientes temas o escenarios ya existentes:\n${avoidTitles.slice(0, 30).map(t => `- ${t}`).join('\n')}` 
        : "";
      
      const topicStr = customTopic 
        ? `Enfócate en este escenario o situación: ${customTopic}.` 
        : `Elige una situación universitaria o comunitaria auténtica (ej. cambio en horarios de biblioteca o laboratorio, problema de mantenimiento en el dormitorio, solicitud de carta de recomendación, entrega tardía por fallo informático, ausencia imprevista a ensayo grupal, libro dañado en librería, membresía deportiva, etc.).`;

      return `Actúa como un examinador oficial del TOEFL iBT® para la nueva tarea de Writing 'Write an Email' (diseño oficial de ETS y especificaciones TOEFL 2026).
${topicStr}
${avoidStr}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO:
1. Escenario del estímulo (~80-100 palabras): Describe una situación realista de ámbito académico, campus universitario, residencia estudiantil o comunitario.
2. Destinatario ('recipient'): Nombre claro con cargo o relación (ej. 'Ms. Severin, Library Manager', 'Professor Harrison', 'Mr. Henderson, Residence Hall Director').
3. Correo ficticio ('recipientEmail'): Correo institucional o formal (ej. 'severin@campuslibrary.edu').
4. Asunto del correo ('subject'): Asunto profesional, directo y conciso (ej. 'Inquiry regarding library operating hours').
5. Instrucciones obligatorias ('bulletPoints'): EXACTAMENTE 3 viñetas (bullet points) claras e indispensables que el alumno debe cubrir en su correo.
6. Correo modelo de nivel 5.0 ('sampleHighScoringResponse'): Un correo modelo sobresaliente de 110 a 140 palabras que:
   - Responda puntualmente a las 3 viñetas.
   - Use la técnica recomendada por ETS de 'filling in the blanks' (detalles inventados pertinentes y creíbles).
   - Tenga saludo y despedida acordes al registro (formal/semiformal).
   - Use expresiones de cortesía y atenuación ('Would it be possible to...', 'Could you please...').
   - Muestre variedad de estructuras sintácticas (oraciones compuestas y complejas con nexos adecuados).
7. 'scoringRationale': Explicación breve en español sobre por qué el modelo cumple los estándares de la rúbrica oficial ETS.
8. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{
  "id": "slug-identificador-unico",
  "title": "Título Breve del Escenario",
  "category": "Área (ej. Campus Facilities / Academic Affairs / Student Life)",
  "recipient": "Nombre y Cargo del Destinatario",
  "recipientEmail": "correo@universidad.edu",
  "subject": "Asunto del correo",
  "scenario": "Descripción detallada del escenario de ~80-100 palabras...",
  "bulletPoints": [
    "Primera instrucción específica obligatoria",
    "Segunda instrucción específica obligatoria",
    "Tercera instrucción específica obligatoria"
  ],
  "targetWordCount": "100 - 140 words",
  "timeLimit": 420,
  "sampleHighScoringResponse": "Dear ...,\\n\\nI am writing to...\\n\\nSincerely,\\n[Student Name]",
  "sampleAuthor": "ETS Sample Model Response",
  "scoringRationale": "Justificación de cómo este correo aborda las 3 viñetas con tono apropiado y variedad sintáctica."
}`;
    },
    validate: (data) => {
      if (!data || typeof data !== 'object') throw new Error("Respuesta inválida de la IA.");
      if (!data.title) throw new Error("Falta el título del escenario.");
      if (!data.scenario) throw new Error("Falta la descripción del escenario.");
      if (!data.recipient) throw new Error("Falta el destinatario ('recipient').");
      if (!Array.isArray(data.bulletPoints) || data.bulletPoints.length !== 3) {
        throw new Error("El escenario debe tener exactamente 3 viñetas ('bulletPoints').");
      }
      if (!data.sampleHighScoringResponse) throw new Error("Falta el correo modelo de ejemplo ('sampleHighScoringResponse').");
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

  /**
   * Grades a student email using official ETS rubrics (0.0 - 5.0 scale).
   * Automatically uses local server bridge if available, falling back to direct Gemini API.
   */
  async gradeEmail(params = {}) {
    const { scenario, bulletPoints, recipient, subject, studentEmail, model } = params;
    if (!studentEmail || !studentEmail.trim()) {
      throw new Error("El correo redactado está vacío.");
    }

    const activeModel = model || this.getModel();
    const mode = this.getMode();

    // Try Local Bridge if mode is 'auto' or 'local'
    if (mode === "auto" || mode === "local") {
      try {
        const hasLocal = await this.checkLocalBridge();
        if (hasLocal) {
          const res = await fetch('/api/grade-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario,
              bulletPoints,
              recipient,
              subject,
              studentEmail,
              model: activeModel
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.evaluation) {
              return {
                evaluation: data.evaluation,
                engine: data.engine || "local-gemini-cli"
              };
            }
          }
        }
      } catch (err) {
        if (mode === "local") throw err;
        console.warn("Fallo al calificar por bridge local, intentando Gemini API directa:", err);
      }
    }

    // Direct Gemini API grading fallback
    const evalData = await this.gradeEmailViaGeminiApi(scenario, bulletPoints, recipient, subject, studentEmail, activeModel);
    return {
      evaluation: evalData,
      engine: `gemini-api-${activeModel}`
    };
  }

  /**
   * Calls Google Gemini REST API directly to grade student email with ETS rubric.
   */
  async gradeEmailViaGeminiApi(scenario, bulletPoints, recipient, subject, studentEmail, modelOverride = null) {
    const bulletsText = Array.isArray(bulletPoints) ? bulletPoints.map(b => `- ${b}`).join('\n') : String(bulletPoints);
    const prompt = `Actúa como un evaluador y calificador oficial senior de ETS para la sección TOEFL iBT® Writing - Tarea 'Write an Email' (según la rúbrica oficial de ETS y especificaciones TOEFL 2026).

EVALÚA EL SIGUIENTE CORREO ELECTRÓNICO ESCRITO POR EL ESTUDIANTE:

--- ESCENARIO OFICIAL DEL EXAMEN ---
Destinatario: ${recipient}
Asunto: ${subject}
Situación:
${scenario}

Instrucciones requeridas (3 viñetas obligatorias):
${bulletsText}

--- CORREO ESCRITO POR EL ESTUDIANTE ---
${studentEmail}

--- RÚBRICA OFICIAL DE CALIFICACIÓN ETS (0.0 a 5.0) ---
1. Purposeful Communication & Task Completion (0.0 - 5.0):
   - ¿Cumple con las 3 viñetas obligatorias del enunciado?
   - ¿Aplica la técnica de 'filling in the blanks' premiada por ETS (detalles inventados verosímiles, específicos y pertinentes)?
2. Social Conventions, Register & Tone (0.0 - 5.0):
   - ¿Suena a correo real? Saludo adecuado (Dear Ms./Mr./Professor/Hi) y cierre formal/semiformal apropiado (Sincerely, Best regards, etc.).
   - Registro adecuado según la distancia social con el destinatario (formal para autoridad/profesor, semiformal para compañero).
   - Cortesía y fórmulas de atenuación / hedging ('Would it be possible to...', 'Could you please let me know...').
3. Language Accuracy & Syntactic Variety (0.0 - 5.0):
   - Variedad de oraciones (coordinación con and/but/so, subordinación con because/although/since, adverbios conjuntivos however/therefore).
   - Precisión léxica y variedad de vocabulario, evitando repetición de palabras.
4. Mechanics, Organization & Length (0.0 - 5.0):
   - Longitud (objetivo óptimo ETS: 100-140 palabras; menos de 80 palabras penaliza por falta de desarrollo).
   - Organización en párrafos claros (saludo, cuerpo estructurado, cierre, firma).
   - Ortografía y puntuación (errores menores tolerados si hay inteligibilidad).

ESCALA GLOBAL:
- 4.5 - 5.0: Advanced (C1)
- 3.5 - 4.0: High Intermediate (B2)
- 2.5 - 3.0: Low Intermediate (B1)
- 1.5 - 2.0: Basic (A2)
- 0.0 - 1.0: Below Basic o Incompleto

Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{
  "overallScore": 4.5,
  "cefrBand": "C1 (Advanced)",
  "wordCount": 128,
  "wordCountStatus": "optimal",
  "rubricScores": {
    "purposefulCommunication": { "score": 4.5, "feedback": "Comentario pedagógico conciso en español" },
    "socialConventionsTone": { "score": 5.0, "feedback": "Comentario pedagógico conciso en español" },
    "languageAccuracy": { "score": 4.0, "feedback": "Comentario pedagógico conciso en español" },
    "mechanicsOrganization": { "score": 4.5, "feedback": "Comentario pedagógico conciso en español" }
  },
  "bulletChecks": [
    { "bullet": "Texto de la viñeta 1", "status": "addressed", "note": "Explicación de cómo se cubrió" },
    { "bullet": "Texto de la viñeta 2", "status": "addressed", "note": "Explicación de cómo se cubrió" },
    { "bullet": "Texto de la viñeta 3", "status": "addressed", "note": "Explicación de cómo se cubrió" }
  ],
  "strengths": [
    "Fortaleza 1 del correo del alumno...",
    "Fortaleza 2..."
  ],
  "areasForImprovement": [
    "Área a mejorar 1...",
    "Área a mejorar 2..."
  ],
  "grammarAndStyleNotes": [
    "Corrección gramatical o estilística específica...",
    "Sugerencia de conectores o vocabulario más formal..."
  ],
  "modelRewrite": "Versión pulida de nivel 5.0 del correo del estudiante que demuestre cómo alcanzar la máxima puntuación conservando su mensaje pero elevando léxico, nexos y precisión."
}`;

    return await this.generateViaGeminiApi(prompt, modelOverride);
  }
}

export const geminiAI = new GeminiAIService();
