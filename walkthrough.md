# Walkthrough: BrightPath Learn AI Help Desk

We have designed, implemented, tested, and verified the complete **BrightPath Learn AI Help Desk** practical test submission, styled with **Palletism's Graphite Sketch** taste pack.

---

## 1. Project Overview & Architecture

- **Project Location**: `brightpath-ai-helpdesk/` (inside `c:\Users\User\OneDrive\Desktop\Web Development\brightpath-ai-helpdesk`)
- **Git State**: Clean repository initialized, with all code, tests, and documentation committed.
- **Dependencies**: 100% native Node.js (no npm dependencies, zero-install instant startup).
- **Design System**: Palletism's `graphite-sketch` taste pack (`.palletism/taste.json`), featuring:
  - Palette: Paper (`#FFFFFF`), Graphite Ink (`#2B2B2B`), Soft Graphite (`#7A7A7A`), and Hatching (`#C9C9C9`).
  - Typography: `Cormorant Garamond` (headings) and `Literata` (body).
  - Anti-AI aesthetic with calm, editorial naturalist sketchbook feel and zero emojis.

---

## 2. Test Verification & Visual Evidence

### Scenario 1: Supported Question
- **Query**: *"When do group coaching sessions take place and where do I find the link?"*
- **Answer**: *"Group coaching sessions take place every Tuesday at 16:00 UTC. The link appears on the Coaching page 30 minutes before the session, and recordings are added within 24 hours."*
- **Citation**: `Document 2 — Coaching and feedback`
- **Status**: `✓ Verified Grounded Answer`

---

### Scenario 2: Unknown / Out-of-Scope Question
- **Query**: *"How much does BrightPath Learn cost, and what are the refund rules?"*
- **Answer**: *"This information is not available in the supplied BrightPath Learn documents. For questions regarding pricing, refund rules, or job placement promises, please contact our support team at support@brightpath.example (available Monday to Friday, 09:00–17:00 UTC)."*
- **Citation**: `Document 3 — Account help` (strict negative constraint)
- **Status**: `Information Missing / Refused`

---

### Scenario 3: API / Model Failure Condition
- **Action**: Toggled **"Simulate API Failure"** switch to ON.
- **HTTP Code**: `503 Service Unavailable`
- **Error UI**: Clean error banner explaining the outage with a recovery tip and an interactive **Retry Request** button.

---

## 3. Automated Test Suite Results

Ran `npm test` using Node's native test runner:
```text
▶ BrightPath Learn AI Help Desk Test Battery
  ✔ Document Loading: Loads all 3 required reference documents (4.01ms)
  ✔ Scenario 1 (Supported Question): Group coaching schedule and links (3.59ms)
  ✔ Scenario 1 (Supported Question - Doc 1): Progress saving and lesson order (0.82ms)
  ✔ Scenario 2 (Unknown Question): Pricing, refunds, and out-of-scope policies (1.28ms)
  ✔ Scenario 3 (Failure Condition): Simulated upstream API failure handling (0.98ms)
  ✔ Security & Account Policy: Password reset and never requesting passwords (0.79ms)
✔ BrightPath Learn AI Help Desk Test Battery (21.15ms)
ℹ tests 7 | pass 7 | fail 0
```
