/**
 * TOEFL iBT Scoring Engine
 * Based on ETS Updated TOEFL iBT Test Overview (Tables 1, 2, and 3)
 */

export const TOEFL_SCORING_TABLE = [
  {
    band: 6.0,
    cefr: "C2",
    readingScaled: "29-30",
    overallScaled: "114-120",
    levelName: "Mastery (C2)",
    color: "#10b981", // Emerald
    badgeClass: "badge-c2",
    description: "Dominio excepcional. Procesa con fluidez y precisión absoluta textos académicos complejos, vocabulario avanzado y estructuras sintácticas exigentes."
  },
  {
    band: 5.5,
    cefr: "C1",
    readingScaled: "27-28",
    overallScaled: "107-113",
    levelName: "Avanzado Superior (C1)",
    color: "#06b6d4", // Cyan
    badgeClass: "badge-c1",
    description: "Competencia operativa muy alta. Comprende una amplia variedad de textos extensos y exigentes, identificando matices y significados implícitos."
  },
  {
    band: 5.0,
    cefr: "C1",
    readingScaled: "24-26",
    overallScaled: "95-106",
    levelName: "Avanzado (C1)",
    color: "#3b82f6", // Blue
    badgeClass: "badge-c1",
    description: "Nivel avanzado sólido. Alto dominio léxico y gramatical para procesar textos académicos universitarios con fluidez y escasos errores."
  },
  {
    band: 4.5,
    cefr: "B2",
    readingScaled: "22-23",
    overallScaled: "86-94",
    levelName: "Intermedio Alto Superior (B2)",
    color: "#6366f1", // Indigo
    badgeClass: "badge-b2",
    description: "Capacidad para comprender las ideas principales de textos complejos tanto de temas concretos como abstractos en un contexto académico."
  },
  {
    band: 4.0,
    cefr: "B2",
    readingScaled: "18-21",
    overallScaled: "72-85",
    levelName: "Intermedio Alto (B2)",
    color: "#8b5cf6", // Purple
    badgeClass: "badge-b2",
    description: "Lectura independiente con buena comprensión general de textos universitarios estándar. Errores ocasionales en vocabulario poco frecuente."
  },
  {
    band: 3.5,
    cefr: "B1",
    readingScaled: "12-17",
    overallScaled: "58-71",
    levelName: "Intermedio (B1)",
    color: "#f59e0b", // Amber
    badgeClass: "badge-b1",
    description: "Comprende los puntos principales de textos claros en lengua estándar. Requiere reforzar vocabulario académico y derivación de palabras."
  },
  {
    band: 3.0,
    cefr: "B1",
    readingScaled: "6-11",
    overallScaled: "44-57",
    levelName: "Intermedio Básico (B1)",
    color: "#f97316", // Orange
    badgeClass: "badge-b1",
    description: "Nivel umbral. Capaz de identificar palabras comunes, pero presenta dificultades recurrentes con morfología léxica y ortografía académica."
  },
  {
    band: 2.5,
    cefr: "A2",
    readingScaled: "4-5",
    overallScaled: "34-43",
    levelName: "Plataforma / Básico (A2)",
    color: "#ef4444", // Red
    badgeClass: "badge-a2",
    description: "Nivel elemental alto. Capaz de entender frases sencillas y vocabulario frecuente, pero limitado en lecturas académicas completas."
  },
  {
    band: 2.0,
    cefr: "A2",
    readingScaled: "3",
    overallScaled: "24-33",
    levelName: "Elemental (A2)",
    color: "#dc2626", // Dark red
    badgeClass: "badge-a2",
    description: "Comprende vocabulario muy básico. Requiere mayor práctica de fundamentos gramaticales y lectura guiada."
  },
  {
    band: 1.5,
    cefr: "A1",
    readingScaled: "2",
    overallScaled: "12-23",
    levelName: "Principiante Alto (A1)",
    color: "#991b1b",
    badgeClass: "badge-a1",
    description: "Reconoce palabras aisladas muy familiares. Nivel inicial."
  },
  {
    band: 1.0,
    cefr: "A1",
    readingScaled: "0-1",
    overallScaled: "0-11",
    levelName: "Principiante (A1)",
    color: "#7f1d1d",
    badgeClass: "badge-a1",
    description: "Nivel inicial introductorio."
  }
];

/**
 * Calculates the official TOEFL score based on correct words out of total words
 * @param {number} correctWords - number of completely correct words
 * @param {number} totalWords - total words to fill (usually 10)
 * @returns {object} Score details and concordance
 */
export function calculateToeflScore(correctWords, totalWords = 10) {
  const percentage = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
  
  // Normalized score out of 10
  const normalizedOutOf10 = totalWords > 0 ? Math.round((correctWords / totalWords) * 10) : 0;

  // Direct mapping from 10-word exercises to TOEFL Band:
  // 10 -> Band 6.0
  // 9  -> Band 5.5
  // 8  -> Band 5.0
  // 7  -> Band 4.5
  // 6  -> Band 4.0
  // 5  -> Band 3.5
  // 4  -> Band 3.0
  // 3  -> Band 2.5
  // 2  -> Band 2.0
  // 1  -> Band 1.5
  // 0  -> Band 1.0
  let targetIndex = 10 - Math.min(10, Math.max(0, normalizedOutOf10));
  const scoreData = TOEFL_SCORING_TABLE[targetIndex] || TOEFL_SCORING_TABLE[TOEFL_SCORING_TABLE.length - 1];

  return {
    rawScore: correctWords,
    totalWords,
    percentage: Math.round(percentage),
    band: scoreData.band.toFixed(1),
    cefr: scoreData.cefr,
    levelName: scoreData.levelName,
    readingScaled: scoreData.readingScaled,
    overallScaled: scoreData.overallScaled,
    description: scoreData.description,
    color: scoreData.color,
    badgeClass: scoreData.badgeClass
  };
}
