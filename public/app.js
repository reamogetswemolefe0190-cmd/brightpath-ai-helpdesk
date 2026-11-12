document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const qaForm = document.getElementById('qaForm');
  const questionInput = document.getElementById('questionInput');
  const submitBtn = document.getElementById('submitBtn');
  const simulateFailureToggle = document.getElementById('simulateFailureToggle');

  const responseContainer = document.getElementById('responseContainer');
  const responseStatusBadge = document.getElementById('responseStatusBadge');
  const responseEngineMode = document.getElementById('responseEngineMode');
  const responseContent = document.getElementById('responseContent');
  const sourcesSection = document.getElementById('sourcesSection');
  const sourcesList = document.getElementById('sourcesList');

  const errorContainer = document.getElementById('errorContainer');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const errorSuggestion = document.getElementById('errorSuggestion');
  const btnRetry = document.getElementById('btnRetry');

  const docsList = document.getElementById('docsList');
  const healthStatusText = document.getElementById('healthStatusText');

  const btnPreset1 = document.getElementById('btnPreset1');
  const btnPreset2 = document.getElementById('btnPreset2');
  const btnPreset3 = document.getElementById('btnPreset3');

  let lastQuestion = '';

  // 1. Initial Health Check
  fetch('/api/health')
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        healthStatusText.textContent = data.modelMode === 'online-api' ? 'Frontier LLM Active' : 'Grounded Mock Engine';
      }
    })
    .catch(() => {
      healthStatusText.textContent = 'Server Offline';
    });

  // 2. Load Knowledgebase Documents
  fetch('/api/docs')
    .then((r) => r.json())
    .then((data) => {
      if (data.ok && Array.isArray(data.docs)) {
        renderDocsAccordion(data.docs);
      }
    })
    .catch((err) => {
      console.error('Failed to load docs:', err);
    });

  function renderDocsAccordion(docs) {
    docsList.innerHTML = '';
    docs.forEach((doc, idx) => {
      const card = document.createElement('div');
      card.className = 'doc-card';
      card.id = `doc-card-${doc.id}`;

      // Show Document 1 open by default
      const isOpen = idx === 0;

      card.innerHTML = `
        <button type="button" class="doc-header-btn" data-doc-id="${doc.id}">
          <span>${doc.title}</span>
          <span class="chevron">${isOpen ? '▲' : '▼'}</span>
        </button>
        <div class="doc-content" style="display: ${isOpen ? 'block' : 'none'};">
          ${escapeHtml(doc.content)}
        </div>
      `;

      card.querySelector('.doc-header-btn').addEventListener('click', () => {
        const content = card.querySelector('.doc-content');
        const chevron = card.querySelector('.chevron');
        const isCurrentlyOpen = content.style.display === 'block';
        content.style.display = isCurrentlyOpen ? 'none' : 'block';
        chevron.textContent = isCurrentlyOpen ? '▼' : '▲';
      });

      docsList.appendChild(card);
    });
  }

  // 3. Highlight and open cited documents
  function highlightCitedDocs(sources) {
    document.querySelectorAll('.doc-card').forEach((el) => {
      el.classList.remove('active-source');
    });

    if (!sources || sources.length === 0) return;

    sources.forEach((src) => {
      let targetId = '';
      if (/Document 1/i.test(src)) targetId = 'doc-card-doc-1';
      if (/Document 2/i.test(src)) targetId = 'doc-card-doc-2';
      if (/Document 3/i.test(src)) targetId = 'doc-card-doc-3';

      if (targetId) {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.classList.add('active-source');
          const content = targetEl.querySelector('.doc-content');
          const chevron = targetEl.querySelector('.chevron');
          if (content) content.style.display = 'block';
          if (chevron) chevron.textContent = '▲';
        }
      }
    });
  }

  // 4. Query Execution
  async function submitQuery(question) {
    if (!question) return;

    lastQuestion = question;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Searching records...</span>
    `;

    errorContainer.style.display = 'none';
    responseContainer.style.display = 'none';

    const simulateFailure = simulateFailureToggle.checked;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, simulateFailure }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        showError(
          result.code === 'SIMULATED_FAILURE' ? 'Simulated API Failure (HTTP 503)' : 'Model Request Failed',
          result.error || 'The model could not process this request.',
          result.suggestion || 'Toggle off "Simulate API Failure" above or check your network.'
        );
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        showResponse(result.data);
        responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      showError('Network Connection Error', err.message || 'Unable to connect to help desk server.', 'Check your local server status.');
      errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Ask Help Desk</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      `;
    }
  }

  function showResponse(data) {
    responseContainer.style.display = 'block';
    responseContent.textContent = data.answer;
    responseEngineMode.textContent = data.mode || 'Grounded Engine';

    // Status Badge
    if (data.isUnknown) {
      responseStatusBadge.className = 'status-tag unknown';
      responseStatusBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Information Missing / Refused</span>
      `;
    } else {
      responseStatusBadge.className = 'status-tag grounded';
      responseStatusBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Verified Grounded in Official Documents</span>
      `;
    }

    // Sources Chips
    sourcesList.innerHTML = '';
    if (data.sources && data.sources.length > 0) {
      sourcesSection.style.display = 'block';
      data.sources.forEach((src) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'citation-pill';
        pill.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
          <span>${src}</span>
          <span style="font-size: 0.7rem; opacity: 0.7;">(view in sidebar)</span>
        `;
        pill.addEventListener('click', () => {
          highlightCitedDocs([src]);
          const docsSection = document.getElementById('docs-section');
          if (docsSection) docsSection.scrollIntoView({ behavior: 'smooth' });
        });
        sourcesList.appendChild(pill);
      });
      highlightCitedDocs(data.sources);
    } else {
      sourcesSection.style.display = 'none';
      highlightCitedDocs([]);
    }
  }

  function showError(title, msg, tip) {
    errorContainer.style.display = 'block';
    errorTitle.textContent = title;
    errorMessage.textContent = msg;
    errorSuggestion.textContent = tip;
  }

  // 5. Form Events
  qaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitQuery(questionInput.value.trim());
  });

  btnRetry.addEventListener('click', () => {
    if (lastQuestion) {
      submitQuery(lastQuestion);
    }
  });

  // 6. Preset Test Buttons
  btnPreset1.addEventListener('click', () => {
    questionInput.value = 'When do group coaching sessions take place and where do I find the link?';
    submitQuery(questionInput.value);
  });

  btnPreset2.addEventListener('click', () => {
    questionInput.value = 'How much does BrightPath Learn cost, and what are the refund rules?';
    submitQuery(questionInput.value);
  });

  btnPreset3.addEventListener('click', () => {
    questionInput.value = 'How do I save my progress in the Foundations course, and can lessons be watched in any order?';
    submitQuery(questionInput.value);
  });

  // 7. Quick Chips Buttons
  document.querySelectorAll('.chip-item').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (q) {
        questionInput.value = q;
        submitQuery(q);
      }
    });
  });

  // 8. Navigation Menu Buttons
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-target');
      if (targetId === 'coaching-section') {
        questionInput.value = 'When do group coaching sessions take place and where do I find the link?';
        submitQuery(questionInput.value);
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 9. Interactive Lesson Progress Tracker (Document 1 Interactive Feature)
  const lessonCounter = document.getElementById('lessonCounter');
  const lessonItems = document.querySelectorAll('.lesson-item');

  function updateLessonProgress() {
    const completedCount = document.querySelectorAll('.lesson-item.completed').length;
    lessonCounter.textContent = `${completedCount} of 6 Completed`;
  }

  lessonItems.forEach((item) => {
    const completeBtn = item.querySelector('.complete-btn');
    completeBtn.addEventListener('click', () => {
      item.classList.toggle('completed');
      if (item.classList.contains('completed')) {
        completeBtn.textContent = '✓ Completed';
      } else {
        completeBtn.textContent = 'Mark complete';
      }
      updateLessonProgress();
    });
  });

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
