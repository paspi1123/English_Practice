#!/usr/bin/env python3
"""
TOEFL Practice App - Local Development Server with Gemini CLI Bridge
Serves static files and provides a local API endpoint to generate TOEFL exercises
using the installed Gemini CLI (agy).
"""

import http.server
import socketserver
import json
import subprocess
import os
import sys
import shutil

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def check_gemini_cli():
    """Checks if the agy / gemini CLI is available in PATH or ~/.local/bin."""
    candidates = [
        "agy",
        os.path.expanduser("~/.local/bin/agy"),
        os.path.expanduser("~/.gemini/antigravity-ide/bin/agy"),
        "gemini"
    ]
    for c in candidates:
        if shutil.which(c) or os.path.isfile(c):
            return c
    return None

def build_prompt_for_section(section, avoid_titles=None, avoid_ids=None, custom_topic=None):
    avoid_str = ""
    if avoid_titles:
        avoid_str = f"\nIMPORTANTE: NO repitas NI te inspires en ninguno de estos temas o títulos ya existentes:\n" + "\n".join(f"- {t}" for t in avoid_titles[:30])
    
    topic_hint = f"Tema sugerido o enfoque: {custom_topic}." if custom_topic else "Elige un tema académico riguroso, fresco, fascinante y poco común."

    if section == "reading":
        return f"""Actúa como un examinador oficial del TOEFL iBT®. Genera exactamente UN ejercicio inédito de práctica tipo 'Complete the Words' (C-Test) para la sección de Reading.
{topic_hint}
{avoid_str}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO:
1. Longitud del pasaje: exactamente de 70 a 100 palabras de nivel académico formal (C1/B2) sobre una disciplina científica, humanística o artística (ej. astrobiología, neurociencia, arqueometría, paleoclimatología, biomimética, lingüística diacrónica, ecología de aguas profundas, historia del arte, etc.).
2. La PRIMERA ORACIÓN del pasaje debe permanecer 100% INTACTA (sin corchetes ni palabras cortadas).
3. En las oraciones restantes, selecciona EXACTAMENTE 10 palabras académicas de contenido (sustantivos, verbos, adjetivos o adverbios).
4. Divide cada una de esas 10 palabras en dos mitades: la primera mitad queda visible como prefijo, y la segunda mitad va encerrada en corchetes rectangulares [ ].
   Ejemplo de corte: Mill[ions] mas[sive] thou[sands] colo[rful] she[lter] coun[tless] Ris[ing] poll[ution] surv[ival] blea[ching].
   Asegúrate de que haya EXACTAMENTE 10 corchetes en todo el texto.
5. Genera un ID único en minúsculas con guiones (ej. 'deepsea-hydrothermal' o 'pulsar-timing-arrays').
6. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con la siguiente estructura exacta:
{{
  "id": "slug-identificador-unico",
  "title": "Título Académico Preciso",
  "category": "Área de Estudio (ej. Marine Biology, Cognitive Ethology)",
  "level": "Academic (TOEFL iBT)",
  "rawText": "Primera oración intacta aquí. Seg[unda] oración co[n] pala[bras] cor[tadas]..."
}}"""

    elif section == "writing":
        return f"""Actúa como un examinador oficial del TOEFL iBT® para la tarea de Writing 'Make an Appropriate Sentence' / 'Build a Sentence' (basado en el diseño oficial de ETS y TOEFL Resources).
{topic_hint}
{avoid_str}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO (RIGUROSAMENTE APEGADAS A ETS):
1. Contexto: Una conversación breve de 2 interlocutores en un ambiente universitario (estudiantes, profesores, biblioteca, laboratorio de química, asesoría académica o trámites).
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
{{
  "id": "slug-identificador-unico",
  "title": "Título Descriptivo",
  "category": "Contexto (ej. Campus Life / Chemistry Lab / Academic Advising)",
  "promptQuestion": "¿Pregunta de Speaker 1?",
  "sentencePrefix": "Palabra fija inicial (ej. 'The' o 'She' o 'No,')",
  "sentenceSuffix": "Puntuación final (ej. '.' o 'fantastic.')",
  "tokens": ["palabra1", "palabra2", "palabra3", "distractor", "palabra4"],
  "solution": ["palabra1", "palabra2", "palabra3", "palabra4"],
  "distractors": ["distractor"],
  "explanation": "Oración correcta: '...'. Explicación gramatical en español de por qué es correcto y por qué sobra el distractor."
}}"""

    elif section == "email":
        return f"""Actúa como un examinador oficial del TOEFL iBT® para la nueva tarea de Writing 'Write an Email' (diseño oficial de ETS y especificaciones TOEFL 2026).
{topic_hint}
{avoid_str}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO:
1. Escenario del estímulo (~80-100 palabras): Describe una situación realista de ámbito académico, campus universitario, residencia estudiantil o comunitario (ej. cambio en horarios de biblioteca, problemas de mantenimiento en dormitorios, solicitud de recomendación, ausencia imprevista a proyecto grupal, error en paquete o libro, etc.).
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
{{
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
}}"""
def build_email_grading_prompt(scenario, bullets, recipient, subject, student_email):
    bullets_text = "\n".join(f"- {b}" for b in bullets) if isinstance(bullets, list) else str(bullets)
    return f"""Actúa como un evaluador y calificador oficial senior de ETS para la sección TOEFL iBT® Writing - Tarea 'Write an Email' (según la rúbrica oficial de ETS y especificaciones TOEFL 2026).

EVALÚA EL SIGUIENTE CORREO ELECTRÓNICO ESCRITO POR EL ESTUDIANTE:

--- ESCENARIO OFICIAL DEL EXAMEN ---
Destinatario: {recipient}
Asunto: {subject}
Situación:
{scenario}

Instrucciones requeridas (3 viñetas obligatorias):
{bullets_text}

--- CORREO ESCRITO POR EL ESTUDIANTE ---
{student_email}

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
{{
  "overallScore": 4.5,
  "cefrBand": "C1 (Advanced)",
  "wordCount": 128,
  "wordCountStatus": "optimal",
  "rubricScores": {{
    "purposefulCommunication": {{ "score": 4.5, "feedback": "Comentario pedagógico conciso en español" }},
    "socialConventionsTone": {{ "score": 5.0, "feedback": "Comentario pedagógico conciso en español" }},
    "languageAccuracy": {{ "score": 4.0, "feedback": "Comentario pedagógico conciso en español" }},
    "mechanicsOrganization": {{ "score": 4.5, "feedback": "Comentario pedagógico conciso en español" }}
  }},
  "bulletChecks": [
    {{ "bullet": "Texto de la viñeta 1", "status": "addressed", "note": "Explicación de cómo se cubrió" }},
    {{ "bullet": "Texto de la viñeta 2", "status": "addressed", "note": "Explicación de cómo se cubrió" }},
    {{ "bullet": "Texto de la viñeta 3", "status": "addressed", "note": "Explicación de cómo se cubrió" }}
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
}}"""

def extract_json(output):
    """Robustly extracts JSON object or array from LLM output."""
    text = output.strip()
    
    # Remove markdown code fences if present
    if "```" in text:
        lines = text.splitlines()
        json_lines = []
        inside_fence = False
        for line in lines:
            if line.strip().startswith("```"):
                inside_fence = not inside_fence
                continue
            if inside_fence:
                json_lines.append(line)
        if json_lines:
            text = "\n".join(json_lines).strip()

    # Find boundaries of JSON object or array
    start_brace = text.find("{")
    start_bracket = text.find("[")
    if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
        end_brace = text.rfind("}")
        if end_brace != -1:
            text = text[start_brace : end_brace + 1]
    elif start_bracket != -1:
        end_bracket = text.rfind("]")
        if end_bracket != -1:
            text = text[start_bracket : end_bracket + 1]

    return json.loads(text)

def call_gemini_cli(prompt, model="gemini-3.8-flash-high"):
    """Executes the prompt using the local agy / gemini CLI."""
    cli_path = check_gemini_cli()
    if not cli_path:
        raise RuntimeError("No Gemini CLI (agy) found on this machine.")

    selected_model = model or "gemini-3.8-flash-high"
    cmd = [cli_path, "--model", selected_model, "-p", prompt, "--disable-slash-commands"]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
    if result.returncode != 0:
        # Fallback without --model in case CLI version varies
        cmd_fallback = [cli_path, "-p", prompt, "--disable-slash-commands"]
        result = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
        if result.returncode != 0:
            raise RuntimeError(f"CLI error: {result.stderr or result.stdout}")
    
    output = result.stdout.strip()
    return extract_json(output)

class ToeflRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local cross-origin if needed and disable aggressive caching for dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            cli_path = check_gemini_cli()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                "server": "toefl-ai-local-bridge",
                "cli_available": bool(cli_path),
                "cli_path": cli_path,
                "default_model": "gemini-3.8-flash-high"
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return
        
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/generate-exercise":
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                params = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
                section = params.get('section', 'reading')
                avoid_titles = list(params.get('avoidTitles', []))
                avoid_ids = list(params.get('avoidIds', []))
                custom_topic = params.get('customTopic', '')
                count = max(1, min(int(params.get('count', 1)), 10))
                model = params.get('model', 'gemini-3.8-flash-high')

                generated_exercises = []
                for i in range(count):
                    prompt = build_prompt_for_section(section, avoid_titles, avoid_ids, custom_topic)
                    ex = call_gemini_cli(prompt, model=model)
                    
                    # Ensure unique ID
                    base_id = ex.get("id", f"{section}-{len(avoid_ids)+1}")
                    unique_id = base_id
                    suffix = 1
                    id_set = set(avoid_ids)
                    while unique_id in id_set:
                        unique_id = f"{base_id}-{suffix}"
                        suffix += 1
                    ex["id"] = unique_id
                    
                    generated_exercises.append(ex)
                    if "title" in ex:
                        avoid_titles.append(ex["title"])
                    avoid_ids.append(unique_id)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response_payload = {
                    "success": True,
                    "exercises": generated_exercises,
                    "exercise": generated_exercises[0] if generated_exercises else None,
                    "count": len(generated_exercises),
                    "model": model,
                    "engine": "local-gemini-cli"
                }
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_payload = {
                    "success": False,
                    "error": str(e)
                }
                self.wfile.write(json.dumps(error_payload).encode('utf-8'))
            return

        if self.path == "/api/grade-email":
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                params = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
                scenario = params.get('scenario', '')
                bullets = params.get('bulletPoints', [])
                recipient = params.get('recipient', '')
                subject = params.get('subject', '')
                student_email = params.get('studentEmail', '')
                model = params.get('model', 'gemini-3.8-flash-high')

                if not student_email.strip():
                    raise ValueError("El correo del estudiante está vacío.")

                prompt = build_email_grading_prompt(scenario, bullets, recipient, subject, student_email)
                evaluation = call_gemini_cli(prompt, model=model)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response_payload = {
                    "success": True,
                    "evaluation": evaluation,
                    "model": model,
                    "engine": "local-gemini-cli"
                }
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_payload = {
                    "success": False,
                    "error": str(e)
                }
                self.wfile.write(json.dumps(error_payload).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), ToeflRequestHandler) as httpd:
        print(f"🚀 TOEFL Practice App running at http://localhost:{PORT}")
        print(f"✨ Local Gemini CLI Bridge active (detected: {check_gemini_cli()})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    run_server()
