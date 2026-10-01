# Guía de Práctica con Inteligencia Artificial (Gemini AI)

Esta aplicación cuenta con un **sistema dual de Inteligencia Artificial** para generar ejercicios TOEFL iBT inéditos, variados y sin repetición, tanto en tu equipo local Linux como en cualquier otro dispositivo donde abras el proyecto estático.

---

## 🌟 1. ¿Cómo funciona en tu equipo actual (Linux con Gemini CLI)?

En tu equipo Linux con `agy` (Gemini CLI):
1. Ejecuta el servidor local:
   ```bash
   npm start
   # O directamente:
   python3 server.py
   ```
2. Abre la aplicación en tu navegador: [http://localhost:8080](http://localhost:8080)
3. En la barra superior verás el botón **"⚙️ Gemini"** con un punto verde (**activo**).
4. El servidor local detecta automáticamente tu instalación de `agy` y la conecta con la aplicación web sin que tengas que introducir ninguna API Key.

---

## 📱 2. ¿Cómo funciona en otros dispositivos o en hosting estático?

Para usar la aplicación en tu teléfono móvil, tablet, otra computadora o desplegada en **GitHub Pages / Vercel / Netlify** (modo 100% estático):
1. Abre la aplicación en el navegador del dispositivo.
2. Haz clic en el botón superior **"⚙️ Gemini"** (o en **"✨ Práctica con IA"**).
3. Se abrirá el modal de **Configuración de Gemini AI**.
4. Pega tu API Key gratuita de Google Gemini (puedes obtener una en 30 segundos gratis en [Google AI Studio](https://aistudio.google.com/app/apikey)).
5. Haz clic en **"Guardar Configuración"**.
6. ¡Listo! La clave se almacena de forma segura únicamente en el `localStorage` de ese dispositivo y funcionará para siempre en ese navegador.

---

## ✨ 3. Generación en tiempo real en la aplicación

### Sección 1: Reading (Complete the Words / C-Test)
- Haz clic en el botón con brillo **"✨ Práctica con IA"** en la barra de herramientas de lectura (o en el encabezado).
- Gemini creará un pasaje académico inédito de 70–100 palabras con:
  - La **primera oración 100% intacta**.
  - **Exactamente 10 palabras** académicas divididas a la mitad con corchetes `prefijo[faltante]`.
  - Temas nuevos (astrobiología, arqueometría, neurociencia, ecología de aguas profundas, etc.) que **nunca se repiten** con tus ejercicios previos.
- El ejercicio se cargará inmediatamente en pantalla para que comiences a resolverlo.

### Sección 2: Writing (Make an Appropriate Sentence / Build a Sentence)
- Cambia a la pestaña **"🧩 Writing: Sentence"**.
- Diseñado según los estándares oficiales de **ETS** y **TOEFL Resources**:
  - Cada casilla/token es de **1 sola palabra** (o a lo sumo 2 palabras en sustantivos compuestos muy cortos como `old city`, `tour guides` o `chemistry building`), sin cláusulas largas.
  - Se desordenan entre 5 y 7 palabras más **1 distractor gramatical plausible de 1 palabra**.
- Haz clic en **"✨ Práctica con IA"** para generar nuevos diálogos y oraciones contextuales universitarias.

### Sección 3: Writing (Write an Email - Nuevo Formato Oficial TOEFL 2026)
- Cambia a la pestaña **"✉️ Writing: Email"**.
- Diseñado rigurosamente bajo las especificaciones de **ETS**, **Magoosh** y **TOEFL Resources**:
  - Escenario realista de ámbito académico, campus o comunitario (~80-100 palabras).
  - Destinatario formal/semiformal y asunto.
  - **Exactamente 3 viñetas obligatorias** que debes abordar en tu respuesta.
  - Cronómetro oficial de **7 minutos** en cuenta regresiva.
  - Contador de palabras en tiempo real con indicador óptimo (**100 a 140 palabras**).
  - **Calificación con IA (Rúbricas Oficiales ETS)**:
    - Escala de 0.0 a 5.0 (C1, B2, B1, etc.).
    - Evaluación desglosada en las 4 áreas ETS:
      1. *Purposeful Communication* (cumplimiento de las 3 viñetas y detalles verosímiles).
      2. *Social Conventions & Tone* (saludo, fórmulas de cortesía/hedging y despedida).
      3. *Language Accuracy & Variety* (variedad de oraciones y riqueza léxica).
      4. *Mechanics & Organization* (extensión, párrafos y puntuación).
    - Verificación individual de cada una de las 3 viñetas (✓ Addressed / ⚠️ Partial / ✕ Missing).
    - Fortalezas, áreas de mejora, notas de estilo y **reescritura modelo pulida (Model Rewrite)** para alcanzar un 5.0.

### Continuar practicando tras terminar un ejercicio:
- Al completar cualquier ejercicio y abrir el informe de calificación, verás el botón **"✨ Siguiente con IA"** para pasar directamente a un nuevo ejercicio generado al vuelo.

---

## 💻 4. Generación por Lote desde la Terminal (CLI Script)

Si prefieres generar varios ejercicios desde la terminal de Linux y agregarlos directamente a los archivos `exercises.json`, `writing_exercises.json` o `email_exercises.json`:

```bash
# Generar 3 ejercicios de lectura (Reading)
python3 generate_exercises.py --section reading --count 3

# Generar 2 ejercicios de construcción de oraciones (Writing Sentence)
python3 generate_exercises.py --section writing --count 2

# Generar 2 nuevos escenarios de Write an Email (Writing Email)
python3 generate_exercises.py --section email --count 2

# Generar un ejercicio sobre un tema específico
python3 generate_exercises.py --section email --topic "Late laboratory report submission"
```

Los ejercicios generados se guardan de forma permanente en los archivos JSON del repositorio.
