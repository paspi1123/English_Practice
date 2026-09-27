/**
 * TOEFL iBT Writing - Build a Sentence Exercises Library
 */

export const DEFAULT_WRITING_EXERCISES = [
  {
    "id": "recipe-cooking-show",
    "title": "Where did you get this recipe?",
    "category": "Conversational / Daily Life",
    "promptQuestion": "Where did you get this recipe?",
    "sentencePrefix": "I",
    "sentenceSuffix": ".",
    "tokens": ["I watched", "got", "cooked", "it", "cooking show", "from a", "that"],
    "solution": ["got", "it", "from a", "cooking show", "that", "I watched"],
    "distractors": ["cooked"],
    "explanation": "Oración correcta: 'I got it from a cooking show that I watched.' La cláusula relativa 'that I watched' describe 'cooking show'. 'cooked' es la palabra distractora que sobra."
  },
  {
    "id": "tour-guides-trip",
    "title": "Highlight of the Trip (TOEFL Official)",
    "category": "Academic & Campus Exchange",
    "promptQuestion": "What was the highlight of your trip?",
    "sentencePrefix": "The",
    "sentenceSuffix": "fantastic.",
    "tokens": ["were", "the", "was", "old city", "showed us around", "who", "tour guides"],
    "solution": ["tour guides", "who", "showed us around", "the", "old city", "were"],
    "distractors": ["was"],
    "explanation": "Oración correcta: 'The tour guides who showed us around the old city were fantastic.' El sujeto es 'tour guides' (plural), por lo que concuerda con 'were'. 'was' es el distractor sobrante."
  },
  {
    "id": "library-reserve-book",
    "title": "Reserve Reading for History Class",
    "category": "Campus Life",
    "promptQuestion": "Have you seen the reserve reading for history class?",
    "sentencePrefix": "The",
    "sentenceSuffix": "desk.",
    "tokens": ["professor", "said he", "left", "it", "leaving", "on", "the front"],
    "solution": ["professor", "said he", "left", "it", "on", "the front"],
    "distractors": ["leaving"],
    "explanation": "Oración correcta: 'The professor said he left it on the front desk.' 'leaving' es la forma en participio distractora no conjugada."
  },
  {
    "id": "biology-lab-samples",
    "title": "Experiment Samples Condition",
    "category": "Academic Science",
    "promptQuestion": "Why did the experiment fail to yield expected results?",
    "sentencePrefix": "The",
    "sentenceSuffix": "overnight.",
    "tokens": ["samples", "which", "were", "was", "stored", "improperly", "spoiled"],
    "solution": ["samples", "which", "were", "stored", "improperly", "spoiled"],
    "distractors": ["was"],
    "explanation": "Oración correcta: 'The samples which were stored improperly spoiled overnight.' El sujeto plural 'samples' rige 'were stored'. 'was' es el distractor."
  },
  {
    "id": "internship-proposal",
    "title": "Securing the Summer Internship",
    "category": "Campus / Professional",
    "promptQuestion": "How did Maria secure that prestigious summer internship?",
    "sentencePrefix": "She",
    "sentenceSuffix": "committee.",
    "tokens": ["submitted", "a proposal", "submitting", "that", "impressed", "the review"],
    "solution": ["submitted", "a proposal", "that", "impressed", "the review"],
    "distractors": ["submitting"],
    "explanation": "Oración correcta: 'She submitted a proposal that impressed the review committee.' 'submitting' es el distractor gramatical."
  },
  {
    "id": "computer-backup-cloud",
    "title": "Term Paper Recovery",
    "category": "Academic Life",
    "promptQuestion": "Were you able to recover your term paper after the crash?",
    "sentencePrefix": "Fortunately, the",
    "sentenceSuffix": "cloud.",
    "tokens": ["version", "I had", "saved", "saving", "automatically", "backed up to the"],
    "solution": ["version", "I had", "saved", "automatically", "backed up to the"],
    "distractors": ["saving"],
    "explanation": "Oración correcta: 'Fortunately, the version I had saved automatically backed up to the cloud.' 'saving' sobra."
  }
];

const WRITING_STORAGE_KEY = "toefl_writing_custom_exercises";

export async function loadWritingExercises() {
  let list = [...DEFAULT_WRITING_EXERCISES];
  try {
    const res = await fetch(`./writing_exercises.json?nocache=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        list = json;
      }
    }
  } catch (e) {
    console.warn("Could not fetch writing_exercises.json, using defaults:", e);
  }

  // Merge with localStorage custom exercises
  try {
    const saved = localStorage.getItem(WRITING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(list.map(e => e.id));
        const newOnly = parsed.filter(e => !existingIds.has(e.id));
        return [...list, ...newOnly];
      }
    }
  } catch (e) {
    console.warn("Could not load custom writing exercises from storage:", e);
  }

  return list;
}

export function saveCustomWritingExercise(exercise) {
  try {
    const saved = localStorage.getItem(WRITING_STORAGE_KEY);
    let list = saved ? JSON.parse(saved) : [];
    list = list.filter(item => item.id !== exercise.id);
    list.push(exercise);
    localStorage.setItem(WRITING_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("Failed to save custom writing exercise:", e);
    return false;
  }
}

export function deleteCustomWritingExercise(id) {
  try {
    const saved = localStorage.getItem(WRITING_STORAGE_KEY);
    if (!saved) return false;
    let list = JSON.parse(saved);
    list = list.filter(item => item.id !== id);
    localStorage.setItem(WRITING_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("Failed to delete writing exercise:", e);
    return false;
  }
}

