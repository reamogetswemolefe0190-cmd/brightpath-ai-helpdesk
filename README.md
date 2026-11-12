# BrightPath Learn — AI Help Desk

A grounded, hallucination-resistant AI help desk assistant for **BrightPath Learn** (a fictional online learning platform), built for the **Alessandro AI Developer Practical Test**.

Styled using **Palletism's [Graphite Sketch](https://palletism.art/collections/graphite-sketch)** taste pack for an authentic, calm, human-crafted educational feel.

---

## 1. Quick Start

### Prerequisites
- Node.js v18 or higher (No external npm packages required — built 100% on Node.js native modules).

### Run the Application
```bash
# 1. Navigate to directory
cd brightpath-ai-helpdesk

# 2. Start the server (runs immediately, zero download needed)
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Tests
```bash
npm test
```
Executes the native test battery verifying grounding, source citation, out-of-scope refusal, and failure handling.

---

## 2. Features & Architecture

```
User Query ──► /api/chat ──► Grounding Engine (RAG) ──► LLM Router
                                    │                           │
                   ┌────────────────┴───────────────┐           ├─► Real API (Gemini/OpenAI)
                   │ Document 1 — Getting started   │           ├─► Offline Grounded Mock
                   │ Document 2 — Coaching/feedback │           └─► Simulated Outage (503)
                   │ Document 3 — Account help      │
                   └────────────────────────────────┘
```

1. **Strict Document Grounding**:
   - The assistant answers queries using **only** the 3 supplied BrightPath Learn documents.
   - Answers explicitly cite which document supports them.
2. **Negative Constraint & Refusal**:
   - Out-of-scope questions (such as pricing, refunds, or job placement promises) are explicitly refused without guessing or hallucinating, and members are referred to `support@brightpath.example`.
3. **Dual Model Modes**:
   - **Offline Mock Engine (Default)**: Deterministic, rule-based ground-truth matching so reviewers can evaluate the app out of the box without needing an API key.
   - **Real LLM Integration**: Pass `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env` to connect live frontier models.
4. **Testable Failure Handling**:
   - Includes a 1-click **"Simulate API Failure"** toggle in the UI and server hook (`simulateFailure: true`) to simulate upstream provider outages (HTTP 503) with user-friendly recovery guidance.
5. **Palletism Aesthetic**:
   - Uses Palletism's `graphite-sketch` design tokens: Bright Paper (`#FFFFFF`), Graphite Ink (`#2B2B2B`), Soft Graphite (`#7A7A7A`), and Hatching (`#C9C9C9`).
   - Editorial serif typography (`Cormorant Garamond` + `Literata`).
   - Zero emojis — clean inline SVGs only.

---

## 3. Results for the 3 Required Test Scenarios

### Scenario 1: Supported Question
- **User Question**: *"When do group coaching sessions take place and where do I find the link?"*
- **Assistant Response**:
  > *"Group coaching sessions take place every Tuesday at 16:00 UTC. The link appears on the Coaching page 30 minutes before the session, and recordings are added within 24 hours."*
- **Cited Source**: `Document 2 — Coaching and feedback`
- **Result**: Verified grounded answer. Document 2 card is highlighted in the UI.

### Scenario 2: Unknown / Out-of-Scope Question
- **User Question**: *"How much does BrightPath Learn cost, and what are the refund rules?"*
- **Assistant Response**:
  > *"This information is not available in the supplied BrightPath Learn documents. For questions regarding pricing, refund rules, or job placement promises, please contact our support team at support@brightpath.example (available Monday to Friday, 09:00–17:00 UTC)."*
- **Cited Source**: `Document 3 — Account help`
- **Result**: Grounded refusal. No hallucinated prices or refund policies.

### Scenario 3: API / Model Failure Condition
- **User Action**: Flipped **"Simulate API Failure"** toggle switch on and submitted question.
- **Server Response**: HTTP 503 Service Unavailable
- **UI Error Banner**:
  > **Model Service Unavailable**  
  > *"Simulated LLM Service Outage: The upstream AI model is currently unreachable (HTTP 503 Service Unavailable). Please check your connection or try again shortly."*  
  > *Troubleshooting note: Toggle off "Simulate API Failure" above or check server logs.*
- **Action**: Provides an inline **Retry Request** button.

---

## 4. What Was Built by Me vs Libraries / Tools

| Component | Author / Source | Description |
| :--- | :--- | :--- |
| **Grounding Engine** | Built by me | Document ingestion, strict system prompting, citation extraction, and negative refusal constraint logic. |
| **Server & API** | Built by me | Native Node.js HTTP server (`node:http`) with JSON endpoints (`/api/chat`, `/api/docs`, `/api/health`). Zero dependencies. |
| **User Interface** | Built by me | Accessible single-page web app with preset scenario test buttons, document drawer, and live citation highlighting. |
| **Automated Test Battery** | Built by me | 7 automated test assertions (`node:test`) validating all 3 test scenarios. |
| **Visual Design & Taste** | Palletism MCP Server | Queried Palletism MCP server for the `graphite-sketch` taste pack (palette tokens, font pairings, and aesthetic brief). |
| **LLM Inference** | Google Gemini / OpenAI | Optional upstream APIs connected via standard REST calls. |

---

## 5. What is Unfinished or Limited (Future Improvements)

1. **Vector Embeddings for Scale**: Currently, with 3 documents, passing full-text context into the prompt or keyword matcher is 100% reliable and avoids retrieval chunking misses. For hundreds of documents, we would add hybrid BM25 + dense vector search (e.g. pgvector or SQLite-vss).
2. **Multi-Turn Conversation Memory**: The current implementation is single-turn Q&A. Adding a session store (e.g., Redis or in-memory LRU) would allow conversational follow-ups.
3. **Streaming Responses**: Adding Server-Sent Events (SSE) for token-by-token streaming to enhance perceived latency on real LLM calls.
4. **Automated Evaluation Harness**: Integrating an automated LLM-as-a-judge eval script (using RAGAS metrics: faithfulness, answer relevancy, context recall) to continuously prevent regressions.
