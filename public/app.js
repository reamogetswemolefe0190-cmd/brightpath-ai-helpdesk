document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const qaForm = document.getElementById('qaForm');
  const questionInput = document.getElementById('questionInput');
  const submitBtn = document.getElementById('submitBtn');
  const simulateFailureToggle = document.getElementById('simulateFailureToggle');
  const providerSelect = document.getElementById('providerSelect');
  const fallbackChainIndicator = document.getElementById('fallbackChainIndicator');

  const responseContainer = document.getElementById('responseContainer');
  const responseStatusBadge = document.getElementById('responseStatusBadge');
  const responseEngineMode = document.getElementById('responseEngineMode');
  const responseFallbackBanner = document.getElementById('responseFallbackBanner');
  const responseFallbackText = document.getElementById('responseFallbackText');
  const responseContent = document.getElementById('responseContent');
  const sourcesSection = document.getElementById('sourcesSection');
  const sourcesList = document.getElementById('sourcesList');

  const errorContainer = document.getElementById('errorContainer');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const errorSuggestion = document.getElementById('errorSuggestion');
  const btnRetry = document.getElementById('btnRetry');

  const healthStatusText = document.getElementById('healthStatusText');

  const btnPreset1 = document.getElementById('btnPreset1');
  const btnPreset2 = document.getElementById('btnPreset2');
  const btnPreset3 = document.getElementById('btnPreset3');
  const btnPresetFallback = document.getElementById('btnPresetFallback');

  let lastQuestion = '';

  // 1. Initial Health & Provider Check
  fetch('/api/health')
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        if (data.modelMode === 'online-api') {
          const p = data.providers;
          const chain = [];
          if (p.openrouter) chain.push('OpenRouter');
          if (p.gemini) chain.push('Gemini');
          chain.push('Mock');
          healthStatusText.textContent = `Frontier Active (${chain.join(' → ')})`;
          if (fallbackChainIndicator) {
            fallbackChainIndicator.querySelector('.chain-text').textContent = chain.join(' ➔ ');
          }
        } else {
          healthStatusText.textContent = 'Grounded Mock Engine';
        }
      }
    })
    .catch(() => {
      healthStatusText.textContent = 'Server Offline';
    });

  // 2. Query Execution
  async function submitQuery(question) {
    if (!question) return;

    lastQuestion = question;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span>Searching records...</span>
    `;

    errorContainer.style.display = 'none';
    responseContainer.style.display = 'none';
    if (responseFallbackBanner) responseFallbackBanner.style.display = 'none';

    const simulateFailure = simulateFailureToggle?.checked || false;
    const selectedStrategy = providerSelect?.value || 'auto';
    const simulateFallback = selectedStrategy === 'simulate-fallback';
    const provider = selectedStrategy === 'simulate-fallback' ? 'auto' : selectedStrategy;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          simulateFailure,
          simulateFallback,
          provider,
        }),
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

    // Fallback Banner
    if (data.fallbackUsed && responseFallbackBanner) {
      responseFallbackBanner.style.display = 'flex';
      const historyStr = data.fallbackHistory?.map((h) => h.provider).join(', ') || 'primary provider';
      responseFallbackText.textContent = `Failover Active: Primary model (${historyStr}) was unavailable. Answer was seamlessly generated by secondary fallback (${data.provider || 'Google Gemini'}).`;
    } else if (responseFallbackBanner) {
      responseFallbackBanner.style.display = 'none';
    }

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
        const pill = document.createElement('div');
        pill.className = 'citation-pill';
        pill.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
          <span>${src}</span>
        `;
        sourcesList.appendChild(pill);
      });
    } else {
      sourcesSection.style.display = 'none';
    }
  }

  function showError(title, msg, tip) {
    errorContainer.style.display = 'block';
    errorTitle.textContent = title;
    errorMessage.textContent = msg;
    errorSuggestion.textContent = tip;
  }

  // 3. Form Submit Listener
  qaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = questionInput.value.trim();
    if (!query) return;

    // Handle slash command: /help
    if (query === '/help' || query === '/?') {
      showResponse({
        answer: `Available commands & failover controls:\n\n• /fallback test - Simulates primary provider outage to demonstrate live failover\n• /provider openrouter - Force primary OpenRouter model\n• /provider gemini - Force Google Gemini direct fallback\n• /provider mock - Force offline deterministic engine\n• /provider auto - Enable intelligent multi-tier automatic failover\n\nYou can also use the "Model Strategy" dropdown in the Reviewer Test Bench above!`,
        sources: [],
        isGrounded: false,
        isUnknown: false,
        mode: 'System Command Help',
      });
      return;
    }

    submitQuery(query);
  });

  // 4. Retry Action
  btnRetry.addEventListener('click', () => {
    if (lastQuestion) {
      simulateFailureToggle.checked = false;
      submitQuery(lastQuestion);
    }
  });

  // 5. Preset Pill Handlers
  btnPreset1.addEventListener('click', () => {
    questionInput.value = 'When are the group coaching calls and how do I join?';
    if (providerSelect) providerSelect.value = 'auto';
    submitQuery(questionInput.value);
  });

  btnPreset2.addEventListener('click', () => {
    questionInput.value = 'What is the refund policy and course pricing?';
    if (providerSelect) providerSelect.value = 'auto';
    submitQuery(questionInput.value);
  });

  btnPreset3.addEventListener('click', () => {
    questionInput.value = 'How does progress tracking work in the Foundations course?';
    if (providerSelect) providerSelect.value = 'auto';
    submitQuery(questionInput.value);
  });

  if (btnPresetFallback) {
    btnPresetFallback.addEventListener('click', () => {
      questionInput.value = 'When are the group coaching calls and how do I join?';
      if (providerSelect) providerSelect.value = 'simulate-fallback';
      submitQuery(questionInput.value);
    });
  }

  // Quick Chips
  document.querySelectorAll('.chip-item').forEach((chip) => {
    chip.addEventListener('click', () => {
      questionInput.value = chip.dataset.query;
      submitQuery(questionInput.value);
    });
  });
});
