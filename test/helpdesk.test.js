import test from 'node:test';
import assert from 'node:assert/strict';
import { askHelpDesk } from '../src/llmClient.js';
import { loadDocuments, extractSources } from '../src/ragEngine.js';

test('BrightPath Learn AI Help Desk Test Battery', async (t) => {
  await t.test('Document Loading: Loads all 3 required reference documents', () => {
    const docs = loadDocuments();
    assert.equal(docs.length, 3, 'Should load exactly 3 documents');
    assert.equal(docs[0].title, 'Document 1 — Getting started');
    assert.equal(docs[1].title, 'Document 2 — Coaching and feedback');
    assert.equal(docs[2].title, 'Document 3 — Account help');
  });

  await t.test('Scenario 1 (Supported Question): Group coaching schedule and links', async () => {
    const question = 'When do group coaching sessions take place and where do I find the link?';
    const result = await askHelpDesk(question);

    assert.ok(result.answer, 'Must return a non-empty answer');
    assert.match(result.answer, /Tuesday/i, 'Answer must state Tuesday');
    assert.match(result.answer, /16:00/i, 'Answer must state 16:00 UTC');
    assert.match(result.answer, /Coaching page/i, 'Answer must cite Coaching page link location');

    assert.ok(Array.isArray(result.sources), 'Sources must be an array');
    assert.ok(
      result.sources.includes('Document 2 — Coaching and feedback'),
      'Must cite Document 2 — Coaching and feedback'
    );
    assert.equal(result.isGrounded, true, 'isGrounded flag must be true');
  });

  await t.test('Scenario 1 (Supported Question - Doc 1): Progress saving and lesson order', async () => {
    const question = 'How do I save my progress in the Foundations course?';
    const result = await askHelpDesk(question);

    assert.ok(result.answer, 'Must return a non-empty answer');
    assert.match(result.answer, /Mark complete/i, 'Answer must mention Mark complete');
    assert.match(result.answer, /Home/i, 'Answer must mention Home');
    assert.ok(
      result.sources.includes('Document 1 — Getting started'),
      'Must cite Document 1 — Getting started'
    );
  });

  await t.test('Scenario 2 (Unknown Question): Pricing, refunds, and out-of-scope policies', async () => {
    const question = 'How much does BrightPath Learn cost, and can I get a full refund if I drop out?';
    const result = await askHelpDesk(question);

    assert.ok(result.answer, 'Must return an answer');
    // Must explicitly state info is not available
    assert.match(
      result.answer,
      /not available in the supplied (BrightPath Learn )?documents/i,
      'Must explicitly state information is not available in supplied documents'
    );
    // Must refer member to support
    assert.match(
      result.answer,
      /support@brightpath\.example/i,
      'Must direct member to support@brightpath.example'
    );
    // Must NOT hallucinate a price tag
    assert.doesNotMatch(result.answer, /\$\d+|\bR\d+|\b€\d+/i, 'Must not invent currency/pricing amounts');
  });

  await t.test('Scenario 3 (Failure Condition): Simulated upstream API failure handling', async () => {
    let caughtError = null;

    try {
      await askHelpDesk('Any question', { simulateFailure: true });
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError, 'Must throw an error when simulateFailure is true');
    assert.equal(caughtError.status, 503, 'Error status should be 503 Service Unavailable');
    assert.equal(caughtError.code, 'SIMULATED_FAILURE', 'Error code should be SIMULATED_FAILURE');
    assert.match(
      caughtError.message,
      /unreachable|outage|try again/i,
      'Error message must provide user-friendly explanation and recovery guidance'
    );
  });

  await t.test('Security & Account Policy: Password reset and never requesting passwords', async () => {
    const question = 'I forgot my password. How do I reset it, and will support ask for it?';
    const result = await askHelpDesk(question);

    assert.match(result.answer, /Forgot password/i, 'Must mention Forgot password on sign-in page');
    assert.match(result.answer, /never ask/i, 'Must emphasize that support never asks for a password');
    assert.ok(
      result.sources.includes('Document 3 — Account help'),
      'Must cite Document 3 — Account help'
    );
  });
});
