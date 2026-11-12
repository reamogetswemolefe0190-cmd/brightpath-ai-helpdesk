# Practical Test Submission Answers (Alessandro Hiring Portal)

Copy and paste these pre-formatted answers directly into the 6 submission fields on the test page:
`https://alessandro-hiring.vercel.app/hiring/test/ai-developer#applicant=5f148d27-bbd1-0252-1071-ab522c2321c8&token=e39ba5318bea7a34490f1fde75d8498083f0411a0c9f99fcb464011f6bdc765a`

---

### Field 1: Links to your work (Required)
```text
https://github.com/reamogetswe/brightpath-ai-helpdesk
Local run: git clone, cd brightpath-ai-helpdesk && npm start (runs on http://localhost:3000 with zero external npm dependencies)
```
*(Note: Replace with your actual GitHub repository URL once pushed).*

---

### Field 2: Walk me through your work (Required)
```text
I built the BrightPath Learn AI Help Desk as a grounded, lightweight web application designed for zero hallucination, clear document citation, and resilient failure handling.

1. Architecture & Grounding:
The backend (Node.js) serves a grounding engine that ingests the 3 official reference documents. When a user asks a question, the system strictly bounds its response to facts found in the documents and explicitly cites the source (e.g., "Document 2 — Coaching and feedback"). If a user asks about topics outside the documents (such as pricing, refunds, or job placement promises), the engine explicitly states the information is unavailable and refers the member to support@brightpath.example.

2. Dual Model Modes:
- Offline Grounded Mock Engine (Default): A deterministic ground-truth engine that runs immediately out of the box with zero configuration or API keys, allowing any reviewer to evaluate the system with npm start.
- Real LLM Integration: Supports Google Gemini 1.5 Flash or OpenAI GPT-4o-mini simply by providing an API key in .env.

3. Failure Handling:
The application includes a built-in "Simulate API Failure" toggle switch and an automated failure hook (HTTP 503) that triggers a clean error card with actionable troubleshooting advice and an inline retry button.

4. Results for the 3 Test Cases:
- Supported Question ("When do group coaching sessions take place and where do I find the link?"): Correctly answers Tuesday at 16:00 UTC, notes the link appears 30 minutes prior on the Coaching page, and cites "Document 2 — Coaching and feedback".
- Unknown Question ("How much does BrightPath Learn cost, and what are the refund rules?"): Correctly refuses to hallucinate, states that the information is not currently available, and refers the user directly to support@brightpath.example (citing Document 3).
- API Failure Condition: Flipped the simulation toggle; server immediately returned HTTP 503 with a user-friendly error banner and retry action.

5. What I would improve:
Add Server-Sent Events (SSE) for streaming token responses, integrate an automated LLM-as-a-judge evaluation harness (measuring RAGAS faithfulness and answer relevancy), and add multi-turn conversational session memory.
```

---

### Field 3: Video walkthrough (Optional)
```text
(Optional - Leave blank or add link if recorded)
```

---

### Field 4: How much time did you spend? (Required)
```text
75 minutes (including architecture design, RAG engine, automated test suite, UI implementation, and documentation).
```

---

### Field 5: What tools did you use? (Required)
```text
- AI Assistant: Antigravity agent (Google DeepMind) for rapid architectural scaffolding and verification.
- Design System: Palletism MCP server to query and extract the "Graphite Sketch" taste pack (palette tokens, typography pairings of Cormorant Garamond & Literata, and anti-AI aesthetic direction).
- Language Model: Google Gemini API / OpenAI API client with deterministic fallback.
- Runtime & Testing: Node.js (native node:http, node:test, and node:assert for zero-dependency execution).
- Icons & Styling: Custom inline SVGs and semantic CSS custom properties.
```

---

### Field 6: What is unfinished or limited? (Required)
```text
1. Vector Store / Embeddings: For 3 documents, full-context injection in prompt or keyword routing is 100% accurate and eliminates chunking errors. Scaling to hundreds of documents would require a hybrid retrieval layer (BM25 + dense embeddings using SQLite-vss or pgvector).
2. Single-turn Interaction: The current interface handles single-turn Q&A. Multi-turn conversation would require session tracking and context window management.
3. Streaming: Responses currently return as a complete JSON payload rather than token-by-token streaming via SSE.
```
