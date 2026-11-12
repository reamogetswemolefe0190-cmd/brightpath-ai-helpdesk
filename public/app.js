document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const qaForm = document.getElementById('qaForm');
  const questionInput = document.getElementById('questionInput');
  const submitBtn = document.getElementById('submitBtn');
  const simulateFailureToggle = document.getElementById('simulateFailureToggle');

  const responseContainer = document.getElementById('responseContainer');
  const responseStatusBadge = document.getElementById('responseStatusBadge');
  const humanSupportCard = document.getElementById('humanSupportCard');
  const responseContent = document.getElementById('responseContent');

  const errorContainer = document.getElementById('errorContainer');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const errorSuggestion = document.getElementById('errorSuggestion');
  const btnRetry = document.getElementById('btnRetry');

  const btnPreset1 = document.getElementById('btnPreset1');
  const btnPreset2 = document.getElementById('btnPreset2');
  const btnPreset3 = document.getElementById('btnPreset3');

  let lastQuestion = '';

  // Query Execution
  async function submitQuery(question) {
    if (!question) return;

    lastQuestion = question;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span>Searching records...</span>
    `;

    errorContainer.style.display = 'none';
    responseContainer.style.display = 'none';
    if (humanSupportCard) humanSupportCard.style.display = 'none';

    const simulateFailure = simulateFailureToggle?.checked || false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          simulateFailure,
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

    // Strip out any trailing "Source: Document X" from the raw text for natural reading
    const cleanAnswer = data.answer.replace(/\n*Source:\s*Document\s*\d[^\n]*$/i, '').trim();
    responseContent.textContent = cleanAnswer;

    // Status Badge & Human Support Card
    if (data.isUnknown) {
      responseStatusBadge.className = 'status-tag unknown';
      responseStatusBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Topic Beyond Available Guides</span>
      `;
      if (humanSupportCard) humanSupportCard.style.display = 'block';
    } else {
      responseStatusBadge.className = 'status-tag grounded';
      const docLabel = (data.sources && data.sources[0])
        ? data.sources[0].replace(' — ', ' · ')
        : 'Official Documents';
      responseStatusBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Verified in ${docLabel}</span>
      `;
      if (humanSupportCard) humanSupportCard.style.display = 'none';
    }
  }

  function showError(title, msg, tip) {
    errorContainer.style.display = 'block';
    errorTitle.textContent = title;
    errorMessage.textContent = msg;
    errorSuggestion.textContent = tip;
  }

  // Form Submit Listener
  qaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = questionInput.value.trim();
    if (!query) return;
    submitQuery(query);
  });

  // Retry Action
  btnRetry.addEventListener('click', () => {
    if (lastQuestion) {
      simulateFailureToggle.checked = false;
      submitQuery(lastQuestion);
    }
  });

  // Preset Handlers
  btnPreset1.addEventListener('click', () => {
    questionInput.value = 'When are the group coaching calls and how do I join?';
    submitQuery(questionInput.value);
  });

  btnPreset2.addEventListener('click', () => {
    questionInput.value = 'What is the refund policy and course pricing?';
    submitQuery(questionInput.value);
  });

  btnPreset3.addEventListener('click', () => {
    questionInput.value = 'How does progress tracking work in the Foundations course?';
    submitQuery(questionInput.value);
  });

  // Quick Chips
  document.querySelectorAll('.chip-item').forEach((chip) => {
    chip.addEventListener('click', () => {
      questionInput.value = chip.dataset.query;
      submitQuery(questionInput.value);
    });
  });
});
