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
        return f"""Actúa como un examinador oficial del TOEFL iBT® para la tarea de Writing 'Make an Appropriate Sentence' (construcción sintáctica de oraciones).
{topic_hint}
{avoid_str}

REGLAS ESTRICTAS DE FORMATO Y CONTENIDO:
1. Contexto: Una conversación breve de 2 interlocutores en un ambiente universitario (estudiantes, profesores, asesores académicos, biblioteca, laboratorio o vida en el campus).
2. Speaker 1 hace una pregunta clara ('promptQuestion').
3. Speaker 2 responde comenzando con una palabra o frase fija ('sentencePrefix') y terminando con puntuación fija ('sentenceSuffix', típicamente '.' o palabra final).
4. La parte intermedia que el estudiante debe armar consiste en una lista de piezas ('solution') de entre 5 y 7 fragmentos sintácticos en su orden gramatical exacto.
5. Añade EXACTAMENTE 1 distractor gramatical plausible ('distractors') que NO debe encajar (ej. distractor de concordancia singular/plural como 'was' vs 'were', tiempo verbal incorrecto o forma no conjugada como gerundio 'submitting' vs forma base 'submit', preposición incorrecta, o pronombre relativo erróneo).
6. El campo 'tokens' debe ser la lista completa de todas las piezas de 'solution' MÁS el distractor, todo mezclado en orden aleatorio (desordenado).
7. Proporciona una explicación gramatical pedagógica y clara en español en el campo 'explanation' detallando por qué el orden es correcto y cuál es el error con el distractor.
8. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{{
  "id": "slug-identificador-unico",
  "title": "Título Descriptivo",
  "category": "Contexto (ej. Campus Life / Academic Advising / Chemistry Lab)",
  "promptQuestion": "¿Pregunta de Speaker 1?",
  "sentencePrefix": "Palabra inicial fija (ej. 'The' o 'She' o 'Fortunately, the')",
  "sentenceSuffix": "Puntuación o palabra final (ej. '.' o 'desk.')",
  "tokens": ["fragmento 1", "fragmento 2", "distractor", "fragmento 3", ...],
  "solution": ["fragmento 1", "fragmento 2", "fragmento 3", ...],
  "distractors": ["distractor"],
  "explanation": "Oración correcta: '...'. Explicación detallada de la regla gramatical y por qué sobra el distractor."
}}"""
    else:
        raise ValueError(f"Unknown section: {section}")

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
