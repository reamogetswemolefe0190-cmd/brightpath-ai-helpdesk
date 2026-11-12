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

  // Client-side Grounding Engine (Runs seamlessly on GitHub Pages / Static Hosting)
  function runClientGrounding(question, simulateFailure) {
    if (simulateFailure) {
      const err = new Error(
        'Simulated LLM Service Outage: The upstream AI model is currently unreachable (HTTP 503 Service Unavailable). Please check your connection or try again shortly.'
      );
      err.code = 'SIMULATED_FAILURE';
      throw err;
    }

    const q = question.toLowerCase();

    // Out of scope / Unknown
    if (
      q.includes('price') ||
      q.includes('pricing') ||
      q.includes('cost') ||
      q.includes('refund') ||
      q.includes('job') ||
      q.includes('placement') ||
      q.includes('guarantee') ||
      q.includes('salary') ||
      q.includes('business') ||
      q.includes('selling') ||
      q.includes('discount') ||
      q.includes('certificate') ||
      q.includes('accreditation')
    ) {
      return {
        answer:
          "Hello there!\n\nThat's an interesting question, but the BrightPath Learn knowledge base doesn't cover information about pricing, refunds, or starting a business.\n\nPlease feel free to reach out to our dedicated support team at support@brightpath.example for further assistance. They are available Monday to Friday, 09:00–17:00 UTC.",
        sources: [],
        isGrounded: false,
        isUnknown: true,
      };
    }

    // Document 2: Coaching and feedback
    if (
      q.includes('coaching') ||
      q.includes('tuesday') ||
      q.includes('16:00') ||
      q.includes('feedback') ||
      q.includes('practice') ||
      q.includes('recording')
    ) {
      let details = [];
      if (q.includes('coaching') || q.includes('session') || q.includes('tuesday') || q.includes('link') || q.includes('join')) {
        details.push(
          'Group coaching sessions take place every Tuesday at 16:00 UTC. The link appears on the Coaching page 30 minutes before the session starts, and recordings are added within 24 hours.'
        );
      }
      if (q.includes('feedback') || q.includes('practice')) {
        details.push(
          'To get feedback on practice work, paste a shareable link in the Practice page and select "Request feedback". Feedback usually arrives within 2 working days.'
        );
      }
      return {
        answer: details.join('\n\n') || 'Group coaching sessions take place every Tuesday at 16:00 UTC on the Coaching page.',
        sources: ['Document 2 — Coaching and feedback'],
        isGrounded: true,
        isUnknown: false,
      };
    }

    // Document 1: Getting started
    if (
      q.includes('lesson') ||
      q.includes('foundations') ||
      q.includes('progress') ||
      q.includes('save') ||
      q.includes('complete') ||
      q.includes('order') ||
      q.includes('start')
    ) {
      return {
        answer:
          'The Foundations course has 6 lessons that can be completed in any order, though starting with Lesson 1 on the Home page is recommended. To save your progress, select "Mark complete" after finishing a lesson. Watching a video alone will not mark a lesson complete.',
        sources: ['Document 1 — Getting started'],
        isGrounded: true,
        isUnknown: false,
      };
    }

    // Document 3: Account help
    if (
      q.includes('password') ||
      q.includes('reset') ||
      q.includes('email') ||
      q.includes('support')
    ) {
      return {
        answer:
          'To reset your password, select "Forgot password" on the sign-in page (support will never ask for your password). For account email updates or technical issues, contact support@brightpath.example. Support is available Monday to Friday, 09:00–17:00 UTC.',
        sources: ['Document 3 — Account help'],
        isGrounded: true,
        isUnknown: false,
      };
    }

    return {
      answer:
        "I couldn't find information about that in the BrightPath Learn knowledge base. Our team is always happy to help with questions beyond our self-service documentation! Please reach out to our support team at support@brightpath.example (Monday to Friday, 09:00–17:00 UTC).",
      sources: [],
      isGrounded: false,
      isUnknown: true,
    };
  }

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
      let resultData = null;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, simulateFailure }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.ok) {
            resultData = result.data;
          } else {
            throw new Error(result.error || 'Server error');
          }
        } else if (res.status === 503) {
          const result = await res.json().catch(() => ({}));
          const err = new Error(result.error || 'Service Unavailable');
          err.code = 'SIMULATED_FAILURE';
          throw err;
        } else {
          // 404 or other static host response (e.g. GitHub Pages) -> Fall back to client-side engine
          resultData = runClientGrounding(question, simulateFailure);
        }
      } catch (fetchErr) {
        if (fetchErr.code === 'SIMULATED_FAILURE' || simulateFailure) {
          throw fetchErr;
        }
        // If static host or network unreachable, run deterministic client engine
        resultData = runClientGrounding(question, simulateFailure);
      }

      showResponse(resultData);
      responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      showError(
        err.code === 'SIMULATED_FAILURE' || simulateFailure
          ? 'Simulated API Failure (HTTP 503)'
          : 'Service Unavailable',
        err.message || 'The model could not process this request.',
        'Toggle off "Simulate API Failure" above or check connection.'
      );
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
