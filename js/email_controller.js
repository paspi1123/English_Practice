/**
 * TOEFL iBT Writing: Write an Email Controller
 * Fully aligned with ETS Official Specifications & TOEFL 2026 Redesign
 */

import { loadEmailExercises, DEFAULT_EMAIL_EXERCISES, saveCustomEmailExercise } from './email_exercises.js?v=4.0';
import { sound } from './audio.js?v=3.0';
import { geminiAI } from './ai_generator.js?v=4.0';

export class EmailController {
  constructor(app) {
    this.app = app;
    this.exercises = [];
    this.currentIndex = 0;
    this.currentExercise = null;
    this.currentFilter = 'all';
    this.completedMap = this.loadCompletedMap();
    this.isSubmitted = false;

    // Timer (7 minutes countdown = 420 seconds)
    this.initialTime = 420;
    this.timerSeconds = 420;
    this.timerInterval = null;
    this.isTimerRunning = false;

    this.cacheDom();
  }

  cacheDom() {
    this.container = document.getElementById('emailSection');
    this.select = document.getElementById('emailExerciseSelect');
    this.filterSelect = document.getElementById('emailFilterSelect');
    this.btnCheckToggle = document.getElementById('emailBtnToggleCompleted');
    this.checkIcon = document.getElementById('emailCheckToggleIcon');
    this.checkText = document.getElementById('emailCheckToggleText');
    this.completedCounter = document.getElementById('emailCompletedCounter');
    this.categoryBadge = document.getElementById('emailCategoryBadge');

    // AI Generation in toolbar
    this.btnAiGenerate = document.getElementById('emailBtnAiGenerate');
    this.selectAiCount = document.getElementById('selectEmailAiCount');

    // Scenario elements
    this.recipientEl = document.getElementById('emailRecipient');
    this.recipientEmailEl = document.getElementById('emailRecipientAddress');
    this.subjectEl = document.getElementById('emailSubject');
    this.scenarioText = document.getElementById('emailScenarioText');
    this.bulletsContainer = document.getElementById('emailBulletsContainer');

    // Composer elements
    this.textarea = document.getElementById('emailComposerTextarea');
    this.wordCountBadge = document.getElementById('emailWordCountBadge');
    this.sentenceCountBadge = document.getElementById('emailSentenceCountBadge');
    this.timerDisplay = document.getElementById('emailTimerText');
    this.timerBox = document.getElementById('emailTimerBox');
    this.btnToggleTimer = document.getElementById('emailBtnToggleTimer');
    this.btnResetTimer = document.getElementById('emailBtnResetTimer');

    // Quick insertion chips
    this.btnInsertSalutation = document.getElementById('btnEmailInsertSalutation');
    this.btnInsertHedging = document.getElementById('btnEmailInsertHedging');
    this.btnInsertSignoff = document.getElementById('btnEmailInsertSignoff');

    // Sample Model Response
    this.btnToggleSample = document.getElementById('btnEmailToggleSample');
    this.sampleContainer = document.getElementById('emailSampleContainer');
    this.sampleText = document.getElementById('emailSampleText');
    this.sampleAuthor = document.getElementById('emailSampleAuthor');
    this.sampleRationale = document.getElementById('emailSampleRationale');

    // Actions
    this.btnClearDraft = document.getElementById('emailBtnClearDraft');
    this.btnSubmitAiGrade = document.getElementById('emailBtnSubmitAiGrade');
    this.btnNext = document.getElementById('emailBtnNext');

    // Score Modal for Email
    this.scoreModal = document.getElementById('emailScoreModal');
    this.btnCloseScoreModal = document.getElementById('btnCloseEmailScoreModal');
    this.modalOverallScore = document.getElementById('emailModalOverallScore');
    this.modalCefrBadge = document.getElementById('emailModalCefrBadge');
    this.modalWordCountStat = document.getElementById('emailModalWordCountStat');
    this.modalPurposefulScore = document.getElementById('emailScorePurposeful');
    this.modalPurposefulFeedback = document.getElementById('emailFeedbackPurposeful');
    this.modalToneScore = document.getElementById('emailScoreTone');
    this.modalToneFeedback = document.getElementById('emailFeedbackTone');
    this.modalAccuracyScore = document.getElementById('emailScoreAccuracy');
    this.modalAccuracyFeedback = document.getElementById('emailFeedbackAccuracy');
    this.modalMechanicsScore = document.getElementById('emailScoreMechanics');
    this.modalMechanicsFeedback = document.getElementById('emailFeedbackMechanics');
    this.modalBulletsList = document.getElementById('emailModalBulletsList');
    this.modalStrengthsList = document.getElementById('emailModalStrengthsList');
    this.modalImprovementsList = document.getElementById('emailModalImprovementsList');
    this.modalNotesList = document.getElementById('emailModalNotesList');
    this.modalModelRewrite = document.getElementById('emailModalModelRewrite');
    this.btnModalCopyRewrite = document.getElementById('btnEmailModalCopyRewrite');
    this.btnModalCloseBottom = document.getElementById('btnEmailModalCloseBottom');
    this.btnModalNextExercise = document.getElementById('btnEmailModalNextExercise');
  }

  loadCompletedMap() {
    try {
      const saved = localStorage.getItem('toefl_email_completed_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  saveCompletedMap() {
    try {
      localStorage.setItem('toefl_email_completed_v1', JSON.stringify(this.completedMap));
    } catch (e) {}
  }

  isCompleted(id) {
    return !!(this.completedMap && this.completedMap[id]?.completed);
  }

  async init() {
    this.exercises = await loadEmailExercises();
    if (!this.exercises || this.exercises.length === 0) {
      this.exercises = [...DEFAULT_EMAIL_EXERCISES];
    }

    this.populateDropdown();
    this.bindEvents();
    this.loadExercise(0);
  }

  populateDropdown() {
    if (!this.select) return;
    this.select.innerHTML = '';

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
      if (filter === 'asno') {
        return item.ex.source === 'asno' || (item.ex.id && item.ex.id.startsWith('toefl-2026-email-q'));
      }
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

    // Render Scenario details
    if (this.categoryBadge) this.categoryBadge.textContent = this.currentExercise.category || 'Write an Email';
    if (this.recipientEl) this.recipientEl.textContent = this.currentExercise.recipient || 'Recipient';
    if (this.recipientEmailEl) this.recipientEmailEl.textContent = this.currentExercise.recipientEmail || 'contact@institution.edu';
    if (this.subjectEl) this.subjectEl.textContent = this.currentExercise.subject || 'Inquiry';
    if (this.scenarioText) this.scenarioText.textContent = this.currentExercise.scenario || '';

    // Render 3 Bullet Points
    if (this.bulletsContainer) {
      this.bulletsContainer.innerHTML = '';
      (this.currentExercise.bulletPoints || []).forEach((bullet, bIdx) => {
        const item = document.createElement('li');
        item.className = 'email-bullet-item';
        item.innerHTML = `
          <span class="bullet-number">${bIdx + 1}</span>
          <span class="bullet-text">${bullet}</span>
        `;
        this.bulletsContainer.appendChild(item);
      });
    }

    // Populate Sample Response info
    if (this.sampleContainer) this.sampleContainer.style.display = 'none';
    if (this.sampleText) this.sampleText.textContent = this.currentExercise.sampleHighScoringResponse || '';
    if (this.sampleAuthor) this.sampleAuthor.textContent = this.currentExercise.sampleAuthor || 'ETS Official Model';
    if (this.sampleRationale) this.sampleRationale.textContent = this.currentExercise.scoringRationale || '';
    if (this.btnToggleSample) this.btnToggleSample.querySelector('span:last-child').textContent = 'Ver Modelo 5.0 (ETS)';

    // Load Draft
    const savedDraft = this.loadDraft(this.currentExercise.id);
    if (this.textarea) {
      this.textarea.value = savedDraft || '';
    }
    this.updateStats();

    // Reset 7-minute Timer
    this.resetTimer();
    this.updateCheckButton();
  }

  saveDraft(id, text) {
    try {
      localStorage.setItem(`toefl_email_draft_${id}`, text);
    } catch (e) {}
  }

  loadDraft(id) {
    try {
      return localStorage.getItem(`toefl_email_draft_${id}`) || '';
    } catch (e) {
      return '';
    }
  }

  updateStats() {
    if (!this.textarea) return;
    const text = this.textarea.value.trim();
    const words = text.length === 0 ? 0 : text.split(/\s+/).filter(Boolean).length;
    const sentences = text.length === 0 ? 0 : (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length;

    if (this.wordCountBadge) {
      this.wordCountBadge.textContent = `${words} palabras`;
      this.wordCountBadge.className = 'email-stat-badge';
      if (words >= 100 && words <= 140) {
        this.wordCountBadge.classList.add('stat-optimal');
      } else if (words > 140) {
        this.wordCountBadge.classList.add('stat-good');
      } else if (words > 60) {
        this.wordCountBadge.classList.add('stat-warning');
      } else if (words > 0) {
        this.wordCountBadge.classList.add('stat-danger');
      }
    }

    if (this.sentenceCountBadge) {
      this.sentenceCountBadge.textContent = `${sentences} oraciones`;
    }
  }

  // Timer Methods (7 minutes = 420s)
  resetTimer() {
    this.stopTimer();
    this.timerSeconds = this.initialTime;
    this.updateTimerDisplay();
  }

  startTimer() {
    if (this.isTimerRunning) return;
    this.isTimerRunning = true;
    if (this.btnToggleTimer) {
      this.btnToggleTimer.innerHTML = '⏸️ Pausar';
      this.btnToggleTimer.classList.add('btn-timer-active');
    }
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        this.updateTimerDisplay();
      } else {
        this.stopTimer();
        sound.playComplete();
        this.app.showToast('⏱️ ¡Tiempo de 7 minutos concluido! Procede a calificar tu correo con la IA.');
      }
    }, 1000);
  }

  stopTimer() {
    this.isTimerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.btnToggleTimer) {
      this.btnToggleTimer.innerHTML = '▶️ Iniciar 7:00';
      this.btnToggleTimer.classList.remove('btn-timer-active');
    }
  }

  toggleTimer() {
    if (this.isTimerRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  updateTimerDisplay() {
    if (!this.timerDisplay) return;
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (this.timerBox) {
      this.timerBox.classList.toggle('timer-urgent', this.timerSeconds <= 60 && this.timerSeconds > 0);
    }
  }

  // Quick insertion helpers
  insertTextAtCursor(snippet) {
    if (!this.textarea) return;
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const current = this.textarea.value;
    this.textarea.value = current.substring(0, start) + snippet + current.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + snippet.length;
    this.textarea.focus();
    this.updateStats();
    if (this.currentExercise) {
      this.saveDraft(this.currentExercise.id, this.textarea.value);
    }
  }

  insertSalutation() {
    const rawRecipient = this.currentExercise?.recipient || 'Manager';
    let salutation = `Dear ${rawRecipient},\n\n`;
    if (rawRecipient.includes('(')) {
      salutation = `Hi ${rawRecipient.split(' ')[0]},\n\n`;
    }
    this.insertTextAtCursor(salutation);
  }

  insertHedgingPhrase() {
    const options = [
      'Would it be possible to ',
      'Could you possibly let me know if ',
      'I would greatly appreciate it if you could ',
      'Could you please clarify whether '
    ];
    const picked = options[Math.floor(Math.random() * options.length)];
    this.insertTextAtCursor(picked);
  }

  insertSignoff() {
    const isPeer = this.currentExercise?.recipient?.includes('(') || this.currentExercise?.category?.includes('Peer');
    const signoff = isPeer ? '\n\nBest regards,\n[Your Name]' : '\n\nSincerely,\n[Your Name]';
    this.insertTextAtCursor(signoff);
  }

  toggleSampleModel() {
    if (!this.sampleContainer) return;
    const isHidden = this.sampleContainer.style.display === 'none' || !this.sampleContainer.style.display;
    this.sampleContainer.style.display = isHidden ? 'block' : 'none';
    if (this.btnToggleSample) {
      this.btnToggleSample.querySelector('span:last-child').textContent = isHidden ? 'Ocultar Modelo 5.0' : 'Ver Modelo 5.0 (ETS)';
    }
  }

  clearCurrentDraft() {
    if (!confirm('¿Deseas borrar el borrador actual de este correo?')) return;
    if (this.textarea) this.textarea.value = '';
    if (this.currentExercise) this.saveDraft(this.currentExercise.id, '');
    this.updateStats();
    this.app.showToast('Borrador restablecido.');
  }

  // Toggle completed status
  toggleCompleted() {
    if (!this.currentExercise) return;
    const id = this.currentExercise.id;
    const isComp = this.isCompleted(id);
    if (isComp) {
      delete this.completedMap[id];
      this.app.showToast(`"${this.currentExercise.title}" marcado como pendiente ⏳`);
    } else {
      this.completedMap[id] = { completed: true, timestamp: Date.now() };
      this.app.showToast(`"${this.currentExercise.title}" marcado como completado ✓`);
    }
    this.saveCompletedMap();
    this.updateCheckButton();
    this.populateDropdown();
  }

  updateCheckButton() {
    if (!this.currentExercise) return;
    const isComp = this.isCompleted(this.currentExercise.id);
    if (this.checkIcon) this.checkIcon.textContent = isComp ? '✓' : '○';
    if (this.checkText) this.checkText.textContent = isComp ? 'Hecho' : 'Marcar Hecho';
    if (this.btnCheckToggle) this.btnCheckToggle.classList.toggle('is-checked', isComp);
  }

  addCustomExerciseAndSelect(exercisesInput) {
    const list = Array.isArray(exercisesInput) ? exercisesInput : [exercisesInput];
    list.forEach(exercise => {
      saveCustomEmailExercise(exercise);
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
        this.app.showToast(`✨ ¡Se agregaron ${list.length} escenarios de Write an Email con éxito!`);
      } else {
        this.app.showToast(`✨ ¡Escenario de Email generado! "${firstNew.title}"`);
      }
    }
  }

  // AI Scoring with Official ETS Rubrics
  async submitForAiGrading() {
    if (!this.currentExercise) return;
    const studentEmail = (this.textarea?.value || '').trim();
    if (!studentEmail) {
      if (this.app?.showToast) {
        this.app.showToast('⚠️ Por favor escribe tu correo antes de solicitar la calificación.');
      } else {
        alert('Por favor escribe tu correo antes de calificar.');
      }
      this.textarea?.focus();
      return;
    }

    const words = studentEmail.split(/\s+/).filter(Boolean).length;
    if (words < 30) {
      if (!confirm(`Tu correo tiene solo ${words} palabras (el estándar TOEFL oficial es 100-140 palabras). ¿Deseas calificarlo de todas formas?`)) {
        return;
      }
    }

    this.stopTimer();

    // Visual button state
    const originalBtnContent = this.btnSubmitAiGrade ? this.btnSubmitAiGrade.innerHTML : '';
    if (this.btnSubmitAiGrade) {
      this.btnSubmitAiGrade.disabled = true;
      this.btnSubmitAiGrade.innerHTML = `
        <span style="display:inline-block; width:14px; height:14px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation: cosmicRotate 0.8s linear infinite; vertical-align:middle; margin-right:6px;"></span>
        <span>Evaluando con IA...</span>
      `;
    }

    // Show app loading overlay
    if (this.app && typeof this.app.showAiLoading === 'function') {
      this.app.showAiLoading(
        'Evaluando tu correo con la Rúbrica Oficial ETS (0.0 a 5.0 Band)...',
        'Analizando cumplimiento de las 3 viñetas requeridas...',
        'Evaluando registro, tono, cortesía y gramática...',
        'Generando modelo pulido 5.0 con explicaciones...'
      );
    } else if (this.app?.aiLoadingOverlay) {
      this.app.aiLoadingOverlay.classList.add('active');
    }

    try {
      const result = await geminiAI.gradeEmail({
        scenario: this.currentExercise.scenario,
        bulletPoints: this.currentExercise.bulletPoints,
        recipient: this.currentExercise.recipient,
        subject: this.currentExercise.subject,
        studentEmail: studentEmail
      });

      if (this.app && typeof this.app.hideAiLoading === 'function') {
        this.app.hideAiLoading();
      } else if (this.app?.aiLoadingOverlay) {
        this.app.aiLoadingOverlay.classList.remove('active');
      }

      this.displayEvaluationModal(result.evaluation);

      // Auto mark completed if score is >= 3.5
      if (result.evaluation.overallScore >= 3.5 && !this.isCompleted(this.currentExercise.id)) {
        this.completedMap[this.currentExercise.id] = { completed: true, timestamp: Date.now() };
        this.saveCompletedMap();
        this.updateCheckButton();
        this.populateDropdown();
      }

      sound.playSuccess();
      if (this.app?.showToast) {
        this.app.showToast('✨ ¡Evaluación oficial ETS completada con éxito!');
      }
    } catch (err) {
      if (this.app && typeof this.app.hideAiLoading === 'function') {
        this.app.hideAiLoading();
      } else if (this.app?.aiLoadingOverlay) {
        this.app.aiLoadingOverlay.classList.remove('active');
      }
      console.error('Error al calificar email:', err);
      alert(`No se pudo calificar el correo con IA: ${err.message}`);
    } finally {
      if (this.btnSubmitAiGrade) {
        this.btnSubmitAiGrade.disabled = false;
        this.btnSubmitAiGrade.innerHTML = originalBtnContent;
      }
    }
  }

  displayEvaluationModal(evaluation) {
    if (!this.scoreModal) return;

    // Overall Score & CEFR
    const score = Number(evaluation.overallScore || 0).toFixed(1);
    if (this.modalOverallScore) this.modalOverallScore.textContent = score;
    if (this.modalCefrBadge) this.modalCefrBadge.textContent = evaluation.cefrBand || 'B2 (Intermediate)';
    if (this.modalWordCountStat) {
      this.modalWordCountStat.textContent = `${evaluation.wordCount || 0} palabras (${evaluation.wordCountStatus || 'adecuado'})`;
    }

    // 4 Rubric Scores & Feedback
    const rubrics = evaluation.rubricScores || {};
    if (this.modalPurposefulScore) this.modalPurposefulScore.textContent = `${rubrics.purposefulCommunication?.score || score} / 5.0`;
    if (this.modalPurposefulFeedback) this.modalPurposefulFeedback.textContent = rubrics.purposefulCommunication?.feedback || '';

    if (this.modalToneScore) this.modalToneScore.textContent = `${rubrics.socialConventionsTone?.score || score} / 5.0`;
    if (this.modalToneFeedback) this.modalToneFeedback.textContent = rubrics.socialConventionsTone?.feedback || '';

    if (this.modalAccuracyScore) this.modalAccuracyScore.textContent = `${rubrics.languageAccuracy?.score || score} / 5.0`;
    if (this.modalAccuracyFeedback) this.modalAccuracyFeedback.textContent = rubrics.languageAccuracy?.feedback || '';

    if (this.modalMechanicsScore) this.modalMechanicsScore.textContent = `${rubrics.mechanicsOrganization?.score || score} / 5.0`;
    if (this.modalMechanicsFeedback) this.modalMechanicsFeedback.textContent = rubrics.mechanicsOrganization?.feedback || '';

    // Bullet Checks Checklist
    if (this.modalBulletsList) {
      this.modalBulletsList.innerHTML = '';
      (evaluation.bulletChecks || []).forEach(bc => {
        const li = document.createElement('li');
        const icon = bc.status === 'addressed' ? '✓' : bc.status === 'partial' ? '⚠️' : '✕';
        const statusClass = bc.status === 'addressed' ? 'bullet-addressed' : bc.status === 'partial' ? 'bullet-partial' : 'bullet-missing';
        li.className = `bullet-eval-item ${statusClass}`;
        li.innerHTML = `
          <span class="bullet-eval-icon">${icon}</span>
          <div class="bullet-eval-content">
            <strong class="bullet-eval-title">${bc.bullet}</strong>
            <p class="bullet-eval-note">${bc.note}</p>
          </div>
        `;
        this.modalBulletsList.appendChild(li);
      });
    }

    // Strengths
    if (this.modalStrengthsList) {
      this.modalStrengthsList.innerHTML = '';
      (evaluation.strengths || []).forEach(str => {
        const li = document.createElement('li');
        li.textContent = str;
        this.modalStrengthsList.appendChild(li);
      });
    }

    // Areas for Improvement
    if (this.modalImprovementsList) {
      this.modalImprovementsList.innerHTML = '';
      (evaluation.areasForImprovement || []).forEach(imp => {
        const li = document.createElement('li');
        li.textContent = imp;
        this.modalImprovementsList.appendChild(li);
      });
    }

    // Grammar & Style Notes
    if (this.modalNotesList) {
      this.modalNotesList.innerHTML = '';
      (evaluation.grammarAndStyleNotes || []).forEach(note => {
        const li = document.createElement('li');
        li.textContent = note;
        this.modalNotesList.appendChild(li);
      });
    }

    // Model Rewrite
    if (this.modalModelRewrite) {
      this.modalModelRewrite.textContent = evaluation.modelRewrite || this.currentExercise.sampleHighScoringResponse || '';
    }

    // Display modal with .active class for smooth pop animation
    this.scoreModal.classList.add('active');
  }

  closeScoreModal() {
    if (this.scoreModal) {
      this.scoreModal.classList.remove('active');
    }
  }

  copyModelRewrite() {
    if (!this.modalModelRewrite) return;
    navigator.clipboard.writeText(this.modalModelRewrite.textContent).then(() => {
      this.app.showToast('📋 ¡Versión modelo copiada al portapapeles!');
    });
  }

  nextExercise() {
    let nextIdx = this.currentIndex + 1;
    if (nextIdx >= this.exercises.length) nextIdx = 0;
    this.loadExercise(nextIdx);
  }

  bindEvents() {
    // Select change
    if (this.select) {
      this.select.addEventListener('change', (e) => {
        this.loadExercise(parseInt(e.target.value, 10));
      });
    }

    // Filter change
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.populateDropdown();
      });
    }

    // Mark completed toggle
    if (this.btnCheckToggle) {
      this.btnCheckToggle.addEventListener('click', () => this.toggleCompleted());
    }

    // Textarea input
    if (this.textarea) {
      this.textarea.addEventListener('input', () => {
        this.updateStats();
        if (this.currentExercise) {
          this.saveDraft(this.currentExercise.id, this.textarea.value);
        }
      });
    }

    // Quick insertion chips
    if (this.btnInsertSalutation) this.btnInsertSalutation.addEventListener('click', () => this.insertSalutation());
    if (this.btnInsertHedging) this.btnInsertHedging.addEventListener('click', () => this.insertHedgingPhrase());
    if (this.btnInsertSignoff) this.btnInsertSignoff.addEventListener('click', () => this.insertSignoff());

    // Timer controls
    if (this.btnToggleTimer) this.btnToggleTimer.addEventListener('click', () => this.toggleTimer());
    if (this.btnResetTimer) this.btnResetTimer.addEventListener('click', () => this.resetTimer());

    // Sample Response toggle
    if (this.btnToggleSample) this.btnToggleSample.addEventListener('click', () => this.toggleSampleModel());

    // Actions
    if (this.btnClearDraft) this.btnClearDraft.addEventListener('click', () => this.clearCurrentDraft());
    if (this.btnSubmitAiGrade) this.btnSubmitAiGrade.addEventListener('click', () => this.submitForAiGrading());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextExercise());

    // AI Generate in toolbar
    if (this.btnAiGenerate) {
      this.btnAiGenerate.addEventListener('click', () => {
        const count = parseInt(this.selectAiCount?.value || '1', 10);
        this.app.triggerAiPractice('email', count);
      });
    }

    // Modal events
    if (this.scoreModal) {
      this.scoreModal.addEventListener('click', (e) => {
        if (e.target === this.scoreModal) this.closeScoreModal();
      });
    }
    if (this.btnCloseScoreModal) this.btnCloseScoreModal.addEventListener('click', () => this.closeScoreModal());
    if (this.btnModalCloseBottom) this.btnModalCloseBottom.addEventListener('click', () => this.closeScoreModal());
    if (this.btnModalCopyRewrite) this.btnModalCopyRewrite.addEventListener('click', () => this.copyModelRewrite());
    if (this.btnModalNextExercise) {
      this.btnModalNextExercise.addEventListener('click', () => {
        this.closeScoreModal();
        this.nextExercise();
      });
    }
  }
}
