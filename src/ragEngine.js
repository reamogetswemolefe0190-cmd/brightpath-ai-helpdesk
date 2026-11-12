import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, '../docs');

/**
 * Load and cache reference documents
 */
export function loadDocuments() {
  const files = [
    { id: 'doc-1', title: 'Document 1 — Getting started', filename: 'document-1-getting-started.md' },
    { id: 'doc-2', title: 'Document 2 — Coaching and feedback', filename: 'document-2-coaching-and-feedback.md' },
    { id: 'doc-3', title: 'Document 3 — Account help', filename: 'document-3-account-help.md' },
  ];

  return files.map((doc) => {
    const fullPath = path.join(DOCS_DIR, doc.filename);
    const content = fs.readFileSync(fullPath, 'utf8').trim();
    return {
      id: doc.id,
      title: doc.title,
      content,
    };
  });
}

const DOCUMENTS = loadDocuments();

/**
 * Assemble grounding system prompt for real LLM
 */
export function buildGroundingPrompt(question) {
  const docContext = DOCUMENTS.map((d) => `=== ${d.title} ===\n${d.content}`).join('\n\n');

  const systemInstructions = `You are the official AI Help Desk Assistant for BrightPath Learn (a fictional learning platform).

Your responsibilities and strict constraints:
1. Answer the user's question using ONLY the facts explicitly stated in the supplied reference documents below.
2. In your response, explicitly state which document supports your answer (e.g. "Source: Document 2 — Coaching and feedback").
3. If the answer is NOT contained in the reference documents (for example, pricing, refund rules, job placement guarantees, or unspecified features):
   - State clearly and naturally that this information is not available.
   - Refer the member to contact support at support@brightpath.example.
   - Do NOT attempt to guess, assume, or hallucinate an answer.
4. Security rule: Never ask a member to provide their password.
5. Format your response cleanly and naturally without robotic meta-language.

Reference Documents:
${docContext}

User Question: ${question}

Response format: Provide a helpful, direct answer followed by an explicit "Source:" line citing the supporting document(s), or stating that the information is unavailable and referring to support.`;

  return systemInstructions;
}

/**
 * Extract cited sources from an answer
 */
export function extractSources(answer) {
  const sources = [];
  if (/Document 1/i.test(answer)) sources.push('Document 1 — Getting started');
  if (/Document 2/i.test(answer)) sources.push('Document 2 — Coaching and feedback');
  if (/Document 3/i.test(answer)) sources.push('Document 3 — Account help');
  return sources;
}

/**
 * Deterministic offline rule-based model for mock testing and running without an API key
 */
export function generateMockAnswer(question) {
  const q = question.toLowerCase();

  // Out of scope / unknown questions check (Document 3 explicit constraints + general out-of-bounds)
  if (
    q.includes('price') ||
    q.includes('pricing') ||
    q.includes('cost') ||
    q.includes('refund') ||
    q.includes('job') ||
    q.includes('placement') ||
    q.includes('guarantee') ||
    q.includes('salary') ||
    q.includes('discount') ||
    q.includes('certificate') ||
    q.includes('accreditation')
  ) {
    return {
      answer:
        'This information is not currently available. For questions regarding pricing, refund rules, or job placement promises, please contact our support team at support@brightpath.example (available Monday to Friday, 09:00–17:00 UTC).',
      sources: ['Document 3 — Account help'],
      isGrounded: true,
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
    if (q.includes('feedback') || q.includes('practice')) {
      details.push(
        'To get feedback on practice work, paste a shareable link in the Practice page and select "Request feedback". Feedback usually arrives within 2 working days (typical response time, not a guarantee).'
      );
    }
    if (q.includes('coaching') || q.includes('session') || q.includes('tuesday') || q.includes('link') || q.includes('recording')) {
      details.push(
        'Group coaching sessions take place every Tuesday at 16:00 UTC. The link appears on the Coaching page 30 minutes before the session, and recordings are added within 24 hours.'
      );
    }
    if (details.length === 0) {
      details.push(
        'Group coaching sessions take place every Tuesday at 16:00 UTC (link available on Coaching page 30 minutes prior; recordings uploaded within 24 hours). For feedback on practice work, paste a shareable link in the Practice page and select "Request feedback" (typical response within 2 working days).'
      );
    }

    return {
      answer: details.join(' '),
      sources: ['Document 2 — Coaching and feedback'],
      isGrounded: true,
      isUnknown: false,
    };
  }

  // Document 1: Getting started
  if (
    q.includes('getting started') ||
    q.includes('lesson 1') ||
    q.includes('foundations course') ||
    q.includes('set your goal') ||
    q.includes('mark complete') ||
    ((q.includes('how to start') || q.includes('where do i start')) && !q.includes('business'))
  ) {
    return {
      answer:
        'After joining BrightPath Learn, open Home and select "Start Lesson 1: Set your goal". The Foundations course consists of 6 lessons which can be watched in any order. To save your progress, remember to select "Mark complete" after finishing a lesson — watching a video alone does not mark the lesson complete. Your next lesson will then appear on Home.',
      sources: ['Document 1 — Getting started'],
      isGrounded: true,
      isUnknown: false,
    };
  }

  // Document 3: Account help
  if (
    q.includes('password') ||
    q.includes('reset') ||
    q.includes('forgot') ||
    q.includes('support') ||
    q.includes('contact') ||
    q.includes('email') ||
    q.includes('missing') ||
    q.includes('hours')
  ) {
    return {
      answer:
        'To reset your password, select "Forgot password" on the sign-in page (we will never ask you to send your password). For missing courses or incorrect lesson progress, contact support@brightpath.example with your account email and lesson name. Support is available Monday to Friday, 09:00–17:00 UTC.',
      sources: ['Document 3 — Account help'],
      isGrounded: true,
      isUnknown: false,
    };
  }

  // Fallback for completely unrecognized queries
  return {
    answer:
      'I could not find an answer to that question. Please check our official knowledgebase or contact support@brightpath.example for assistance.',
    sources: [],
    isGrounded: false,
    isUnknown: true,
  };
}

export { DOCUMENTS };
