# Phase 5: Self-Healing Agent — Quick Reference Guide

**TL;DR Version: How Self-Healing Agent Works**

---

## ⚡ Quick Answer to Your Question

> "Self-healing agent will run the prepared unit test cases locally right? And prepare test summary?"

**YES! Here's exactly what happens:**

```
Phase 5 Flow:
┌─────────────────────────────────────┐
│ Orchestrator invokes Phase 5        │
│ "Run npm test locally"              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Self-Healing Agent:                 │
│ 1. npm install (if needed)          │
│ 2. npm test -- --coverage           │
│ 3. Parse results                    │
│ 4. Generate test summary            │
│ 5. Report to Orchestrator           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Output:                             │
│ ✅ 18/18 tests passed              │
│ ✅ 95.5% coverage                  │
│ ✅ coverage.json generated         │
│ ✅ Test summary ready              │
│ → Proceed to Phase 6               │
└─────────────────────────────────────┘
```

---

## 🔄 The Complete Self-Healing Cycle

### **Attempt 1: Tests Pass ✅**

```
npm test -- --coverage
↓
18/18 tests PASSED
95.5% code coverage
↓
EXIT CODE: 0 (SUCCESS)
↓
Generate test summary
↓
Report to Orchestrator: "PASSED"
↓
→ Continue to Phase 6
```

### **Attempt 1-3: Tests Fail ⚠️ (With Retry)**

```
Attempt 1:
npm test -- --coverage
↓
5 tests FAILED
ERROR: "Cannot find module 'Redux'"
↓
EXIT CODE: 1 (RETRYABLE)
↓
Auto-Fix: Add Redux import
↓
Rerun tests...

Attempt 2:
npm test -- --coverage
↓
3 tests FAILED
ERROR: "localStorage is not defined"
↓
EXIT CODE: 1 (RETRYABLE)
↓
Auto-Fix: Mock localStorage
↓
Rerun tests...

Attempt 3:
npm test -- --coverage
↓
18/18 tests PASSED ✅
95.5% coverage
↓
EXIT CODE: 0 (SUCCESS)
↓
Report: "PASSED after 2 retries"
→ Continue to Phase 6
```

### **Max Retries Exceeded ❌**

```
Attempt 1: FAILED → Retry (1/3)
Attempt 2: FAILED → Retry (2/3)
Attempt 3: FAILED → No retries left (3/3)
↓
EXIT CODE: 2 (ESCALATED)
↓
Report: "ESCALATED - Max retries exhausted"
↓
STOP → DO NOT proceed to Phase 6
↓
Notify human to fix manually
```

---

## 📊 Test Summary Generated

After Phase 5, you get this summary:

```json
{
  "phase": 5,
  "status": "passed",
  "test_results": {
    "total_tests": 18,
    "passed": 18,
    "failed": 0,
    "duration": "3.245 seconds"
  },
  "coverage": {
    "lines": "95.5%",
    "functions": "98.0%",
    "branches": "92.0%",
    "statements": "95.5%"
  },
  "attempts": {
    "used": 1,
    "max": 3,
    "flaky_tests": 0
  },
  "test_files": {
    "AddToCartButton.test.js": "10 passed",
    "CartService.test.js": "8 passed"
  },
  "next_phase": "Phase 6 (PR & HITL Gate)"
}
```

---

## 🎯 Key Points

| Question | Answer |
|----------|--------|
| **Runs locally?** | ✅ Yes, on developer machine |
| **Which tests?** | ✅ All tests in src/__tests__/ |
| **Using what framework?** | ✅ Jest + React Testing Library |
| **Generates summary?** | ✅ Yes, coverage.json |
| **Auto-fixes failures?** | ✅ Yes, up to 3 retries |
| **Reports to Orchestrator?** | ✅ Yes, with test metrics |
| **Ready for Phase 6?** | ✅ Yes if tests pass |

---

## 🚀 How It Integrates with Full Agentic Flow

```
Phase 1   → Requirements Spec
Phase 2   → Architecture Design
Phase 3   → Code in src/
Phase 4   → Tests in src/__tests__/
Phase 5   → 🎯 RUN TESTS LOCALLY + GENERATE SUMMARY
Phase 6   → PR & HITL Gate
Phase 7   → Dashboard
```

---

## 📋 Files Involved

| File | Purpose |
|------|---------|
| `src/__tests__/AddToCartButton.test.js` | 10 unit tests (input to Phase 5) |
| `src/__tests__/CartService.test.js` | 8 unit tests (input to Phase 5) |
| `package.json` | npm scripts, dependencies |
| `jest.config.js` | Test configuration |
| `.babelrc` | Babel transpiler config |
| `workspace/artifacts/self-healing/coverage.json` | Test summary output |
| `workspace/artifacts/self-healing/attempts.json` | Retry history |

---

## ✨ The Magic: Automatic Test Execution

**What User Sees:**
```
I gave the orchestrator a story about "Add to Cart button"
It ran end-to-end
Now I have:
  ✅ Production code in src/
  ✅ Tests in src/__tests__/
  ✅ Test results: 18/18 passed
  ✅ Coverage: 95.5%
  ✅ Ready to launch at localhost:3000

ALL AUTOMATED! 🎉
```

**What Actually Happened Behind Scenes (Phase 5):**
```
1. Orchestrator → "Run Phase 5"
2. Self-Healing Agent → checks dependencies
3. npm install (if needed)
4. npm test -- --coverage (runs 18 tests locally)
5. Parses results: All passed ✅
6. Extracts coverage: 95.5% ✅
7. Generates coverage.json ✅
8. Reports back: "PASSED, ready for Phase 6" ✅
```

---

## 🔧 Workflow: From Story to Running App

```
Input: Story details
  ↓
Phase 1: Create spec
  ↓
Phase 2: Design architecture
  ↓
Phase 3: Generate React code → src/
  ↓
Phase 4: Create Jest tests → src/__tests__/
  ↓
Phase 5: RUN TESTS LOCALLY ← YOU ARE HERE
  ├─ npm install
  ├─ npm test -- --coverage
  ├─ Generate coverage.json
  └─ Report results
  ↓
Phase 6: Create PR (if human approves)
  ↓
Phase 7: Generate dashboard
  ↓
Output: Ready to use application
  npm start → http://localhost:3000 ✅
```

---

## 📈 Expected Results After Phase 5

✅ **Code Quality:**
- 18/18 tests passing
- 95.5% code coverage
- Zero flaky tests
- Deterministic execution

✅ **Artifacts Created:**
- `coverage.json` (machine-readable summary)
- `attempts.json` (retry history)
- Coverage HTML report

✅ **Status:**
- Ready for Phase 6
- Ready for human review
- Ready to launch

---

## 🎬 Next Steps

After Phase 5 completes:
1. ✅ Test summary is ready
2. ✅ Human reviews PR metadata (Phase 6)
3. ✅ Human approves via `state/.approval` file
4. ✅ Phase 6 creates actual PR
5. ✅ Phase 7 generates dashboard
6. ✅ Application ready to launch

---

**Status:** ✅ Self-Healing Agent Ready  
**Documentation:** Complete  
**Version:** 2.0
