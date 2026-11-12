import { buildGroundingPrompt, extractSources, generateMockAnswer } from './ragEngine.js';

/**
 * Call LLM or mock generator with failure simulation support
 */
export async function askHelpDesk(question, options = {}) {
  const { simulateFailure = false } = options;

  // Requirement 4: Testable failure handling condition
  if (simulateFailure) {
    const error = new Error(
      'Simulated LLM Service Outage: The upstream AI model is currently unreachable (HTTP 503 Service Unavailable). Please check your connection or try again shortly.'
    );
    error.status = 503;
    error.code = 'SIMULATED_FAILURE';
    throw error;
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // 1. If OpenRouter API key is configured, use OpenRouter (OpenAI-compatible)
  if (openrouterKey) {
    try {
      const prompt = buildGroundingPrompt(question);
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const model = process.env.OPENROUTER_MODEL?.trim() || 'google/gemini-2.0-flash-001';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'BrightPath AI Help Desk',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        const error = new Error(`OpenRouter API returned status ${response.status}: ${errBody}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || '';
      const sources = extractSources(answer);
      const isUnknown =
        sources.length === 0 ||
        /not available|not found|not mentioned|cannot find|unable to find|no information|does not contain|do not contain/i.test(
          answer
        );

      return {
        answer: answer.trim(),
        sources: isUnknown ? [] : sources,
        isGrounded: !isUnknown && sources.length > 0,
        isUnknown,
        mode: `real-llm (OpenRouter: ${model})`,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('LLM request timed out after 15 seconds. Upstream model did not respond in time.');
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  // 2. If Gemini API key is configured, use Gemini
  if (geminiKey) {
    try {
      const prompt = buildGroundingPrompt(question);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 600,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        const error = new Error(`LLM provider returned status ${response.status}: ${errBody}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const sources = extractSources(candidateText);
      const isUnknown =
        sources.length === 0 ||
        /not available|not found|not mentioned|cannot find|unable to find|no information/i.test(candidateText);

      return {
        answer: candidateText.trim(),
        sources: isUnknown ? [] : sources,
        isGrounded: !isUnknown && sources.length > 0,
        isUnknown,
        mode: 'real-llm (Gemini 1.5 Flash)',
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('LLM request timed out after 12 seconds. Upstream model did not respond in time.');
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  // 2. If OpenAI API key is configured, use OpenAI
  if (openaiKey) {
    try {
      const prompt = buildGroundingPrompt(question);
      const url = 'https://api.openai.com/v1/chat/completions';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        const error = new Error(`OpenAI API returned status ${response.status}: ${errBody}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || '';
      const sources = extractSources(answer);
      const isUnknown =
        sources.length === 0 ||
        /not available|not found|not mentioned|cannot find|unable to find|no information/i.test(answer);

      return {
        answer: answer.trim(),
        sources: isUnknown ? [] : sources,
        isGrounded: !isUnknown && sources.length > 0,
        isUnknown,
        mode: 'real-llm (GPT-4o-mini)',
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('LLM request timed out after 12 seconds. Upstream model did not respond.');
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  // 3. Built-in Offline Mock Model (Zero-configuration fallback)
  // Ensures any reviewer can run and evaluate without API keys
  const mockResult = generateMockAnswer(question);
  return {
    ...mockResult,
    mode: 'offline-mock (deterministic ground-truth engine)',
  };
}
