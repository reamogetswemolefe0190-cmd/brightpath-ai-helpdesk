# Practical Test Submission Guide (Alessandro Hiring Portal)

Submission guide for the 6 fields on the hiring portal.

---

### Field 1: Links to your work (Required)
```text
https://github.com/reamogetswemolefe0190-cmd/brightpath-ai-helpdesk
Local execution: git clone https://github.com/reamogetswemolefe0190-cmd/brightpath-ai-helpdesk.git, cd brightpath-ai-helpdesk && npm start (runs on http://localhost:3000 with zero external npm dependencies)
```

---

### Field 2: Walk me through your work (Required)
```text
I built the BrightPath Learn AI Help Desk as a grounded, lightweight web application focused on high-quality responses, explicit document citations, and resilient failure handling.

1. Grounding & RAG Architecture:
The system is built on a custom grounding engine that ingests the 3 official reference documents. When a user submits a question, the assistant bounds its response strictly to the facts present in the text and explicitly cites the supporting source (e.g. "Document 2 — Coaching and feedback"). If a user asks about topics not in the documentation (such as pricing, refunds, or job placement guarantees), the engine refuses to guess or hallucinate, states that the information is not currently available, and refers the user to support@brightpath.example (Monday–Friday, 09:00–17:00 UTC).

2. Dual Model Architecture & Multi-Provider Failover:
- Deterministic Offline Mock Engine (Default): Pre-configured so any reviewer can clone the repository and run `npm start` immediately with zero setup or API keys.
- Real LLM Integration: Seamlessly connects to OpenRouter, Google Gemini, or OpenAI simply by providing an API key in .env. If OpenRouter encounters an upstream outage, the system automatically falls back to secondary Google Gemini with zero downtime.

3. Failure Handling & Testing (Requirement 4):
The application includes a built-in "Simulate API Failure" toggle switch and server failure hook that triggers a simulated HTTP 503 service outage. The UI catches this state gracefully, displaying a clear alert banner with actionable recovery advice and an inline "Retry Request" button.

4. Results for the 3 Test Cases:
- Case 1 (Supported Question: "When do group coaching sessions take place and where do I find the link?"): Correctly returns Tuesday at 16:00 UTC, states that the link appears on the Coaching page 30 minutes prior, and cites "Document 2 — Coaching and feedback".
- Case 2 (Unknown Question: "How much does BrightPath Learn cost, and what are the refund rules?"): Refuses to hallucinate, provides a warm helpful message that the topic is beyond the knowledge base, and directs the user to support@brightpath.example.
- Case 3 (API Failure Condition): Flipped the simulation toggle; server returned HTTP 503 with a user-friendly error card and retry action.

5. What I Built vs Used:
- Built by me: Grounding engine, prompt assembly, citation parser, deterministic offline matcher, zero-dependency Node.js HTTP server, automated test battery (10 passing assertions), and clean responsive web UI.
- Tools & Libraries: Node.js native standard library (`node:http`, `node:test`, `node:assert`, `node:fs`).

6. What I Would Improve:
Add token streaming via Server-Sent Events (SSE) for lower perceived latency on live LLMs, integrate a hybrid vector retrieval layer (BM25 + sqlite-vss) for scaling to hundreds of documents, and add an automated LLM-as-a-judge evaluation harness to continuously measure RAG faithfulness.
```

---

### Field 3: Video walkthrough (optional)
```text
(Optional - Leave blank or paste loom/youtube link if recorded)
```

---

### Field 4: How much time did you spend? (Required)
```text
80 minutes (including architecture design, RAG engine, automated test suite, UI refinement, and documentation).
```

---

### Field 5: What tools did you use? (Required)
```text
- AI Assistant: Antigravity agent (Google DeepMind) for architecture design, rapid scaffolding, and visual auditing.
- Model Inference: Google Gemini API / OpenAI API client with deterministic offline fallback.
- Runtime & Testing: Node.js native modules (`node:http`, `node:test`, `node:assert` for zero-install instant execution).
- Styling & Interface: Plus Jakarta Sans typography, semantic CSS custom properties, and accessible inline SVGs.
```

---

### Field 6: What is unfinished or limited? (Required)
```text
1. Vector Retrieval Scaling: With 3 documents, full-context injection in prompt or keyword routing is 100% reliable and avoids chunking retrieval misses. For larger catalogs (50+ docs), a hybrid dense/sparse vector index (e.g. pgvector or SQLite-vss) would be necessary.
2. Single-Turn Interaction: The current interface focuses on single-turn Q&A. A production evolution would include multi-turn conversational session memory and context truncation.
3. Streaming Responses: Output is currently delivered as a validated JSON object rather than token-by-token streaming via SSE.
```
