/**
 * TOEFL iBT Writing: Build a Sentence Controller
 */

import { loadWritingExercises, DEFAULT_WRITING_EXERCISES, saveCustomWritingExercise } from './writing_exercises.js?v=4.0';
import { sound } from './audio.js?v=3.0';

export class WritingController {
  constructor(app) {
    this.app = app;
    this.exercises = [];
    this.currentIndex = 0;
    this.currentExercise = null;
    this.slots = []; // Array of token strings placed in each slot
    this.currentFilter = 'all';
    this.completedMap = this.loadCompletedMap();
    this.isSubmitted = false;

    this.cacheDom();
  }

  cacheDom() {
    this.container = document.getElementById('writingSection');
    this.select = document.getElementById('writingExerciseSelect');
    this.filterSelect = document.getElementById('writingFilterSelect');
    this.btnCheckToggle = document.getElementById('writingBtnToggleCompleted');
    this.checkIcon = document.getElementById('writingCheckToggleIcon');
    this.checkText = document.getElementById('writingCheckToggleText');
    this.completedCounter = document.getElementById('writingCompletedCounter');
    this.categoryBadge = document.getElementById('writingCategoryBadge');
    this.btnAiGenerate = document.getElementById('writingBtnAiGenerate');
    this.selectWritingAiCount = document.getElementById('selectWritingAiCount');

    this.promptText = document.getElementById('writingPromptText');
    this.sentencePrefix = document.getElementById('writingSentencePrefix');
    this.sentenceSuffix = document.getElementById('writingSentenceSuffix');
    this.slotsContainer = document.getElementById('writingSlotsContainer');
    this.tokensPool = document.getElementById('writingTokensPool');
    this.feedbackBanner = document.getElementById('writingFeedbackBanner');

    this.btnReset = document.getElementById('writingBtnReset');
    this.btnHint = document.getElementById('writingBtnHint');
    this.btnSubmit = document.getElementById('writingBtnSubmit');
    this.btnNext = document.getElementById('writingBtnNext');
  }

  addCustomExerciseAndSelect(exercisesInput) {
    const list = Array.isArray(exercisesInput) ? exercisesInput : [exercisesInput];
    list.forEach(exercise => {
      saveCustomWritingExercise(exercise);
      const existsIdx = this.exercises.findIndex(e => e.id === exercise.id);
      if (existsIdx >= 0) {
        this.exercises[existsIdx] = exercise;
      } else {
        this.exercises.push(exercise);
      }
    });
    this.populateDropdown();
    const firstNew = list[0];
    const targetIdx = this.exercises.findIndex(e => e.id === firstNew.id);
    this.loadExercise(targetIdx >= 0 ? targetIdx : this.exercises.length - 1);
    sound.playSuccess();
    if (this.app && this.app.showToast) {
      if (list.length > 1) {
        this.app.showToast(`✨ ¡Se agregaron ${list.length} ejercicios de Writing con éxito!`);
      } else {
        this.app.showToast(`✨ ¡Ejercicio de Writing generado! "${firstNew.title}"`);
      }
    }
  }

  loadCompletedMap() {
    try {
      const saved = localStorage.getItem('toefl_writing_completed_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  saveCompletedMap() {
    try {
      localStorage.setItem('toefl_writing_completed_v1', JSON.stringify(this.completedMap));
    } catch (e) {}
  }

  isCompleted(id) {
    return !!(this.completedMap && this.completedMap[id]?.completed);
  }

  async init() {
    this.exercises = await loadWritingExercises();
    if (!this.exercises || this.exercises.length === 0) {
      this.exercises = [...DEFAULT_WRITING_EXERCISES];
    }

    this.populateDropdown();
    this.bindEvents();
    this.loadExercise(0);
  }

  populateDropdown() {
    if (!this.select) return;
    this.select.innerHTML = '';

    // Count completed
    let completedCount = 0;
    this.exercises.forEach(ex => {
      if (this.isCompleted(ex.id)) completedCount++;
    });
    if (this.completedCounter) {
      this.completedCounter.textContent = `${completedCount} / ${this.exercises.length}`;
    }

    const filter = this.currentFilter || 'all';
    const filtered = this.exercises.map((ex, idx) => ({ ex, originalIndex: idx })).filter(item => {
      const isComp = this.isCompleted(item.ex.id);
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
      this.select.appendChild(opt);
      return;
    }

    filtered.forEach(item => {
      const isComp = this.isCompleted(item.ex.id);
      const opt = document.createElement('option');
      opt.value = item.originalIndex;
      const statusIcon = isComp ? '✓' : '○';
      opt.textContent = `${statusIcon} ${item.originalIndex + 1}. ${item.ex.title}`;
      if (item.originalIndex === this.currentIndex) {
        opt.selected = true;
      }
      this.select.appendChild(opt);
    });

    const currentInFiltered = filtered.some(f => f.originalIndex === this.currentIndex);
    if (!currentInFiltered && filtered.length > 0) {
      this.loadExercise(filtered[0].originalIndex);
    }
  }

  loadExercise(index) {
    if (index < 0 || index >= this.exercises.length) return;
    this.currentIndex = index;
    if (this.select) this.select.value = index;

    this.currentExercise = this.exercises[index];
    this.isSubmitted = false;

    const numSlots = this.currentExercise.solution.length;
    this.slots = new Array(numSlots).fill(null);

    if (this.categoryBadge) this.categoryBadge.textContent = this.currentExercise.category || 'Writing';
    if (this.promptText) this.promptText.textContent = this.currentExercise.promptQuestion;
    if (this.sentencePrefix) this.sentencePrefix.textContent = this.currentExercise.sentencePrefix || '';
    if (this.sentenceSuffix) this.sentenceSuffix.textContent = this.currentExercise.sentenceSuffix || '.';

    if (this.feedbackBanner) {
      this.feedbackBanner.style.display = 'none';
      this.feedbackBanner.className = 'writing-explanation-banner';
      this.feedbackBanner.innerHTML = '';
    }

    this.renderSlots();
    this.renderTokensPool();
    this.updateCheckButton();
  }

  renderSlots() {
    if (!this.slotsContainer) return;
    this.slotsContainer.innerHTML = '';

    this.slots.forEach((token, slotIndex) => {
      const slotEl = document.createElement('div');
      slotEl.className = `sentence-slot ${token ? 'slot-filled' : ''}`;
      slotEl.dataset.slotIndex = slotIndex;

      // Allow drag & drop target
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        slotEl.style.borderBottomColor = 'var(--primary)';
      });
      slotEl.addEventListener('dragleave', () => {
        if (!token) slotEl.style.borderBottomColor = '';
      });
      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const droppedToken = e.dataTransfer.getData('text/plain');
        if (droppedToken) {
          this.placeTokenInSlot(droppedToken, slotIndex);
        }
      });

      if (token) {
        const chip = document.createElement('div');
        chip.className = 'placed-token';
        chip.draggable = true;
        chip.innerHTML = `<span>${token}</span><span class="remove-btn" title="Quitar">✕</span>`;

        // Click to remove
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeTokenFromSlot(slotIndex);
        });

        // Drag to another slot
        chip.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', token);
          e.dataTransfer.setData('fromSlot', slotIndex);
        });

        slotEl.appendChild(chip);
      } else {
        // Empty slot click to paste next or focus
        slotEl.addEventListener('click', () => {
          const firstAvailable = this.getFirstUnusedToken();
          if (firstAvailable) {
            this.placeTokenInSlot(firstAvailable, slotIndex);
          }
        });
      }

      this.slotsContainer.appendChild(slotEl);
    });
  }

  renderTokensPool() {
    if (!this.tokensPool) return;
    this.tokensPool.innerHTML = '';

    const usedCounts = {};
    this.slots.forEach(t => {
      if (t) usedCounts[t] = (usedCounts[t] || 0) + 1;
    });

    const activeCounts = {};

    this.currentExercise.tokens.forEach((tok, idx) => {
      const isUsed = (activeCounts[tok] || 0) < (usedCounts[tok] || 0);
      if (isUsed) {
        activeCounts[tok] = (activeCounts[tok] || 0) + 1;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pool-token-btn ${isUsed ? 'is-used' : ''}`;
      btn.textContent = tok;
      btn.draggable = !isUsed;

      if (!isUsed) {
        btn.addEventListener('click', () => {
          this.placeTokenInFirstEmptySlot(tok);
        });

        btn.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', tok);
        });
      }

      this.tokensPool.appendChild(btn);

      // Separator slash between tokens (matching screenshot)
      if (idx < this.currentExercise.tokens.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'token-separator';
        sep.textContent = '/';
        this.tokensPool.appendChild(sep);
      }
    });
  }

  getFirstUnusedToken() {
    const usedCounts = {};
    this.slots.forEach(t => {
      if (t) usedCounts[t] = (usedCounts[t] || 0) + 1;
    });

    for (let tok of this.currentExercise.tokens) {
      if (!usedCounts[tok] || usedCounts[tok] <= 0) {
        return tok;
      }
      usedCounts[tok]--;
    }
    return null;
  }

  placeTokenInFirstEmptySlot(token) {
    const emptyIdx = this.slots.findIndex(s => s === null);
    if (emptyIdx !== -1) {
      this.placeTokenInSlot(token, emptyIdx);
    } else {
      this.app.showToast('Todos los espacios están llenos. Haz clic en una palabra para quitarla.');
    }
  }

  placeTokenInSlot(token, slotIndex) {
    sound.playKey();

    // Check if token was moved from another slot
    const existingSlot = this.slots.indexOf(token);
    if (existingSlot !== -1 && existingSlot !== slotIndex) {
      this.slots[existingSlot] = null;
    }

    this.slots[slotIndex] = token;
    this.renderSlots();
    this.renderTokensPool();

    // If all slots are filled, play gentle chime
    if (this.slots.every(s => s !== null)) {
      sound.playWordComplete();
    }
  }

  removeTokenFromSlot(slotIndex) {
    sound.playKey();
    this.slots[slotIndex] = null;
    this.renderSlots();
    this.renderTokensPool();
  }

  resetCurrent() {
    this.slots = new Array(this.currentExercise.solution.length).fill(null);
    this.isSubmitted = false;
    if (this.feedbackBanner) {
      this.feedbackBanner.style.display = 'none';
      this.feedbackBanner.className = 'writing-explanation-banner';
    }
    this.renderSlots();
    this.renderTokensPool();
    this.app.showToast('Oración reiniciada');
  }

  giveHint() {
    const solution = this.currentExercise.solution;
    const firstWrongOrEmpty = this.slots.findIndex((s, i) => s !== solution[i]);
    if (firstWrongOrEmpty !== -1) {
      const correctToken = solution[firstWrongOrEmpty];
      this.placeTokenInSlot(correctToken, firstWrongOrEmpty);
      this.app.showToast(`Pista colocada: "${correctToken}"`);
    } else {
      this.app.showToast('¡La oración ya está completa y correcta!');
    }
  }

  submitSentence() {
    this.isSubmitted = true;
    const solution = this.currentExercise.solution;
    const slotElements = this.slotsContainer.querySelectorAll('.sentence-slot');

    let allCorrect = true;

    this.slots.forEach((token, idx) => {
      const slotEl = slotElements[idx];
      const isCorrect = token === solution[idx];

      if (slotEl) {
        slotEl.classList.remove('slot-correct', 'slot-incorrect');
        slotEl.classList.add(isCorrect ? 'slot-correct' : 'slot-incorrect');
      }

      if (!isCorrect) allCorrect = false;
    });

    if (allCorrect) {
      sound.playSuccess();
      this.completedMap[this.currentExercise.id] = { completed: true, timestamp: Date.now() };
      this.saveCompletedMap();
      this.updateCheckButton();
      this.populateDropdown();

      this.feedbackBanner.className = 'writing-explanation-banner banner-success';
      this.feedbackBanner.innerHTML = `
        <strong>🎉 ¡Excelente! Oración perfectamente construida:</strong><br>
        <em>"${this.currentExercise.sentencePrefix} ${solution.join(' ')} ${this.currentExercise.sentenceSuffix}"</em><br>
        <span style="font-size:0.85rem; opacity:0.9; margin-top:4px; display:inline-block;">${this.currentExercise.explanation || ''}</span>
      `;
    } else {
      sound.playWordComplete();
      this.feedbackBanner.className = 'writing-explanation-banner banner-error';
      this.feedbackBanner.innerHTML = `
        <strong>⚠️ Hay palabras en el orden incorrecto o palabras distractoras:</strong><br>
        Revisa los bloques marcados en rojo. <em>Pista:</em> Una de las palabras disponibles es un distractor que no debe usarse.<br>
        <button class="btn btn-secondary btn-sm" id="btnRevealWritingSolution" style="margin-top:0.5rem;">Revelar Solución</button>
      `;

      const btnReveal = document.getElementById('btnRevealWritingSolution');
      if (btnReveal) {
        btnReveal.addEventListener('click', () => {
          this.slots = [...solution];
          this.renderSlots();
          this.renderTokensPool();
          this.submitSentence();
        });
      }
    }

    this.feedbackBanner.style.display = 'block';
  }

  toggleCompleted() {
    if (!this.currentExercise) return;
    const isComp = this.isCompleted(this.currentExercise.id);
    if (isComp) {
      delete this.completedMap[this.currentExercise.id];
      this.app.showToast(`"${this.currentExercise.title}" marcado como pendiente ⏳`);
    } else {
      this.completedMap[this.currentExercise.id] = { completed: true, timestamp: Date.now() };
      this.app.showToast(`"${this.currentExercise.title}" marcado como completado ✓`);
    }
    this.saveCompletedMap();
    this.updateCheckButton();
    this.populateDropdown();
  }

  updateCheckButton() {
    if (!this.currentExercise || !this.btnCheckToggle) return;
    const isComp = this.isCompleted(this.currentExercise.id);
    if (isComp) {
      this.btnCheckToggle.classList.add('is-completed');
      if (this.checkIcon) this.checkIcon.textContent = '✓';
      if (this.checkText) this.checkText.textContent = 'Completado';
    } else {
      this.btnCheckToggle.classList.remove('is-completed');
      if (this.checkIcon) this.checkIcon.textContent = '○';
      if (this.checkText) this.checkText.textContent = 'Marcar Hecho';
    }
  }

  nextExercise() {
    const nextIdx = (this.currentIndex + 1) % this.exercises.length;
    this.loadExercise(nextIdx);
  }

  bindEvents() {
    if (this.select) {
      this.select.addEventListener('change', (e) => {
        this.loadExercise(parseInt(e.target.value, 10));
      });
    }

    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.populateDropdown();
      });
    }

    if (this.btnCheckToggle) {
      this.btnCheckToggle.addEventListener('click', () => {
        this.toggleCompleted();
      });
    }

    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetCurrent());
    if (this.btnHint) this.btnHint.addEventListener('click', () => this.giveHint());
    if (this.btnSubmit) this.btnSubmit.addEventListener('click', () => this.submitSentence());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextExercise());
    if (this.btnAiGenerate) {
      this.btnAiGenerate.addEventListener('click', () => {
        if (this.app && this.app.triggerAiPractice) {
          const count = this.selectWritingAiCount ? parseInt(this.selectWritingAiCount.value, 10) : 1;
          this.app.triggerAiPractice('writing', { count });
        }
      });
    }
  }
}

