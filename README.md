# BrightPath Learn — AI Help Desk

A grounded, hallucination-resistant AI help desk assistant for **BrightPath Learn** (a fictional online learning platform), built for the **Alessandro AI Developer Practical Test**.

Built with a multi-tier resilient architecture supporting **OpenRouter**, **Google Gemini**, and a deterministic offline ground-truth engine.

---

## 1. Quick Start

### Prerequisites
- **Node.js v18 or higher** (No external npm packages required — built 100% on Node.js native standard library).

### Run the Application
```bash
# 1. Clone repository
git clone https://github.com/reamogetswemolefe0190-cmd/brightpath-ai-helpdesk.git
cd brightpath-ai-helpdesk

# 2. (Optional) Configure Real LLM Keys in .env
# Copy example and add your OpenRouter or Gemini key:
cp .env.example .env

# 3. Start the server (runs immediately with zero dependencies)
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Test Battery
```bash
npm test
```
Executes the native test suite (10 automated assertions) verifying document ingestion, strict grounding, citation verification, out-of-scope refusals, upstream 503 outage handling, and multi-tier failover.

---

## 2. Features & Architecture

```
User Query ──► POST /api/chat ──► Grounding Engine (RAG) ──► Resilient Model Router
                                        │                             │
                      ┌─────────────────┴─────────────────┐           ├─► Tier 1: OpenRouter (Frontier)
                      │ Document 1 — Getting started     │           ├─► Tier 2: Google Gemini (Failover)
                      │ Document 2 — Coaching & feedback │           ├─► Tier 3: OpenAI (Alternative)
                      │ Document 3 — Account help        │           └─► Tier 4: Deterministic Mock Engine
                      └───────────────────────────────────┘
```

1. **Strict Document Grounding**:
   - The assistant answers queries using **only** the 3 supplied BrightPath Learn documents.
   - When verified, responses indicate the supporting document in the verified status badge (`Verified in Document X`).
2. **Negative Constraints & Warm Refusal**:
   - Out-of-scope questions (such as pricing, refunds, job guarantees, or starting a business) are refused politely without guessing or hallucinating.
   - The UI surfaces a dedicated **Human Support Available** card referring students to `support@brightpath.example` (Monday–Friday, 09:00–17:00 UTC).
   - Prevents false grounding badges (`isGrounded: false`, `isUnknown: true`).
3. **Multi-Tier Resilient Inference**:
   - **Frontier LLMs**: Out-of-the-box integration with OpenRouter (`google/gemini-2.5-flash`), Google Gemini (`gemini-3-flash-preview`), and OpenAI (`gpt-4o-mini`).
   - **Automatic Failover**: If the primary provider times out or encounters an upstream 503, the system automatically catches the error and fails over to secondary Google Gemini with zero user downtime.
   - **Deterministic Offline Mock Engine (Default)**: Pre-configured so any reviewer can clone and run `npm start` immediately with zero setup or API keys.
4. **Testable Failure Handling (Requirement 4)**:
   - Includes a 1-click **"Simulate API Failure"** toggle switch in the Reviewer Test Bench and a server hook (`simulateFailure: true`) to simulate upstream provider outages (HTTP 503) with clear recovery instructions.
5. **Authentic Interface & Zero Emojis**:
   - Clean, focused single-page interface using modern educational typography (`Plus Jakarta Sans` and `JetBrains Mono`).
   - Zero emojis in the application — crisp inline SVGs only.

---

## 3. Results for the 3 Required Test Scenarios

### Scenario 1: Supported Question
- **User Question**: *"When do group coaching sessions take place and where do I find the link?"*
- **Assistant Response**:
  > *"Our group coaching sessions are held every Tuesday at 16:00 UTC. You can find the link to join on the Coaching page, and it will appear 30 minutes before the session starts."*
- **Status Badge**: `Verified in Document 2 · Coaching and feedback`
- **Verification**: `isGrounded: true`, `isUnknown: false`.

### Scenario 2: Unknown / Out-of-Scope Question
- **User Question**: *"How do I start a business selling lessons?"* (or *"What is the refund policy and course pricing?"*)
- **Assistant Response**:
  > *"Hello there! That's an interesting question, but the BrightPath Learn knowledge base doesn't cover information about starting a business or selling lessons. Please feel free to reach out to our dedicated support team at support@brightpath.example for further assistance. They are available Monday to Friday, 09:00–17:00 UTC."*
- **Status Badge**: `Topic Beyond Available Guides`
- **UI Element**: Surfaces the dedicated Human Support referral card with direct email action.
- **Verification**: `isGrounded: false`, `isUnknown: true`, `sources: []` (No false claims of document verification).

### Scenario 3: API / Model Failure Condition
- **User Action**: Toggled **"Simulate API Failure"** switch on and submitted question.
- **Server Response**: HTTP 503 Service Unavailable
- **UI Error Card**:
  > **Simulated API Failure (HTTP 503)**  
  > *"Simulated LLM Service Outage: The upstream AI model is currently unreachable (HTTP 503 Service Unavailable). Please check your connection or try again shortly."*  
  > *Troubleshooting advice: Toggle off "Simulate API Failure" above or check your network.*
- **Action**: Provides an inline **Retry Request** button to re-submit cleanly.

---

## 4. What Was Built by Me vs Libraries / Tools

| Component | Author / Source | Description |
| :--- | :--- | :--- |
| **Grounding Engine** | Built by me | Document loader, prompt assembly with negative constraints, citation extraction, and anti-hallucination verification. |
| **Resilient LLM Router** | Built by me | Multi-provider client with timeout aborts and automatic failover from OpenRouter to Google Gemini. |
| **Server & API** | Built by me | Native Node.js HTTP server (`node:http`) with JSON endpoints (`/api/chat`, `/api/docs`, `/api/health`). Zero external npm dependencies. |
| **User Interface** | Built by me | Clean, responsive single-page web app with preset scenario test buttons and dynamic human support referral card. |
| **Automated Test Battery** | Built by me | 10 automated test assertions (`node:test`, `node:assert`) validating all required scenarios and edge cases. |
| **Upstream Inference** | OpenRouter / Google Gemini / OpenAI | Connected via standard REST APIs using native `fetch`. |

---

## 5. What is Unfinished or Limited (Future Improvements)

1. **Vector Embeddings for Scale**: With 3 reference documents, passing full-text context into the prompt or keyword router is 100% reliable and avoids retrieval chunking misses. For 50+ documents, a hybrid BM25 + vector retrieval layer (e.g. pgvector or SQLite-vss) would be implemented.
2. **Multi-Turn Conversation Memory**: The current interface focuses on single-turn Q&A. A production evolution would include multi-turn conversational session history and context window truncation.
3. **Streaming Responses**: Adding Server-Sent Events (SSE) for token-by-token streaming to enhance perceived latency on live frontier LLM calls.
4. **Automated Evaluation Harness**: Integrating continuous LLM-as-a-judge eval scripts (measuring faithfulness, answer relevancy, and negative constraint compliance) to automatically prevent regressions.
