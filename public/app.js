document.addEventListener('DOMContentLoaded', () => {
  const qaForm = document.getElementById('qaForm');
  const questionInput = document.getElementById('questionInput');
  const submitBtn = document.getElementById('submitBtn');
  const simulateFailureToggle = document.getElementById('simulateFailureToggle');

  const responseContainer = document.getElementById('responseContainer');
  const responseBadge = document.getElementById('responseBadge');
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
  const systemStatusText = document.getElementById('systemStatusText');

  const btnTestSupported = document.getElementById('btnTestSupported');
  const btnTestUnknown = document.getElementById('btnTestUnknown');
  const btnTestDoc1 = document.getElementById('btnTestDoc1');

  let lastQuestion = '';

  // 1. Initial health & status check
  fetch('/api/health')
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        systemStatusText.textContent = data.modelMode === 'online-api' ? 'Model: Online API' : 'Model: Grounded Mock';
      }
    })
    .catch(() => {
      systemStatusText.textContent = 'Offline';
    });

  // 2. Fetch and render reference documents
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

      // Show first document open by default
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

  // 3. Highlight cited document cards
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

  // 4. Handle Question Submission
  async function submitQuery(question) {
    if (!question) return;

    lastQuestion = question;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
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
          result.code === 'SIMULATED_FAILURE' ? 'Simulated API Failure' : 'Model Request Failed',
          result.error || 'The model could not process this request.',
          result.suggestion || 'Please verify network or disable failure simulation.'
        );
      } else {
        showResponse(result.data);
      }
    } catch (err) {
      showError('Network Connection Error', err.message || 'Unable to connect to help desk server.', 'Check your local server status.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <span>Ask Help Desk</span>
      `;
    }
  }

  function showResponse(data) {
    responseContainer.style.display = 'block';
    responseContent.textContent = data.answer;
    responseEngineMode.textContent = data.mode || 'Grounded Engine';

    // Status Badge
    if (data.isUnknown) {
      responseBadge.className = 'grounding-badge badge-unknown';
      responseBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Information Missing / Refused</span>
      `;
    } else {
      responseBadge.className = 'grounding-badge badge-grounded';
      responseBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Verified Grounded Answer</span>
      `;
    }

    // Sources
    sourcesList.innerHTML = '';
    if (data.sources && data.sources.length > 0) {
      sourcesSection.style.display = 'block';
      data.sources.forEach((src) => {
        const chip = document.createElement('span');
        chip.className = 'source-chip';
        chip.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
          ${src}
        `;
        sourcesList.appendChild(chip);
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

  // 5. Event Listeners
  qaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitQuery(questionInput.value.trim());
  });

  btnRetry.addEventListener('click', () => {
    if (lastQuestion) {
      submitQuery(lastQuestion);
    }
  });

  // Preset Button 1: Supported Question
  btnTestSupported.addEventListener('click', () => {
    questionInput.value = 'When do group coaching sessions take place and where do I find the link?';
    submitQuery(questionInput.value);
  });

  // Preset Button 2: Unknown Question (Refusal)
  btnTestUnknown.addEventListener('click', () => {
    questionInput.value = 'How much does BrightPath Learn cost, and what are the refund rules?';
    submitQuery(questionInput.value);
  });

  // Preset Button 3: Progress Saving (Doc 1)
  btnTestDoc1.addEventListener('click', () => {
    questionInput.value = 'How do I save my progress in the Foundations course, and can lessons be watched in any order?';
    submitQuery(questionInput.value);
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
