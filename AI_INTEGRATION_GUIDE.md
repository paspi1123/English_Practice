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

### Sección 2: Writing (Make an Appropriate Sentence)
- Cambia a la pestaña **"✍️ Writing: Make a Sentence"**.
- Haz clic en **"✨ Práctica con IA"**.
- Gemini generará una conversación académica entre Speaker 1 y Speaker 2:
  - Una pregunta contextual de Speaker 1.
  - La respuesta incompleta con prefijo y sufijo.
  - El banco de palabras desordenadas con la solución más **1 distractor gramatical plausible**.
  - Una explicación pedagógica en español de las reglas sintácticas.
- El ejercicio se añade a tu lista y puedes arrastrar o hacer clic en las palabras para practicar al instante.

### Continuar practicando tras terminar un ejercicio:
- Al completar cualquier ejercicio y abrir el informe de calificación, verás el botón **"✨ Siguiente con IA"** para pasar directamente a un nuevo ejercicio generado al vuelo.

---

## 💻 4. Generación por Lote desde la Terminal (CLI Script)

Si prefieres generar varios ejercicios desde la terminal de Linux y agregarlos directamente a los archivos `exercises.json` o `writing_exercises.json`:

```bash
# Generar 3 ejercicios de lectura (Reading)
python3 generate_exercises.py --section reading --count 3

# Generar 2 ejercicios de escritura (Writing)
python3 generate_exercises.py --section writing --count 2

# Generar un ejercicio sobre un tema específico
python3 generate_exercises.py --section reading --topic "Biomimicry in Architecture"
```

Los ejercicios generados se guardan de forma permanente en los archivos JSON del repositorio.

---

## 🚀 5. ¿Cómo agregar más secciones en el futuro?

El sistema está diseñado de forma modular en [js/ai_generator.js](file:///home/paspi/Escritorio/TOEFL/toefl-app/js/ai_generator.js):

Para agregar una nueva sección (por ejemplo, `listening` o `speaking`):
1. Abre `js/ai_generator.js`.
2. Añade la configuración de la nueva sección al objeto `SECTION_CONFIGS`:
   ```javascript
   export const SECTION_CONFIGS = {
     reading: { ... },
     writing: { ... },
     nuevaSeccion: {
       name: "Nombre de la Sección",
       badge: "🎧 Listening",
       buildPrompt: (avoidTitles, avoidIds, customTopic) => `Prompt con tus reglas...`,
       validate: (data) => { /* Reglas de validación */ return true; }
     }
   };
   ```
3. El generador se adaptará automáticamente a la nueva sección.
