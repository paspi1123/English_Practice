/**
 * TOEFL iBT Complete the Words - Main Application Controller
 */

import {
  loadSavedExercises,
  saveCustomExercise,
  deleteCustomExercise,
  parseExercise,
  generateToeflExerciseFromParagraph,
  DEFAULT_EXERCISES
} from './exercises.js?v=4.0';

import {
  saveCustomWritingExercise,
  deleteCustomWritingExercise
} from './writing_exercises.js?v=4.0';

import { calculateToeflScore } from './scoring.js?v=3.0';
import { sound } from './audio.js?v=3.0';
import { WritingController } from './writing_controller.js?v=4.0';
import { geminiAI, SECTION_CONFIGS } from './ai_generator.js?v=4.0';

class ToeflApp {
  constructor() {
    this.exercises = [];
    this.currentExerciseIndex = 0;
    this.currentParsed = null;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isSubmitted = false;
    this.userAnswers = {}; // blankId -> string of letters
    this.currentFilter = 'all'; // 'all', 'unchecked', 'checked'
    this.completedExercises = this.loadCompletedMap();
    this.activeSection = 'reading';
    this.aiCancelRequested = false;

    this.cacheDom();
    this.writingController = new WritingController(this);
    this.init();
  }

  cacheDom() {
    // Section Switcher
    this.btnNavReading = document.getElementById('btnNavReading');
    this.btnNavWriting = document.getElementById('btnNavWriting');
    this.readingSection = document.getElementById('readingSection');
    this.writingSection = document.getElementById('writingSection');

    // Header & Toolbar
    this.exerciseSelect = document.getElementById('exerciseSelect');
    this.filterSelect = document.getElementById('filterSelect');
    this.btnToggleCompleted = document.getElementById('btnToggleCompleted');
    this.checkToggleIcon = document.getElementById('checkToggleIcon');
    this.checkToggleText = document.getElementById('checkToggleText');
    this.completedCounterText = document.getElementById('completedCounterText');
    this.categoryBadge = document.getElementById('exerciseCategoryBadge');
    this.progressText = document.getElementById('progressText');
    this.timerText = document.getElementById('timerText');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.btnToggleAudio = document.getElementById('btnToggleAudio');
    this.audioIcon = document.getElementById('audioIcon');
    this.btnToggleTheme = document.getElementById('btnToggleTheme');
    this.themeIcon = document.getElementById('themeIcon');

    // AI Header Buttons
    this.btnHeaderAiPractice = document.getElementById('btnHeaderAiPractice');
    this.btnOpenGeminiSettings = document.getElementById('btnOpenGeminiSettings');
    this.geminiStatusDot = document.getElementById('geminiStatusDot');

    // Reading AI Button & Count
    this.btnReadingAiGenerate = document.getElementById('btnReadingAiGenerate');
    this.selectReadingAiCount = document.getElementById('selectReadingAiCount');

    // Main Area
    this.passageCard = document.getElementById('passageCard');
    this.passageContainer = document.getElementById('passageContainer');
    this.btnReset = document.getElementById('btnReset');
    this.btnHint = document.getElementById('btnHint');
    this.btnSubmit = document.getElementById('btnSubmit');
    this.btnNext = document.getElementById('btnNext');

    // Score Modal
    this.scoreModal = document.getElementById('scoreModal');
    this.btnCloseScoreModal = document.getElementById('btnCloseScoreModal');
    this.modalBandScore = document.getElementById('modalBandScore');
    this.modalScoreCircle = document.getElementById('modalScoreCircle');
    this.modalLevelName = document.getElementById('modalLevelName');
    this.modalCefrBadge = document.getElementById('modalCefrBadge');
    this.modalDescription = document.getElementById('modalDescription');
    this.modalReadingScaled = document.getElementById('modalReadingScaled');
    this.modalOverallScaled = document.getElementById('modalOverallScaled');
    this.modalRawScore = document.getElementById('modalRawScore');
    this.modalTimeSpent = document.getElementById('modalTimeSpent');
    this.modalWordReviewList = document.getElementById('modalWordReviewList');
    this.btnModalReviewText = document.getElementById('btnModalReviewText');
    this.btnModalNext = document.getElementById('btnModalNext');
    this.btnModalAiNext = document.getElementById('btnModalAiNext');

    // Exercise Management Modal
    this.btnManageExercises = document.getElementById('btnManageExercises');
    this.manageModal = document.getElementById('manageModal');
    this.btnCloseManageModal = document.getElementById('btnCloseManageModal');
    this.btnCancelManage = document.getElementById('btnCancelManage');
    this.btnSaveCustomExercise = document.getElementById('btnSaveCustomExercise');

    // Tabs & inputs
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.inputTitle = document.getElementById('inputTitle');
    this.inputCategory = document.getElementById('inputCategory');
    this.inputTextBrackets = document.getElementById('inputTextBrackets');
    this.bracketPreview = document.getElementById('bracketPreview');
    this.btnLoadSampleBracket = document.getElementById('btnLoadSampleBracket');

    this.inputPlainTitle = document.getElementById('inputPlainTitle');
    this.inputTextPlain = document.getElementById('inputTextPlain');
    this.btnConvertPlain = document.getElementById('btnConvertPlain');

    // AI Tab in Manage Modal
    this.selectAiSection = document.getElementById('selectAiSection');
    this.inputAiTopic = document.getElementById('inputAiTopic');
    this.selectAiCount = document.getElementById('selectAiCount');
    this.btnModalGenerateAi = document.getElementById('btnModalGenerateAi');
    this.aiGeneratedPreviewGroup = document.getElementById('aiGeneratedPreviewGroup');
    this.aiGeneratedPreview = document.getElementById('aiGeneratedPreview');

    this.customExercisesList = document.getElementById('customExercisesList');
    this.btnExportJSON = document.getElementById('btnExportJSON');
    this.btnExportWritingJSON = document.getElementById('btnExportWritingJSON');
    this.btnCopyPromptHelper = document.getElementById('btnCopyPromptHelper');

    // Gemini Settings Modal
    this.geminiSettingsModal = document.getElementById('geminiSettingsModal');
    this.btnCloseGeminiSettings = document.getElementById('btnCloseGeminiSettings');
    this.btnCancelGeminiSettings = document.getElementById('btnCancelGeminiSettings');
    this.btnSaveGeminiSettings = document.getElementById('btnSaveGeminiSettings');
    this.btnTestGeminiConnection = document.getElementById('btnTestGeminiConnection');
    this.selectAiEngineMode = document.getElementById('selectAiEngineMode');
    this.inputGeminiApiKey = document.getElementById('inputGeminiApiKey');
    this.btnToggleApiKeyVisibility = document.getElementById('btnToggleApiKeyVisibility');
    this.selectGeminiModel = document.getElementById('selectGeminiModel');
    this.geminiTestFeedback = document.getElementById('geminiTestFeedback');
    this.geminiStatusTitle = document.getElementById('geminiStatusTitle');
    this.geminiStatusDesc = document.getElementById('geminiStatusDesc');
    this.geminiCardDot = document.getElementById('geminiCardDot');

    // AI Loading Overlay Modal
    this.aiLoadingOverlay = document.getElementById('aiLoadingOverlay');
    this.aiLoadingStatusText = document.getElementById('aiLoadingStatusText');
    this.btnCancelAiGeneration = document.getElementById('btnCancelAiGeneration');
    this.aiStep1 = document.getElementById('aiStep1');
    this.aiStep2 = document.getElementById('aiStep2');
    this.aiStep3 = document.getElementById('aiStep3');

    // Toast
    this.toast = document.getElementById('toastMessage');
  }

  loadCompletedMap() {
    try {
      const saved = localStorage.getItem('toefl_completed_exercises_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    // Pre-mark the first 6 as completed because the user indicated they already did them!
    const initial = {
      'coral-reefs': { completed: true },
      'cave-dances': { completed: true },
      'mirror-test': { completed: true },
      'roman-concrete': { completed: true },
      'bioluminescence': { completed: true },
      'urban-greenspaces': { completed: true }
    };
    this.saveCompletedMap(initial);
    return initial;
  }

  saveCompletedMap(map) {
    try {
      localStorage.setItem('toefl_completed_exercises_v1', JSON.stringify(map));
    } catch (e) {}
  }

  isExerciseCompleted(id) {
    return !!(this.completedExercises && this.completedExercises[id]?.completed);
  }

  toggleCurrentCompleted() {
    if (!this.exercises || !this.exercises[this.currentExerciseIndex]) return;
    const ex = this.exercises[this.currentExerciseIndex];
    const isComp = this.isExerciseCompleted(ex.id);
    
    if (isComp) {
      delete this.completedExercises[ex.id];
      this.showToast(`"${ex.title}" marcado como pendiente ⏳`);
    } else {
      this.completedExercises[ex.id] = { completed: true, timestamp: Date.now() };
      this.showToast(`"${ex.title}" marcado como completado ✓`);
    }
    
    this.saveCompletedMap(this.completedExercises);
    this.updateCheckToggleButton();
    this.populateExerciseDropdown();
  }

  updateCheckToggleButton() {
    if (!this.exercises || !this.exercises[this.currentExerciseIndex]) return;
    const ex = this.exercises[this.currentExerciseIndex];
    const isComp = this.isExerciseCompleted(ex.id);

    if (isComp) {
      this.btnToggleCompleted.classList.add('is-completed');
      this.checkToggleIcon.textContent = '✓';
      this.checkToggleText.textContent = 'Completado';
      this.btnToggleCompleted.title = 'Haz clic para marcar como pendiente';
    } else {
      this.btnToggleCompleted.classList.remove('is-completed');
      this.checkToggleIcon.textContent = '○';
      this.checkToggleText.textContent = 'Marcar Hecho';
      this.btnToggleCompleted.title = 'Haz clic para marcar como completado';
    }
  }

  async init() {
    try {
      const res = await fetch(`./exercises.json?nocache=${Date.now()}`);
      if (res.ok) {
        const fromJson = await res.json();
        if (Array.isArray(fromJson) && fromJson.length > 0) {
          this.exercises = fromJson;
        }
      }
    } catch (e) {
      console.warn("Direct fetch error:", e);
    }

    if (!this.exercises || this.exercises.length === 0) {
      this.exercises = await loadSavedExercises();
    }

    // Merge any custom exercises stored in localStorage
    try {
      const saved = localStorage.getItem('toefl_c_test_custom_exercises');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(this.exercises.map(e => e.id));
          parsed.forEach(p => {
            if (!ids.has(p.id)) this.exercises.push(p);
          });
        }
      }
    } catch (e) {}

    this.populateExerciseDropdown();
    this.bindEvents();
    this.loadExercise(0);
    this.startTimer();

    // Initialize Writing section
    if (this.writingController) {
      await this.writingController.init();
    }

    // Check Gemini AI connection status
    this.checkAndRefreshGeminiStatus();
  }

  populateExerciseDropdown() {
    this.exerciseSelect.innerHTML = '';

    // Count completed
    let completedCount = 0;
    this.exercises.forEach(ex => {
      if (this.isExerciseCompleted(ex.id)) completedCount++;
    });
    const totalCount = this.exercises.length;
    if (this.completedCounterText) {
      this.completedCounterText.textContent = `${completedCount} / ${totalCount}`;
    }

    // Filter exercises
    const filter = this.currentFilter || 'all';
    const filtered = this.exercises.map((ex, idx) => ({ ex, originalIndex: idx })).filter(item => {
      const isComp = this.isExerciseCompleted(item.ex.id);
      if (filter === 'checked') return isComp;
      if (filter === 'unchecked') return !isComp;
      return true;
    });

    if (filtered.length === 0) {
      const opt = document.createElement('option');
      opt.value = -1;
      opt.textContent = `(Sin ejercicios en este filtro)`;
      opt.disabled = true;
      opt.selected = true;
      this.exerciseSelect.appendChild(opt);
      return;
    }

    filtered.forEach(item => {
      const isComp = this.isExerciseCompleted(item.ex.id);
      const opt = document.createElement('option');
      opt.value = item.originalIndex;
      const statusIcon = isComp ? '✓' : '○';
      opt.textContent = `${statusIcon} ${item.originalIndex + 1}. ${item.ex.title}`;
      if (item.originalIndex === this.currentExerciseIndex) {
        opt.selected = true;
      }
      this.exerciseSelect.appendChild(opt);
    });

    // If current exercise not in filtered list, load first matching
    const currentInFiltered = filtered.some(f => f.originalIndex === this.currentExerciseIndex);
    if (!currentInFiltered && filtered.length > 0) {
      this.loadExercise(filtered[0].originalIndex);
    }
  }

  loadExercise(index) {
    if (index < 0 || index >= this.exercises.length) return;
    this.currentExerciseIndex = index;
    this.exerciseSelect.value = index;

    const ex = this.exercises[index];
    this.categoryBadge.textContent = ex.category || 'Academic';
    this.currentParsed = parseExercise(ex.rawText);
    this.isSubmitted = false;
    this.userAnswers = {};

    this.renderPassage();
    this.resetTimer();
    this.updateProgress();
    this.updateCheckToggleButton();

    // Focus first input automatically
    setTimeout(() => {
      const firstInput = this.passageContainer.querySelector('input.c-letter-input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  renderPassage() {
    this.passageContainer.innerHTML = '';
    if (!this.currentParsed) return;

    this.currentParsed.tokens.forEach(token => {
      if (token.type === 'text') {
        const span = document.createElement('span');
        span.className = 'text-token';
        span.textContent = token.content;
        this.passageContainer.appendChild(span);
      } else if (token.type === 'blank') {
        const wordContainer = document.createElement('span');
        wordContainer.className = 'c-word-container';
        wordContainer.dataset.blankId = token.id;
        wordContainer.dataset.prefix = token.prefix;
        wordContainer.dataset.answer = token.answer;
        wordContainer.dataset.fullWord = token.fullWord;

        // Prefix
        const prefixSpan = document.createElement('span');
        prefixSpan.className = 'c-word-prefix';
        prefixSpan.textContent = token.prefix;
        wordContainer.appendChild(prefixSpan);

        // Slots
        const slotsContainer = document.createElement('span');
        slotsContainer.className = 'c-word-slots';

        for (let i = 0; i < token.length; i++) {
          const slot = document.createElement('span');
          slot.className = 'c-letter-slot';

          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'c-letter-input';
          input.maxLength = 1;
          input.autocomplete = 'off';
          input.autocapitalize = 'none';
          input.spellcheck = false;
          input.dataset.blankId = token.id;
          input.dataset.slotIndex = i;
          input.dataset.expectedLetter = token.answer[i] || '';

          slot.appendChild(input);
          slotsContainer.appendChild(slot);
        }

        wordContainer.appendChild(slotsContainer);
        this.passageContainer.appendChild(wordContainer);
      }
    });
  }

  bindEvents() {
    // Select Exercise
    this.exerciseSelect.addEventListener('change', (e) => {
      this.loadExercise(parseInt(e.target.value, 10));
    });

    // Filter selection (All, Unchecked, Checked)
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.populateExerciseDropdown();
      });
    }

    // Toggle completed button for current exercise
    if (this.btnToggleCompleted) {
      this.btnToggleCompleted.addEventListener('click', () => {
        this.toggleCurrentCompleted();
      });
    }

    // Passage Keyboard Navigation & Typing (Delegated)
    this.passageContainer.addEventListener('keydown', (e) => this.handleSlotKeyDown(e));
    this.passageContainer.addEventListener('input', (e) => this.handleSlotInput(e));
    this.passageContainer.addEventListener('focusin', (e) => {
      if (e.target.classList.contains('c-letter-input')) {
        const wordContainer = e.target.closest('.c-word-container');
        document.querySelectorAll('.c-word-container.is-focused-word').forEach(el => el.classList.remove('is-focused-word'));
        if (wordContainer) wordContainer.classList.add('is-focused-word');
      }
    });

    // Control buttons
    this.btnReset.addEventListener('click', () => this.resetCurrentAnswers());
    this.btnHint.addEventListener('click', () => this.revealHint());
    this.btnSubmit.addEventListener('click', () => this.submitExercise());
    this.btnNext.addEventListener('click', () => this.nextExercise());

    // Score Modal actions
    this.btnCloseScoreModal.addEventListener('click', () => this.closeScoreModal());
    this.btnModalReviewText.addEventListener('click', () => this.closeScoreModal());
    this.btnModalNext.addEventListener('click', () => {
      this.closeScoreModal();
      this.nextExercise();
    });

    // Audio & Theme toggles
    this.btnToggleAudio.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      this.audioIcon.textContent = sound.enabled ? '🔊' : '🔇';
      this.showToast(sound.enabled ? 'Sonido activado' : 'Sonido silenciado');
    });

    this.btnToggleTheme.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      this.themeIcon.textContent = isDark ? '☀️' : '🌙';
    });

    // Exercise Management Modal
    this.btnManageExercises.addEventListener('click', () => this.openManageModal());
    this.btnCloseManageModal.addEventListener('click', () => this.closeManageModal());
    this.btnCancelManage.addEventListener('click', () => this.closeManageModal());
    this.btnSaveCustomExercise.addEventListener('click', () => this.saveCustomFromModal());

    // Management Tabs
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchManageTab(btn.dataset.tab));
    });

    // Live preview in Manage modal
    this.inputTextBrackets.addEventListener('input', () => this.updateBracketPreview());
    this.btnLoadSampleBracket.addEventListener('click', () => this.loadSampleBracket());
    this.btnConvertPlain.addEventListener('click', () => this.convertPlainToBrackets());
    this.btnExportJSON.addEventListener('click', () => this.exportExercisesJSON());
    this.btnCopyPromptHelper.addEventListener('click', () => this.copyPromptHelper());

    // Section Switcher tabs
    if (this.btnNavReading) {
      this.btnNavReading.addEventListener('click', () => this.switchSection('reading'));
    }
    if (this.btnNavWriting) {
      this.btnNavWriting.addEventListener('click', () => this.switchSection('writing'));
    }

    // AI Practice and Gemini buttons
    if (this.btnHeaderAiPractice) {
      this.btnHeaderAiPractice.addEventListener('click', () => this.triggerAiPractice());
    }
    if (this.btnOpenGeminiSettings) {
      this.btnOpenGeminiSettings.addEventListener('click', () => this.openGeminiSettings());
    }
    if (this.btnReadingAiGenerate) {
      this.btnReadingAiGenerate.addEventListener('click', () => {
        const count = this.selectReadingAiCount ? parseInt(this.selectReadingAiCount.value, 10) : 1;
        this.triggerAiPractice('reading', { count });
      });
    }
    if (this.btnModalAiNext) {
      this.btnModalAiNext.addEventListener('click', () => {
        this.closeScoreModal();
        this.triggerAiPractice();
      });
    }

    // AI Manage Tab & Exports
    if (this.btnModalGenerateAi) {
      this.btnModalGenerateAi.addEventListener('click', () => this.generateFromManageModal());
    }
    if (this.btnExportWritingJSON) {
      this.btnExportWritingJSON.addEventListener('click', () => this.exportWritingExercisesJSON());
    }

    // Gemini Settings Modal
    if (this.btnCloseGeminiSettings) {
      this.btnCloseGeminiSettings.addEventListener('click', () => this.closeGeminiSettings());
    }
    if (this.btnCancelGeminiSettings) {
      this.btnCancelGeminiSettings.addEventListener('click', () => this.closeGeminiSettings());
    }
    if (this.btnSaveGeminiSettings) {
      this.btnSaveGeminiSettings.addEventListener('click', () => this.saveGeminiSettings());
    }
    if (this.btnTestGeminiConnection) {
      this.btnTestGeminiConnection.addEventListener('click', () => this.testGeminiConnection());
    }
    if (this.btnToggleApiKeyVisibility) {
      this.btnToggleApiKeyVisibility.addEventListener('click', () => this.toggleApiKeyVisibility());
    }

    // AI Loading Overlay
    if (this.btnCancelAiGeneration) {
      this.btnCancelAiGeneration.addEventListener('click', () => this.cancelAiGeneration());
    }

    // Keyboard shortcut Enter to submit (only in reading)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.activeSection === 'reading' && !this.manageModal.classList.contains('active') && !this.scoreModal.classList.contains('active') && (!this.geminiSettingsModal || !this.geminiSettingsModal.classList.contains('active'))) {
        this.submitExercise();
      }
    });
  }

  switchSection(section) {
    this.activeSection = section;
    const isReading = section === 'reading';

    if (this.btnNavReading) {
      this.btnNavReading.classList.toggle('active', isReading);
      this.btnNavReading.setAttribute('aria-selected', isReading);
    }
    if (this.btnNavWriting) {
      this.btnNavWriting.classList.toggle('active', !isReading);
      this.btnNavWriting.setAttribute('aria-selected', !isReading);
    }

    if (this.readingSection) this.readingSection.style.display = isReading ? 'block' : 'none';
    if (this.writingSection) this.writingSection.style.display = isReading ? 'none' : 'block';

    this.showToast(isReading ? 'Sección: Reading (Complete the Words)' : 'Sección: Writing (Make a Sentence)');
  }

  handleSlotInput(e) {
    const input = e.target;
    if (!input.classList.contains('c-letter-input')) return;

    sound.playKey();
    const val = input.value;
    if (val.length > 0) {
      // Advance to next slot
      const nextInput = this.findNextInput(input);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      } else {
        sound.playWordComplete();
      }
    }
    this.updateProgress();
  }

  handleSlotKeyDown(e) {
    const input = e.target;
    if (!input.classList.contains('c-letter-input')) return;

    const key = e.key;

    if (key === 'Backspace') {
      if (input.value === '') {
        e.preventDefault();
        const prevInput = this.findPrevInput(input);
        if (prevInput) {
          prevInput.value = '';
          prevInput.focus();
        }
      } else {
        // Clear current
        input.value = '';
        e.preventDefault();
      }
      this.updateProgress();
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      const prevInput = this.findPrevInput(input);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      const nextInput = this.findNextInput(input);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (key === ' ' || key === 'Tab') {
      if (key === ' ') e.preventDefault();
      if (!e.shiftKey) {
        // Jump to first slot of NEXT word
        const nextWordFirstInput = this.findNextWordInput(input);
        if (nextWordFirstInput) {
          if (key === 'Tab') e.preventDefault();
          nextWordFirstInput.focus();
          nextWordFirstInput.select();
        }
      } else if (e.shiftKey && key === 'Tab') {
        const prevWordFirstInput = this.findPrevWordInput(input);
        if (prevWordFirstInput) {
          e.preventDefault();
          prevWordFirstInput.focus();
          prevWordFirstInput.select();
        }
      }
    }
  }

  findNextInput(currentInput) {
    const allInputs = Array.from(this.passageContainer.querySelectorAll('input.c-letter-input'));
    const idx = allInputs.indexOf(currentInput);
    return idx >= 0 && idx < allInputs.length - 1 ? allInputs[idx + 1] : null;
  }

  findPrevInput(currentInput) {
    const allInputs = Array.from(this.passageContainer.querySelectorAll('input.c-letter-input'));
    const idx = allInputs.indexOf(currentInput);
    return idx > 0 ? allInputs[idx - 1] : null;
  }

  findNextWordInput(currentInput) {
    const currentContainer = currentInput.closest('.c-word-container');
    const allContainers = Array.from(this.passageContainer.querySelectorAll('.c-word-container'));
    const wordIdx = allContainers.indexOf(currentContainer);
    if (wordIdx >= 0 && wordIdx < allContainers.length - 1) {
      return allContainers[wordIdx + 1].querySelector('input.c-letter-input');
    }
    return null;
  }

  findPrevWordInput(currentInput) {
    const currentContainer = currentInput.closest('.c-word-container');
    const allContainers = Array.from(this.passageContainer.querySelectorAll('.c-word-container'));
    const wordIdx = allContainers.indexOf(currentContainer);
    if (wordIdx > 0) {
      return allContainers[wordIdx - 1].querySelector('input.c-letter-input');
    }
    return null;
  }

  updateProgress() {
    if (!this.currentParsed) return;
    const containers = this.passageContainer.querySelectorAll('.c-word-container');
    let filledWords = 0;

    containers.forEach(container => {
      const inputs = container.querySelectorAll('input.c-letter-input');
      const isComplete = Array.from(inputs).every(inp => inp.value.trim().length > 0);
      if (isComplete) filledWords++;
    });

    const total = this.currentParsed.totalBlanks || 10;
    this.progressText.textContent = `${filledWords} / ${total}`;
  }

  revealHint() {
    const inputs = Array.from(this.passageContainer.querySelectorAll('input.c-letter-input'));
    const emptyOrIncorrect = inputs.find(inp => inp.value.toLowerCase() !== inp.dataset.expectedLetter.toLowerCase());
    if (emptyOrIncorrect) {
      emptyOrIncorrect.value = emptyOrIncorrect.dataset.expectedLetter;
      emptyOrIncorrect.style.color = 'var(--primary)';
      emptyOrIncorrect.focus();
      this.updateProgress();
      this.showToast(`Pista revelada: "${emptyOrIncorrect.dataset.expectedLetter}"`);
    } else {
      this.showToast('¡Todas las letras están completadas!');
    }
  }

  resetCurrentAnswers() {
    const inputs = this.passageContainer.querySelectorAll('input.c-letter-input');
    inputs.forEach(inp => {
      inp.value = '';
      inp.style.color = '';
    });
    const containers = this.passageContainer.querySelectorAll('.c-word-container');
    containers.forEach(c => {
      c.classList.remove('status-correct', 'status-incorrect', 'is-focused-word');
      const tooltip = c.querySelector('.c-correct-tooltip');
      if (tooltip) tooltip.remove();
    });
    this.updateProgress();
    this.resetTimer();
    const firstInput = this.passageContainer.querySelector('input.c-letter-input');
    if (firstInput) firstInput.focus();
    this.showToast('Respuestas reiniciadas');
  }

  submitExercise() {
    if (!this.currentParsed) return;

    this.isSubmitted = true;
    const wordContainers = this.passageContainer.querySelectorAll('.c-word-container');
    let correctCount = 0;
    let reviewData = [];

    wordContainers.forEach(container => {
      const prefix = container.dataset.prefix;
      const expectedAnswer = container.dataset.answer;
      const fullWord = container.dataset.fullWord;
      const inputs = container.querySelectorAll('input.c-letter-input');

      let userTypedSuffix = '';
      inputs.forEach(inp => {
        userTypedSuffix += (inp.value || '').trim();
      });

      const isCorrect = userTypedSuffix.toLowerCase() === expectedAnswer.toLowerCase();
      if (isCorrect) correctCount++;

      // Visual feedback on passage
      container.classList.remove('status-correct', 'status-incorrect');
      container.classList.add(isCorrect ? 'status-correct' : 'status-incorrect');

      // Add tooltip showing correct word on hover
      let tooltip = container.querySelector('.c-correct-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('span');
        tooltip.className = 'c-correct-tooltip';
        container.appendChild(tooltip);
      }
      tooltip.textContent = fullWord;

      reviewData.push({
        prefix,
        expectedAnswer,
        userTypedSuffix,
        fullWord,
        isCorrect
      });
    });

    const totalWords = this.currentParsed.totalBlanks || 10;
    const scoreResult = calculateToeflScore(correctCount, totalWords);

    // Auto mark as completed
    const currentEx = this.exercises[this.currentExerciseIndex];
    if (currentEx) {
      this.completedExercises[currentEx.id] = {
        completed: true,
        band: scoreResult.band,
        score: correctCount,
        timestamp: Date.now()
      };
      this.saveCompletedMap(this.completedExercises);
      this.updateCheckToggleButton();
      this.populateExerciseDropdown();
    }

    if (scoreResult.band >= 5.0) {
      sound.playSuccess();
    } else {
      sound.playWordComplete();
    }

    this.displayScoreModal(scoreResult, reviewData);
  }

  displayScoreModal(scoreResult, reviewData) {
    this.modalBandScore.textContent = scoreResult.band;
    this.modalScoreCircle.style.background = scoreResult.color;
    this.modalLevelName.textContent = scoreResult.levelName;

    this.modalCefrBadge.textContent = scoreResult.cefr;
    this.modalCefrBadge.className = `cefr-badge ${scoreResult.badgeClass}`;
    this.modalDescription.textContent = scoreResult.description;

    this.modalReadingScaled.innerHTML = `${scoreResult.readingScaled} <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted)">/ 30</span>`;
    this.modalOverallScaled.innerHTML = `${scoreResult.overallScaled} <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted)">/ 120</span>`;
    this.modalRawScore.textContent = `${scoreResult.rawScore} / ${scoreResult.totalWords} (${scoreResult.percentage}%)`;
    this.modalTimeSpent.textContent = this.formatTime(this.timerSeconds);

    // Populate review list
    this.modalWordReviewList.innerHTML = '';
    reviewData.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = `word-review-item ${item.isCorrect ? 'is-correct' : 'is-incorrect'}`;

      const wordText = document.createElement('span');
      wordText.className = 'review-word-text';
      wordText.textContent = `${item.prefix}...`;

      const answersSpan = document.createElement('div');
      answersSpan.className = 'review-answers';

      if (item.isCorrect) {
        answersSpan.innerHTML = `<span class="review-correct-ans">✓ ${item.fullWord}</span>`;
      } else {
        const userWord = item.prefix + (item.userTypedSuffix || '—');
        answersSpan.innerHTML = `
          <span class="review-user-ans">${userWord}</span>
          <span class="review-correct-ans">→ ${item.fullWord}</span>
        `;
      }

      itemEl.appendChild(wordText);
      itemEl.appendChild(answersSpan);
      this.modalWordReviewList.appendChild(itemEl);
    });

    this.scoreModal.classList.add('active');
  }

  closeScoreModal() {
    this.scoreModal.classList.remove('active');
  }

  nextExercise() {
    const nextIdx = (this.currentExerciseIndex + 1) % this.exercises.length;
    this.loadExercise(nextIdx);
  }

  // Timer logic
  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.timerText.textContent = this.formatTime(this.timerSeconds);
    }, 1000);
  }

  resetTimer() {
    this.timerSeconds = 0;
    this.timerText.textContent = '00:00';
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Exercise Management Modal
  openManageModal() {
    this.switchManageTab('brackets');
    this.renderCustomExercisesList();
    this.manageModal.classList.add('active');
  }

  closeManageModal() {
    this.manageModal.classList.remove('active');
  }

  switchManageTab(tabId) {
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.getElementById('tabContentBrackets').style.display = tabId === 'brackets' ? 'block' : 'none';
    document.getElementById('tabContentPlain').style.display = tabId === 'plain' ? 'block' : 'none';
    const tabAi = document.getElementById('tabContentAi');
    if (tabAi) tabAi.style.display = tabId === 'ai' ? 'block' : 'none';
    document.getElementById('tabContentManage').style.display = tabId === 'manage' ? 'block' : 'none';

    if (tabId === 'ai' && this.selectAiSection) {
      this.selectAiSection.value = this.activeSection || 'reading';
    }
    if (tabId === 'manage') {
      this.renderCustomExercisesList();
    }
  }

  updateBracketPreview() {
    const text = this.inputTextBrackets.value;
    if (!text.trim()) {
      this.bracketPreview.innerHTML = 'Escribe o pega texto arriba para ver la vista previa...';
      return;
    }

    const parsed = parseExercise(text);
    let html = '';
    parsed.tokens.forEach(tok => {
      if (tok.type === 'text') {
        html += tok.content;
      } else {
        html += ` <strong style="color:var(--primary);">${tok.prefix}</strong><span style="border-bottom:2px dashed var(--dash-focus); padding: 0 4px; font-weight:700; color:var(--text-muted);">${tok.answer}</span> `;
      }
    });

    this.bracketPreview.innerHTML = `
      <div style="margin-bottom:0.5rem; font-size:0.8rem; font-weight:700; color:var(--primary);">
        Palabras detectadas: ${parsed.totalBlanks} / 10
      </div>
      <div>${html}</div>
    `;
  }

  loadSampleBracket() {
    this.inputTitle.value = "Photosynthesis in Desert Succulents";
    this.inputCategory.value = "Botany & Ecology";
    this.inputTextBrackets.value = `Desert plants have evolved unique survival mechanisms to withstand prolonged droughts. Spec[ialized] tissues store wat[er] efficiently inside fle[shy] leaves. Dur[ing] the night, th[ese] succulents op[en] their sto[mata] to capture car[bon] dioxide. In addi[tion], a waxy out[er] cuticle prevents rapid evapor[ation] during intense daytime heat.`;
    this.updateBracketPreview();
  }

  convertPlainToBrackets() {
    const rawPlain = this.inputTextPlain.value;
    if (!rawPlain.trim()) {
      alert("Por favor pega un párrafo primero.");
      return;
    }

    const converted = generateToeflExerciseFromParagraph(rawPlain);
    this.inputTitle.value = this.inputPlainTitle.value || "Custom Academic Passage";
    this.inputTextBrackets.value = converted;
    this.switchManageTab('brackets');
    this.updateBracketPreview();
    this.showToast('¡Párrafo convertido a formato TOEFL!');
  }

  saveCustomFromModal() {
    const title = this.inputTitle.value.trim() || `Ejercicio Personalizado ${this.exercises.length + 1}`;
    const category = this.inputCategory.value.trim() || 'Academic';
    const rawText = this.inputTextBrackets.value.trim();

    if (!rawText) {
      alert("Por favor introduce el texto del ejercicio.");
      return;
    }

    const parsed = parseExercise(rawText);
    if (parsed.blanks.length === 0) {
      alert("No se detectaron corchetes en el texto. Usa la sintaxis prefijo[faltante], por ejemplo: Mill[ions].");
      return;
    }

    const newExercise = {
      id: `custom_${Date.now()}`,
      title,
      category,
      level: 'Custom Practice',
      rawText
    };

    saveCustomExercise(newExercise);
    this.exercises.push(newExercise);
    this.populateExerciseDropdown();
    this.loadExercise(this.exercises.length - 1);
    this.closeManageModal();
    this.showToast(`¡"${title}" guardado y cargado con éxito!`);
  }

  renderCustomExercisesList() {
    this.customExercisesList.innerHTML = '';
    
    // Custom reading exercises
    const customReading = this.exercises.filter(ex => ex.id.startsWith('custom_') || ex.id.startsWith('ctest-') || ex.isAiGenerated);

    // Custom writing exercises
    let customWriting = [];
    try {
      const saved = localStorage.getItem("toefl_writing_custom_exercises");
      if (saved) customWriting = JSON.parse(saved);
    } catch(e) {}

    const totalCustom = customReading.length + customWriting.length;

    if (totalCustom === 0) {
      this.customExercisesList.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">No hay ejercicios personalizados o generados con IA aún.</p>';
      return;
    }

    // Render reading exercises
    customReading.forEach(ex => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '0.5rem 0.75rem';
      item.style.background = 'var(--bg-main)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.style.border = '1px solid var(--border-subtle)';

      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <span class="badge-tag" style="font-size:0.7rem; padding:0.1rem 0.35rem;">📖 Reading</span>
          ${ex.isAiGenerated ? '<span class="badge-ai">✨ IA</span>' : ''}
          <span style="font-weight:600; font-size:0.88rem;">${ex.title}</span>
        </div>
        <button class="btn btn-secondary btn-sm" style="color:var(--danger); flex-shrink:0;" data-del-id="${ex.id}">Eliminar</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        if (confirm(`¿Eliminar ejercicio de lectura "${ex.title}"?`)) {
          deleteCustomExercise(ex.id);
          this.exercises = this.exercises.filter(e => e.id !== ex.id);
          this.populateExerciseDropdown();
          this.renderCustomExercisesList();
          this.showToast('Ejercicio de lectura eliminado');
        }
      });

      this.customExercisesList.appendChild(item);
    });

    // Render writing exercises
    customWriting.forEach(ex => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '0.5rem 0.75rem';
      item.style.background = 'var(--bg-main)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.style.border = '1px solid var(--border-subtle)';

      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <span class="badge-tag" style="font-size:0.7rem; padding:0.1rem 0.35rem; background:rgba(79, 70, 229, 0.1); color:var(--accent);">✍️ Writing</span>
          ${ex.isAiGenerated ? '<span class="badge-ai">✨ IA</span>' : ''}
          <span style="font-weight:600; font-size:0.88rem;">${ex.title}</span>
        </div>
        <button class="btn btn-secondary btn-sm" style="color:var(--danger); flex-shrink:0;" data-del-id="${ex.id}">Eliminar</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        if (confirm(`¿Eliminar ejercicio de writing "${ex.title}"?`)) {
          deleteCustomWritingExercise(ex.id);
          if (this.writingController) {
            this.writingController.exercises = this.writingController.exercises.filter(e => e.id !== ex.id);
            this.writingController.populateDropdown();
          }
          this.renderCustomExercisesList();
          this.showToast('Ejercicio de writing eliminado');
        }
      });

      this.customExercisesList.appendChild(item);
    });
  }

  exportExercisesJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.exercises, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "exercises.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("exercises.json descargado");
  }

  exportWritingExercisesJSON() {
    const list = this.writingController ? this.writingController.exercises : [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "writing_exercises.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("writing_exercises.json descargado");
  }

  // =========================================================================
  // Gemini AI Practice & Generation Methods
  // =========================================================================

  async checkAndRefreshGeminiStatus() {
    const hasLocal = await geminiAI.checkLocalBridge();
    const hasKey = !!geminiAI.getApiKey();
    const mode = geminiAI.getMode();

    const isReady = hasLocal || hasKey;

    if (this.geminiStatusDot) {
      this.geminiStatusDot.classList.toggle('active', isReady);
      this.geminiStatusDot.title = hasLocal
        ? "Gemini CLI local activo en Linux"
        : hasKey
          ? "Gemini API directa configurada"
          : "Configuración de Gemini requerida";
    }

    if (this.geminiCardDot && this.geminiStatusTitle && this.geminiStatusDesc) {
      if (hasLocal && (mode === 'auto' || mode === 'local')) {
        this.geminiCardDot.className = 'status-indicator-dot connected';
        this.geminiStatusTitle.textContent = "Conexión Activa: Gemini CLI Local (Linux)";
        this.geminiStatusDesc.textContent = "El servidor local está conectado con tu instalación de Gemini CLI (agy). Práctica infinita disponible sin API Key.";
      } else if (hasKey) {
        this.geminiCardDot.className = 'status-indicator-dot connected';
        this.geminiStatusTitle.textContent = "Conexión Activa: Gemini API Directa";
        this.geminiStatusDesc.textContent = `Conectado mediante tu API Key personal (${geminiAI.getModel()}). Funciona en cualquier dispositivo y hosting estático.`;
      } else {
        this.geminiCardDot.className = 'status-indicator-dot';
        this.geminiStatusTitle.textContent = "Gemini No Configurado Aún";
        this.geminiStatusDesc.textContent = "Ingresa tu API Key gratuita de Google AI Studio o inicia 'python3 server.py' para usar tu CLI local.";
      }
    }

    return { hasLocal, hasKey, isReady };
  }

  openGeminiSettings(notice = "") {
    if (!this.geminiSettingsModal) return;

    if (this.selectAiEngineMode) this.selectAiEngineMode.value = geminiAI.getMode();
    if (this.inputGeminiApiKey) this.inputGeminiApiKey.value = geminiAI.getApiKey();
    if (this.selectGeminiModel) this.selectGeminiModel.value = geminiAI.getModel();

    if (this.geminiTestFeedback) {
      if (notice) {
        this.geminiTestFeedback.style.display = 'block';
        this.geminiTestFeedback.style.background = 'var(--warning-bg)';
        this.geminiTestFeedback.style.border = '1px solid var(--warning)';
        this.geminiTestFeedback.style.color = '#92400e';
        this.geminiTestFeedback.textContent = notice;
      } else {
        this.geminiTestFeedback.style.display = 'none';
      }
    }

    this.checkAndRefreshGeminiStatus();
    this.geminiSettingsModal.classList.add('active');
  }

  closeGeminiSettings() {
    if (this.geminiSettingsModal) {
      this.geminiSettingsModal.classList.remove('active');
    }
  }

  toggleApiKeyVisibility() {
    if (!this.inputGeminiApiKey) return;
    const isPass = this.inputGeminiApiKey.type === 'password';
    this.inputGeminiApiKey.type = isPass ? 'text' : 'password';
    if (this.btnToggleApiKeyVisibility) {
      this.btnToggleApiKeyVisibility.textContent = isPass ? '🔒' : '👁️';
    }
  }

  async testGeminiConnection() {
    if (!this.geminiTestFeedback) return;
    const key = this.inputGeminiApiKey ? this.inputGeminiApiKey.value.trim() : "";
    const model = this.selectGeminiModel ? this.selectGeminiModel.value : "gemini-2.5-flash";
    const mode = this.selectAiEngineMode ? this.selectAiEngineMode.value : "auto";

    this.geminiTestFeedback.style.display = 'block';
    this.geminiTestFeedback.style.background = 'var(--bg-input)';
    this.geminiTestFeedback.style.border = '1px solid var(--border-subtle)';
    this.geminiTestFeedback.style.color = 'var(--text-main)';
    this.geminiTestFeedback.textContent = "⏳ Probando conexión con Gemini...";

    if (mode === 'local' || (mode === 'auto' && !key)) {
      const hasLocal = await geminiAI.checkLocalBridge();
      if (hasLocal) {
        this.geminiTestFeedback.style.background = 'var(--success-bg)';
        this.geminiTestFeedback.style.border = '1px solid var(--success-border)';
        this.geminiTestFeedback.style.color = '#065f46';
        this.geminiTestFeedback.textContent = "✅ ¡Conexión exitosa con el servidor local y Gemini CLI (agy)!";
        this.checkAndRefreshGeminiStatus();
        return;
      } else if (mode === 'local') {
        this.geminiTestFeedback.style.background = 'var(--danger-bg)';
        this.geminiTestFeedback.style.border = '1px solid var(--danger-border)';
        this.geminiTestFeedback.style.color = '#991b1b';
        this.geminiTestFeedback.textContent = "❌ No se detectó el servidor local. Ejecuta 'python3 server.py' en tu terminal.";
        return;
      }
    }

    if (!key) {
      this.geminiTestFeedback.style.background = 'var(--warning-bg)';
      this.geminiTestFeedback.style.border = '1px solid var(--warning)';
      this.geminiTestFeedback.style.color = '#92400e';
      this.geminiTestFeedback.textContent = "⚠️ Ingresa una API Key para probar la conexión directa.";
      return;
    }

    try {
      await geminiAI.testApiKey(key, model);
      this.geminiTestFeedback.style.background = 'var(--success-bg)';
      this.geminiTestFeedback.style.border = '1px solid var(--success-border)';
      this.geminiTestFeedback.style.color = '#065f46';
      this.geminiTestFeedback.textContent = `✅ ¡API Key válida! Conexión exitosa con el modelo ${model}.`;
      this.checkAndRefreshGeminiStatus();
    } catch (e) {
      this.geminiTestFeedback.style.background = 'var(--danger-bg)';
      this.geminiTestFeedback.style.border = '1px solid var(--danger-border)';
      this.geminiTestFeedback.style.color = '#991b1b';
      this.geminiTestFeedback.textContent = `❌ Error de conexión: ${e.message}`;
    }
  }

  saveGeminiSettings() {
    const mode = this.selectAiEngineMode ? this.selectAiEngineMode.value : "auto";
    const key = this.inputGeminiApiKey ? this.inputGeminiApiKey.value.trim() : "";
    const model = this.selectGeminiModel ? this.selectGeminiModel.value : "gemini-2.5-flash";

    geminiAI.setMode(mode);
    geminiAI.setApiKey(key);
    geminiAI.setModel(model);

    this.checkAndRefreshGeminiStatus();
    this.closeGeminiSettings();
    this.showToast("⚙️ Configuración de Gemini guardada");
  }

  showAiLoading(step = 1, text = "") {
    if (!this.aiLoadingOverlay) return;
    this.aiCancelRequested = false;
    this.aiLoadingOverlay.classList.add('active');

    if (this.aiLoadingStatusText && text) {
      this.aiLoadingStatusText.textContent = text;
    }

    [this.aiStep1, this.aiStep2, this.aiStep3].forEach((el, idx) => {
      if (!el) return;
      const stepNum = idx + 1;
      el.classList.remove('active', 'done');
      if (stepNum < step) el.classList.add('done');
      else if (stepNum === step) el.classList.add('active');
    });
  }

  hideAiLoading() {
    if (this.aiLoadingOverlay) {
      this.aiLoadingOverlay.classList.remove('active');
    }
  }

  cancelAiGeneration() {
    this.aiCancelRequested = true;
    this.hideAiLoading();
    this.showToast("Generación con IA cancelada");
  }

  /**
   * Main entrypoint: generates a fresh, non-repeating exercise with Gemini AI.
   */
  async triggerAiPractice(section = null, options = {}) {
    const targetSection = section || this.activeSection || 'reading';
    const count = options.count || (targetSection === 'reading' && this.selectReadingAiCount ? parseInt(this.selectReadingAiCount.value, 10) : 1);

    // Verify connection availability
    const mode = geminiAI.getMode();
    const apiKey = geminiAI.getApiKey();
    const hasLocal = await geminiAI.checkLocalBridge();

    if (mode === 'direct' && !apiKey) {
      this.openGeminiSettings("Ingresa tu API Key gratuita de Gemini para generar ejercicios en este dispositivo.");
      return;
    }
    if (mode === 'local' && !hasLocal) {
      this.openGeminiSettings("El servidor local con Gemini CLI no está activo. Ejecuta 'python3 server.py' o usa el modo API directa.");
      return;
    }
    if (mode === 'auto' && !hasLocal && !apiKey) {
      this.openGeminiSettings("Configura tu API Key gratuita de Gemini para generar ejercicios inéditos en este dispositivo.");
      return;
    }

    // Prepare anti-repetition lists
    let avoidTitles = [];
    let avoidIds = [];

    if (targetSection === 'reading') {
      avoidTitles = this.exercises.map(e => e.title).filter(Boolean);
      avoidIds = this.exercises.map(e => e.id).filter(Boolean);
    } else if (targetSection === 'writing' && this.writingController) {
      avoidTitles = this.writingController.exercises.map(e => e.title || e.promptQuestion).filter(Boolean);
      avoidIds = this.writingController.exercises.map(e => e.id).filter(Boolean);
    }

    const sectionLabel = targetSection === 'reading' ? 'Reading' : 'Writing';
    this.showAiLoading(1, count > 1 ? `Conectando con Gemini 3.8 Flash para generar ${count} ejercicios (${sectionLabel})...` : `Conectando con Gemini 3.8 Flash (${sectionLabel})...`);

    try {
      const stepTimer = setTimeout(() => {
        if (!this.aiCancelRequested) {
          this.showAiLoading(2, count > 1 ? `Redactando lote de ${count} ejercicios académicos inéditos...` : "Redactando ejercicio académico inédito...");
        }
      }, 800);

      const result = await geminiAI.generateExercise(targetSection, {
        count,
        avoidTitles,
        avoidIds,
        customTopic: options.customTopic || ""
      });

      clearTimeout(stepTimer);

      if (this.aiCancelRequested) return;

      this.showAiLoading(3, "Validando estructura oficial TOEFL...");

      const exercises = result.exercises || (result.exercise ? [result.exercise] : []);
      if (exercises.length === 0) throw new Error("No se devolvieron ejercicios de la IA.");

      if (targetSection === 'reading') {
        if (this.activeSection !== 'reading') {
          this.switchSection('reading');
        }
        exercises.forEach(ex => {
          saveCustomExercise(ex);
          const existsIdx = this.exercises.findIndex(e => e.id === ex.id);
          if (existsIdx >= 0) {
            this.exercises[existsIdx] = ex;
          } else {
            this.exercises.push(ex);
          }
        });

        this.populateExerciseDropdown();
        const firstNew = exercises[0];
        const newIdx = this.exercises.findIndex(e => e.id === firstNew.id);
        this.loadExercise(newIdx >= 0 ? newIdx : this.exercises.length - 1);
        sound.playSuccess();
        if (exercises.length > 1) {
          this.showToast(`✨ ¡${exercises.length} nuevos ejercicios de lectura generados con Gemini 3.8 Flash!`);
        } else {
          this.showToast(`✨ ¡Nuevo ejercicio de lectura generado! "${firstNew.title}"`);
        }
      } else if (targetSection === 'writing') {
        if (this.activeSection !== 'writing') {
          this.switchSection('writing');
        }
        if (this.writingController) {
          this.writingController.addCustomExerciseAndSelect(exercises);
        }
      }

      this.hideAiLoading();
      return exercises[0];
    } catch (err) {
      this.hideAiLoading();
      console.error("AI Generation error:", err);

      if (err.message === "NO_API_KEY") {
        this.openGeminiSettings("Configura tu API Key gratuita de Gemini para generar ejercicios.");
      } else {
        alert(`No se pudo generar el ejercicio con IA:\n${err.message}\n\nPuedes revisar o cambiar el modelo en el botón ⚙️ Gemini.`);
      }
    }
  }

  async generateFromManageModal() {
    const section = this.selectAiSection ? this.selectAiSection.value : "reading";
    const topic = this.inputAiTopic ? this.inputAiTopic.value.trim() : "";
    const count = this.selectAiCount ? parseInt(this.selectAiCount.value, 10) : 3;

    const exercise = await this.triggerAiPractice(section, { count, customTopic: topic });
    if (exercise) {
      this.closeManageModal();
    }
  }

  copyPromptHelper() {
    const prompt = `Actúa como un examinador oficial del TOEFL iBT®. Genera un ejercicio del tipo "Complete the Words" (C-Test) para la sección de Reading.
Instrucciones para el formato:
1. Párrafo académico de 70 a 100 palabras.
2. La PRIMERA oración debe quedar 100% intacta.
3. En el resto del texto, selecciona 10 palabras académicas clave.
4. Para cada una de esas 10 palabras, divide la palabra a la mitad: deja el prefijo visible y coloca la segunda mitad entre corchetes rectangulares [ ].
Ejemplo:
Coral reefs are among the most diverse ecosystems on Earth. Mill[ions] of tiny organisms called polyps build mas[sive] structures over thou[sands] of years. These colo[rful] formations provide she[lter] and food for coun[tless] marine species. Ris[ing] ocean temperatures and poll[ution] threaten their surv[ival] , causing widespread blea[ching] events that leave the reefs pale and lifeless.`;

    navigator.clipboard.writeText(prompt).then(() => {
      this.showToast('¡Prompt para la IA copiado al portapapeles!');
    }).catch(() => {
      this.showToast('Copia manual: revisa la documentación');
    });
  }

  showToast(msg) {
    this.toast.textContent = msg;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2800);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.toeflApp = new ToeflApp();
});

