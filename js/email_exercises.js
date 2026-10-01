/**
 * TOEFL iBT Writing - Write an Email Exercises Library
 */

export const DEFAULT_EMAIL_EXERCISES = [
  {
    "id": "library-operating-hours",
    "title": "Library Operating Hours (TOEFL Official Sample)",
    "category": "Campus Facilities & Resources",
    "recipient": "Ms. Severin, Library Manager",
    "recipientEmail": "severin@campuslibrary.edu",
    "subject": "Inquiry regarding changed library operating hours",
    "scenario": "You are a university student and usually work on assignments in the campus library in the evenings. The library is a useful place to study because it is quiet, and contains useful books and journals. Recently, the library has been closing earlier than usual, which has made it difficult for you to complete your assignments.",
    "bulletPoints": [
      "Explain why the library is important for your studies",
      "Ask why the opening hours have changed",
      "Request information about whether the library will stay open later again"
    ],
    "targetWordCount": "100 - 140 words",
    "timeLimit": 420,
    "sampleHighScoringResponse": "Dear Ms. Severin,\n\nI am writing to inquire about the library's new operating hours. I am currently a third-year student at the university, and I frequently study in the main library during the evenings because it offers an exceptionally quiet environment with immediate access to specialized research journals and reference books. Unfortunately, since the building has started closing at 8:00 PM, I have had to work in my dormitory, which is often very noisy.\n\nCould you possibly explain why the opening hours were recently reduced? In addition, would it be possible to let me know if this schedule adjustment is temporary, and whether the library might resume staying open late again in the near future?\n\nThank you very much for your time and assistance.\n\nBest regards,\nClark Kesselring",
    "sampleAuthor": "Clark Kesselring (134 words • ETS Score 5.0)",
    "scoringRationale": "Cumple rigurosamente las 3 viñetas, añade detalles verosímiles ('third-year student', 'closing at 8:00 PM', 'research journals'), mantiene un tono sumamente cortés con hedging ('Could you possibly', 'would it be possible to') y excelente variedad sintáctica."
  }
];

const EMAIL_STORAGE_KEY = "toefl_email_custom_exercises";

export async function loadEmailExercises() {
  let list = [...DEFAULT_EMAIL_EXERCISES];
  try {
    const res = await fetch(`./email_exercises.json?nocache=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        list = json;
      }
    }
  } catch (e) {
    console.warn("Could not fetch email_exercises.json, using defaults:", e);
  }

  // Merge with localStorage custom exercises
  try {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(list.map(e => e.id));
        const newOnly = parsed.filter(e => !existingIds.has(e.id));
        return [...list, ...newOnly];
      }
    }
  } catch (e) {
    console.warn("Could not load custom email exercises from storage:", e);
  }

  return list;
}

export function saveCustomEmailExercise(exercise) {
  try {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    let list = saved ? JSON.parse(saved) : [];
    list = list.filter(item => item.id !== exercise.id);
    list.push(exercise);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("Failed to save custom email exercise:", e);
    return false;
  }
}

export function deleteCustomEmailExercise(id) {
  try {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!saved) return false;
    let list = JSON.parse(saved);
    list = list.filter(item => item.id !== id);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("Failed to delete email exercise:", e);
    return false;
  }
}
