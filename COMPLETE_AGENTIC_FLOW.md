# Complete Agentic Flow: From Story to Test Results

**Visual Guide:** How all agents work together in the orchestrator pipeline

---

## 📊 Complete End-to-End Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         HUMAN: Provides Story                            │
│               "Add to Cart button on product listing"                    │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR AGENT (Phase 0 - Initialize)                               │
│ ├─ Load .github/copilot-instructions.md                                 │
│ ├─ Create state/run.json                                                │
│ ├─ Create state/summary.md                                              │
│ └─ Status: Ready to start pipeline                                      │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: REQUIREMENTS AGENT                                             │
│                                                                          │
│ Input:  Story details (user-provided)                                   │
│ Agent:  run_subagent("1.req_agent", story_text)                         │
│                                                                          │
│ Output: workspace/artifacts/requirement/spec.json                       │
│ Contains:                                                               │
│  ├─ story_id                                                            │
│  ├─ title & description                                                 │
│  ├─ acceptance_criteria (6 ACs)                                         │
│  ├─ technical_requirements                                              │
│  ├─ definition_of_done                                                  │
│  └─ business_value                                                      │
│                                                                          │
│ Validation: python scripts/validator.py spec spec.json                  │
│ Status: ✅ PASSED                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: ARCHITECTURE AGENT                                             │
│                                                                          │
│ Input:  spec.json (from Phase 1)                                        │
│ Agent:  run_subagent("2.arch_agent", spec_path)                         │
│                                                                          │
│ Output: workspace/artifacts/architecture/design.json                    │
│ Contains:                                                               │
│  ├─ Component architecture (7 components)                               │
│  ├─ Data flow diagrams                                                  │
│  ├─ API contracts                                                       │
│  ├─ State management design                                             │
│  ├─ Error handling strategy                                             │
│  └─ Security considerations                                             │
│                                                                          │
│ Validation: python scripts/validator.py design design.json              │
│ Status: ✅ PASSED                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: DEVELOPMENT AGENT                                              │
│                                                                          │
│ Input:  design.json + spec.json                                         │
│ Agent:  run_subagent("3.dev_agent", design_path, spec_path)             │
│                                                                          │
│ Outputs:                                                                │
│ LIVE CODE in src/ directory:                                            │
│  ├─ src/components/                                                     │
│  │  ├─ AddToCartButton.jsx (123 lines)                                  │
│  │  ├─ ProductCard.jsx (48 lines)                                       │
│  │  └─ Toast.jsx (35 lines)                                             │
│  ├─ src/services/                                                       │
│  │  └─ CartService.js (135 lines)                                       │
│  ├─ src/store/                                                          │
│  │  ├─ cartSlice.js (75 lines)                                          │
│  │  └─ index.js (15 lines)                                              │
│  ├─ src/App.jsx (85 lines)                                              │
│  ├─ public/index.html                                                   │
│  └─ package.json (with all dependencies)                                │
│                                                                          │
│ Also generates:                                                         │
│  ├─ jest.config.js (test config)                                        │
│  ├─ .babelrc (transpiler config)                                        │
│  └─ CSS files for styling                                               │
│                                                                          │
│ Isolation check: Verify writes to src/                                  │
│ Status: ✅ PASSED                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: TESTING AGENT                                                  │
│                                                                          │
│ Input:  src/ code (from Phase 3)                                        │
│ Agent:  run_subagent("4.test_agent", spec_path, dev_path)               │
│                                                                          │
│ Outputs:                                                                │
│ TEST CODE in src/__tests__/ directory:                                  │
│  ├─ src/__tests__/AddToCartButton.test.js                               │
│  │  └─ 10 test cases                                                    │
│  └─ src/__tests__/CartService.test.js                                   │
│     └─ 8 test cases                                                     │
│                                                                          │
│ Also generates:                                                         │
│  ├─ setupTests.js (Jest initialization)                                 │
│  └─ Test utilities                                                      │
│                                                                          │
│ Total: 18 test cases (Jest + React Testing Library)                     │
│ Status: ✅ PASSED                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: SELF-HEALING AGENT ⭐ (THE KEY PHASE)                           │
│                                                                          │
│ Input:  src/ + src/__tests__/                                           │
│ Agent:  run_subagent("5.heal_agent", "run npm test")                    │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 1: PRE-TEST SETUP                                            │ │
│ │ ├─ Check if node_modules exists                                  │ │
│ │ ├─ Run: npm install --legacy-peer-deps (if needed)               │ │
│ │ └─ Verify package.json, jest.config.js, .babelrc                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 2: EXECUTE TESTS LOCALLY                                     │ │
│ │                                                                   │ │
│ │ Command: npm test -- --coverage                                  │ │
│ │                                                                   │ │
│ │ Jest starts:                                                     │ │
│ │  ├─ Loads .babelrc (transpile JSX to JS)                         │ │
│ │  ├─ Loads jest.config.js (test configuration)                   │ │
│ │  ├─ Runs setupTests.js (initialize mocks)                       │ │
│ │  ├─ Discovers test files in src/__tests__/                      │ │
│ │  ├─ Runs AddToCartButton.test.js (10 tests)                     │ │
│ │  ├─ Runs CartService.test.js (8 tests)                          │ │
│ │  └─ Generates coverage report                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 3: ANALYZE RESULTS                                           │ │
│ │                                                                   │ │
│ │ Parse Coverage Metrics:                                          │ │
│ │  ├─ Lines: 95.5% ✅ (threshold: 70%)                             │ │
│ │  ├─ Functions: 98.0% ✅                                          │ │
│ │  ├─ Branches: 92.0% ✅                                           │ │
│ │  └─ Statements: 95.5% ✅                                         │ │
│ │                                                                   │ │
│ │ Test Results:                                                    │ │
│ │  ├─ Passed: 18 tests ✅                                          │ │
│ │  ├─ Failed: 0 tests                                              │ │
│ │  └─ Exit Code: 0 (SUCCESS)                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 4: GENERATE TEST SUMMARY                                     │ │
│ │                                                                   │ │
│ │ Creates: workspace/artifacts/self-healing/coverage.json          │ │
│ │ Contains:                                                        │ │
│ │  ├─ Test execution results (18/18 passed)                        │ │
│ │  ├─ Coverage metrics (95.5% lines)                               │ │
│ │  ├─ Test durations (3.2 seconds total)                           │ │
│ │  ├─ No flaky tests detected                                      │ │
│ │  ├─ Retry attempts (1 out of 3)                                  │ │
│ │  └─ Ready for production status                                  │ │
│ │                                                                   │ │
│ │ Also creates: attempts.json, stderr logs (if failed)             │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                          │
│ Decision Tree:                                                         │
│                                                                         │
│ IF (exit_code == 0):                                                    │
│   └─ All tests PASSED ✅                                               │
│      └─ Report to Orchestrator: "PASSED"                              │
│      └─ → Continue to Phase 6                                         │
│                                                                         │
│ ELSE IF (exit_code == 1):                                              │
│   └─ Some tests FAILED ⚠️                                              │
│      ├─ Retry < 3?                                                    │
│      │  ├─ YES: Fix code → Rerun tests → STEP 2                       │
│      │  └─ NO: Escalate (exit_code 2)                                 │
│                                                                         │
│ ELSE IF (exit_code == 2):                                              │
│   └─ Tests ESCALATED ❌                                                 │
│      └─ Report to Orchestrator: "ESCALATED"                           │
│      └─ STOP → Do NOT proceed to Phase 6                              │
│                                                                         │
│ Status: ✅ PASSED (18/18 tests, 95.5% coverage)                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: PR & HITL GATE                                                 │
│                                                                          │
│ Input:  All artifacts from Phase 1-5                                    │
│ Agent:  run_subagent("6.pr_agent", "prepare PR")                        │
│                                                                          │
│ Outputs:                                                                │
│  └─ workspace/artifacts/pr/pr_meta.json                                 │
│     ├─ PR title & description                                           │
│     ├─ Files changed (4 files)                                          │
│     ├─ Test summary (18/18 passed)                                      │
│     ├─ Coverage report (95.5%)                                          │
│     └─ Acceptance criteria verification (6/6 ✅)                        │
│                                                                          │
│ HITL Gate Check:                                                        │
│  ├─ Check if state/.approval exists                                     │
│  ├─ If NO → PAUSE (wait for human approval)                             │
│  └─ If YES → Create actual PR                                           │
│                                                                          │
│ Status: ⏸ PAUSED (awaiting human approval)                              │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: OBSERVABILITY DASHBOARD                                        │
│                                                                          │
│ (Runs after Phase 6 approval)                                           │
│                                                                          │
│ Agent:  run_subagent("7.dashboard_agent", "generate dashboard")         │
│                                                                          │
│ Outputs:                                                                │
│  └─ workspace/artifacts/dashboard.html                                  │
│     ├─ Pipeline execution timeline                                      │
│     ├─ Test coverage chart                                              │
│     ├─ Cost analysis                                                    │
│     ├─ Phase statuses (all 7 phases)                                    │
│     └─ Retry cycles & attempts                                          │
│                                                                          │
│ Status: ✅ COMPLETED                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓

┌──────────────────────────────────────────────────────────────────────────┐
│                        FINAL OUTPUT                                      │
│                                                                          │
│ ✅ Live Code:           src/ (React components ready to run)             │
│ ✅ Tests:               src/__tests__/ (Jest tests)                      │
│ ✅ Test Results:        18/18 passed, 95.5% coverage                     │
│ ✅ Package Config:      package.json with npm commands                   │
│ ✅ Ready to Deploy:     npm start at localhost:3000                      │
│ ✅ Documentation:       SETUP_AND_TEST_RESULTS.md                        │
│ ✅ PR Metadata:         pr_meta.json (ready for review)                  │
│                                                                          │
│ Can now:                                                                │
│  → npm start (launch on http://localhost:3000)                           │
│  → npm test (run tests anytime)                                          │
│  → npm run build (production build)                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Self-Healing Agent in Context

### **Why Self-Healing is Important**

```
Without Self-Healing:
├─ Tests fail
├─ Developer manually investigates
├─ Developer manually fixes code
├─ Developer reruns tests manually
└─ Process is slow & error-prone

With Self-Healing Agent:
├─ Tests fail
├─ Agent automatically analyzes error
├─ Agent automatically suggests/applies fix
├─ Agent automatically reruns tests
├─ Process is fast & deterministic
└─ All captured in coverage.json
```

### **Key Responsibilities of Self-Healing Agent**

```
1️⃣  LOCAL TEST EXECUTION
    └─ npm install (if needed)
    └─ npm test -- --coverage
    └─ Capture all output

2️⃣  RESULT ANALYSIS
    └─ Parse exit code
    └─ Extract coverage metrics
    └─ Identify failing tests

3️⃣  AUTO-FIX (If tests fail)
    └─ Analyze error message
    └─ Determine root cause
    └─ Apply fix to code/tests
    └─ Rerun tests

4️⃣  RETRY MANAGEMENT
    └─ Track attempts (max 3)
    └─ Escalate if exhausted
    └─ Report to Orchestrator

5️⃣  TEST SUMMARY GENERATION
    └─ Generate coverage.json
    └─ Create attempts.json
    └─ Document test results
    └─ Prepare for Phase 6
```

---

## 📈 Test Summary Example

### **What Self-Healing Agent Reports**

```
Phase 5: Self-Healing Agent Report
═════════════════════════════════════════

Test Execution Summary:
  ✅ Total Tests: 18
  ✅ Passed: 18
  ✅ Failed: 0
  ✅ Skipped: 0
  ⏱️  Duration: 3.245 seconds

Code Coverage:
  ✅ Lines: 95.5% (threshold: 70%)
  ✅ Functions: 98.0% (threshold: 70%)
  ✅ Branches: 92.0% (threshold: 70%)
  ✅ Statements: 95.5% (threshold: 70%)

Retry Information:
  🔄 Attempts Used: 1 (out of 3)
  ✅ No Flaky Tests: Confirmed
  ✅ Deterministic: All tests repeatable
  ✅ Performance: All < 500ms

Test Files:
  ✅ AddToCartButton.test.js (10 tests, all PASSED)
  ✅ CartService.test.js (8 tests, all PASSED)

Final Status: ✅ PASSED
Next Phase: Phase 6 (PR & HITL Gate)

═════════════════════════════════════════
Generated: 2026-11-09T11:15:00Z
```

---

## ✨ Summary: How Self-Healing Works

| Aspect | Details |
|--------|---------|
| **Trigger** | Orchestrator → Phase 5 starts |
| **Setup** | Checks/installs dependencies (npm install) |
| **Execution** | Runs `npm test -- --coverage` locally |
| **Analysis** | Parses test results & coverage metrics |
| **Decision** | Exit code → 0 (pass), 1 (retry), 2 (escalate) |
| **Auto-Fix** | If fails: analyzes error, fixes code, retries |
| **Retries** | Max 3 attempts per run |
| **Summary** | Generates coverage.json with full details |
| **Output** | Test results, coverage, retry history |
| **Reports** | To Orchestrator for next phase |

---

**Status:** ✅ Complete Agentic Flow Explained  
**Updated:** 2026-11-09  
**Version:** 2.0 (React/Node.js Workflow)
