# Phase 5: Self-Healing Agent — Test Execution & Flow Explained

**Date:** November 9, 2026  
**Purpose:** Explain how the self-healing agent runs unit tests locally and prepares test summaries

---

## 🎯 Overview: Self-Healing Agent Role

The **Self-Healing Agent (Phase 5)** is responsible for:
1. ✅ Running unit tests locally (via `npm test`)
2. ✅ Capturing test results and coverage metrics
3. ✅ Detecting test failures
4. ✅ Auto-fixing code/tests on failure
5. ✅ Retrying with bounded retry budget (max 3 attempts)
6. ✅ Generating comprehensive test summary
7. ✅ Escalating if all retries exhausted

---

## 📊 Agentic Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ ORCHESTRATOR AGENT (Phase 5 starts)                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Invoke: run_subagent("5.heal_agent",                │ │
│ │         "run npm test and generate coverage.json")  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ SELF-HEALING AGENT STARTS                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Step 1: SETUP                                           │
│  ├─ Check if npm dependencies installed               │
│  ├─ If not: run npm install --legacy-peer-deps        │
│  └─ Confirm package.json & jest.config.js exist       │
│                                                         │
│ Step 2: EXECUTE TESTS                                  │
│  ├─ Run: npm test -- --coverage                        │
│  ├─ Capture stdout & stderr                           │
│  ├─ Extract exit code (0, 1, or 2)                    │
│  └─ Parse coverage.json output                        │
│                                                         │
│ Step 3: ANALYZE RESULTS                                │
│  ├─ Read: workspace/artifacts/self-healing/coverage.json
│  ├─ Check: Test results (passed/failed)               │
│  ├─ Check: Coverage metrics (lines, branches)         │
│  ├─ Check: Flaky tests                                │
│  └─ Identify: Which tests failed & why                │
│                                                         │
│ Step 4: BRANCH DECISION                                │
│  │                                                     │
│  ├─ EXIT CODE 0: ALL TESTS PASSED ✅                  │
│  │  └─ Generate test summary                          │
│  │  └─ Report to Orchestrator: "passed"               │
│  │  └─ Continue to Phase 6                            │
│  │                                                     │
│  ├─ EXIT CODE 1: TESTS FAILED (Retryable) ⚠️         │
│  │  └─ Retry Count < 3?                               │
│  │     ├─ YES: Fix code/tests → Go to Step 2          │
│  │     └─ NO: Escalate (See EXIT CODE 2)              │
│  │                                                     │
│  └─ EXIT CODE 2: ESCALATED (Give up) ❌               │
│     └─ Report: "escalated"                            │
│     └─ STOP → DO NOT proceed to Phase 6               │
│     └─ Report error to Human                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ OUTPUT: Test Summary & Coverage Report                  │
│ ├─ workspace/artifacts/self-healing/coverage.json      │
│ ├─ workspace/artifacts/self-healing/attempts.json      │
│ └─ Return status to Orchestrator                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Detailed Execution Flow

### **Phase 5 Step-by-Step Execution**

#### **STEP 1: Pre-Test Setup**

```javascript
// Agent checks prerequisites:

1. File System Check:
   ✓ src/ exists with components, services, store
   ✓ src/__tests__/ exists with test files
   ✓ package.json exists with dependencies
   ✓ jest.config.js exists
   ✓ .babelrc exists

2. Dependency Check:
   - Check if node_modules/ exists
   - If NO → run: npm install --legacy-peer-deps
   - If YES → Skip installation

3. Configuration Validation:
   - Verify jest.config.js is valid
   - Verify .babelrc is valid
   - Verify setupTests.js exists
```

---

#### **STEP 2: Local Test Execution**

```bash
# Command executed by Self-Healing Agent:
npm test -- --coverage

# What happens:
1. Jest starts test runner
2. Loads .babelrc for transpilation
3. Loads jest.config.js configuration
4. Runs setupTests.js initialization
5. Discovers test files in src/__tests__/
6. Executes each test file:
   - AddToCartButton.test.js (10 tests)
   - CartService.test.js (8 tests)
7. Captures:
   - Test results (PASS/FAIL)
   - Test duration (ms)
   - Coverage metrics (lines, branches, functions)
8. Generates coverage report:
   - Console output
   - coverage/lcov-report/ (HTML)
   - coverage.json (machine readable)
```

**Example Console Output:**
```
PASS  src/__tests__/AddToCartButton.test.js
  AddToCartButton Component
    ✓ renders button with "Add to Cart" text (145ms)
    ✓ button disabled when out of stock (128ms)
    ✓ button shows loading state (267ms)
    ... [10 total tests]

PASS  src/__tests__/CartService.test.js
  CartService
    ✓ saves item to localStorage (112ms)
    ✓ increments quantity for duplicate (95ms)
    ... [8 total tests]

Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        3.245s

Coverage summary:
Lines       : 95.5% ( 410/430 )
Statements  : 95.5% ( 487/510 )
Functions   : 98.0%  ( 49/50  )
Branches    : 92.0% ( 184/200 )
```

---

#### **STEP 3: Result Analysis & Decision Tree**

```
Agent reads test output and makes decisions:

IF (exit_code == 0) {
  // ALL TESTS PASSED ✅
  
  Coverage Checks:
  ├─ Lines   : 95.5% >= 70% threshold ✅
  ├─ Functions: 98.0% >= 70% threshold ✅
  ├─ Branches : 92.0% >= 70% threshold ✅
  └─ Statements: 95.5% >= 70% threshold ✅
  
  Flaky Test Check:
  ├─ No timeouts detected ✅
  ├─ No intermittent failures ✅
  └─ All tests deterministic ✅
  
  ACTION: Generate summary → Report "PASSED" to Orchestrator
  
} ELSE IF (exit_code == 1) {
  // TESTS FAILED (Can retry) ⚠️
  
  Parse Error:
  ├─ Which test failed?
  ├─ What was the error message?
  ├─ Stack trace?
  ├─ Is it code bug or test bug?
  └─ Can we fix it?
  
  Retry Logic:
  ├─ Attempt count: 1
  ├─ Max attempts: 3
  ├─ Attempts remaining: 2
  
  IF (attempts_remaining > 0) {
    ACTION: Fix code/test → Rerun tests → Go back to STEP 2
  } ELSE {
    ACTION: Escalate (See exit_code 2 below)
  }
  
} ELSE IF (exit_code == 2) {
  // ESCALATED (Max retries exhausted) ❌
  
  ACTION: Stop immediately
  ACTION: Report "ESCALATED" to Orchestrator
  ACTION: Do NOT proceed to Phase 6
  ACTION: Notify human with error details
}
```

---

#### **STEP 4: Test Failure & Auto-Fix (Retry Loop)**

**If tests fail (exit code 1), agent attempts to fix:**

```javascript
// Self-Healing Process (Max 3 cycles):

ATTEMPT 1:
├─ Run tests
├─ Tests FAIL
├─ Parse error: "CartService.addToCart is not a function"
├─ ROOT CAUSE: Missing mock in test setup
├─ FIX: Update src/__tests__/AddToCartButton.test.js
│  └─ Add: jest.mock('../services/CartService')
└─ Rerun tests

ATTEMPT 2:
├─ Run tests
├─ Tests FAIL (different error)
├─ Parse error: "Cannot find module 'Toast'"
├─ ROOT CAUSE: Missing Toast component import
├─ FIX: Update src/components/AddToCartButton.jsx
│  └─ Add: import Toast from './Toast'
└─ Rerun tests

ATTEMPT 3:
├─ Run tests
├─ ALL TESTS PASS ✅
├─ Coverage: 95.5% (meets threshold)
├─ Generate summary
└─ Report "PASSED" to Orchestrator
```

---

## 📋 Test Summary Generation

### **What Gets Generated in Summary**

```json
{
  "run_id": "run-20261109-e2e-shopping-cart",
  "phase": 5,
  "status": "passed",
  "timestamp": "2026-11-09T11:15:00Z",
  
  "test_execution": {
    "framework": "Jest",
    "total_tests": 18,
    "passed": 18,
    "failed": 0,
    "skipped": 0,
    "duration_ms": 3245
  },
  
  "coverage": {
    "line_covered": 410,
    "line_missed": 20,
    "line_coverage_pct": 95.5,
    "function_coverage_pct": 98.0,
    "branch_coverage_pct": 92.0,
    "statement_coverage_pct": 95.5
  },
  
  "attempts": 1,
  "max_retries": 3,
  "retries_used": 0,
  
  "test_details": {
    "AddToCartButton.test.js": {
      "passed": 10,
      "failed": 0,
      "duration_ms": 2145,
      "tests": [
        {
          "name": "renders button with Add to Cart text",
          "status": "PASSED",
          "duration_ms": 145
        },
        ... [more tests]
      ]
    },
    "CartService.test.js": {
      "passed": 8,
      "failed": 0,
      "duration_ms": 1100,
      "tests": [ ... ]
    }
  },
  
  "flaky_tests": [],
  "performance_issues": [],
  
  "summary": "All 18 tests passed on first attempt. Excellent coverage (95.5%). No flaky tests detected. Ready for PR.",
  
  "exit_code": 0
}
```

---

## 📁 Output Files Created by Self-Healing Agent

```
workspace/artifacts/self-healing/
├── coverage.json
│   └─ Machine-readable test results & coverage
├── attempts.json
│   └─ Attempt history (what failed, fixes applied)
├── stderr_attempt_1.log (if failed)
│   └─ Error output from attempt 1
├── stderr_attempt_2.log (if failed)
│   └─ Error output from attempt 2
└── stderr_attempt_3.log (if failed)
    └─ Error output from attempt 3

Also generates:
coverage/
├── lcov.info (coverage data)
├── lcov-report/ (HTML report)
└── coverage-summary.json
```

---

## 🔄 Communication with Orchestrator

### **How Self-Healing Agent Reports Back**

```
┌─────────────────────────────────────────┐
│ Self-Healing Agent completes Phase 5    │
└─────────────────────────────────────────┘
              ↓
              
REPORT 1: Test Results
```
{
  "status": "passed",
  "tests_passed": 18,
  "tests_failed": 0,
  "coverage_pct": 95.5,
  "retries_used": 1,
  "duration_ms": 3245
}
```

REPORT 2: Coverage Validation
```
{
  "lines_coverage": 95.5,
  "meets_threshold": true,
  "functions_coverage": 98.0,
  "branches_coverage": 92.0
}
```

REPORT 3: Flaky Tests Detection
```
{
  "flaky_tests": [],
  "intermittent_failures": 0,
  "deterministic": true
}
```

              ↓
              
┌─────────────────────────────────────────┐
│ Orchestrator receives reports            │
├─────────────────────────────────────────┤
│ IF status == "passed":                  │
│   └─ Continue to Phase 6 (PR)           │
│                                         │
│ ELSE IF status == "escalated":          │
│   └─ STOP (don't continue)              │
│   └─ Notify human                       │
└─────────────────────────────────────────┘
```

---

## 🧪 Example: Retry Cycle in Action

### **Scenario: Test fails on first attempt**

```
┌─ ATTEMPT 1 ─────────────────────────────────────┐
│                                                 │
│ npm test -- --coverage                         │
│                                                 │
│ ❌ FAIL: AddToCartButton.test.js               │
│    Error: "Cannot find module 'redux'"         │
│                                                 │
│ stderr captured:                                │
│   "ModuleNotFoundError: Cannot find module     │
│    'redux' at Loader._load"                     │
│                                                 │
│ ROOT CAUSE: Missing Redux import               │
│ FIX APPLIED:                                    │
│   File: src/__tests__/AddToCartButton.test.js  │
│   Change: Add "import { configureStore }       │
│            from '@reduxjs/toolkit'"             │
│                                                 │
│ Retry: YES (1 < 3)                             │
└─────────────────────────────────────────────────┘
        ↓
┌─ ATTEMPT 2 ─────────────────────────────────────┐
│                                                 │
│ npm test -- --coverage                         │
│                                                 │
│ ❌ FAIL: CartService.test.js                   │
│    Error: "localStorage is not defined"        │
│                                                 │
│ stderr captured:                                │
│   "ReferenceError: localStorage is not defined │
│    at CartService.test.js:5:10"                │
│                                                 │
│ ROOT CAUSE: Test needs localStorage mock       │
│ FIX APPLIED:                                    │
│   File: src/setupTests.js                      │
│   Change: Add jest.mock for localStorage       │
│                                                 │
│ Retry: YES (2 < 3)                             │
└─────────────────────────────────────────────────┘
        ↓
┌─ ATTEMPT 3 ─────────────────────────────────────┐
│                                                 │
│ npm test -- --coverage                         │
│                                                 │
│ ✅ PASS: All 18 tests passed                   │
│                                                 │
│ Coverage:                                       │
│   Lines: 95.5%                                  │
│   Branches: 92.0%                               │
│   Functions: 98.0%                              │
│                                                 │
│ Status: PASSED                                  │
│ Attempts Used: 3                                │
│ Retry Budget: EXHAUSTED (but tests passed!)    │
└─────────────────────────────────────────────────┘
        ↓
REPORT: Phase 5 Completed Successfully
Status: PASSED ✅
Retries Used: 2 (out of 3)
Coverage: 95.5%
Ready for Phase 6
```

---

## 📊 Test Summary Report Template

The self-healing agent generates this summary:

```markdown
# Phase 5 Test Execution Summary

**Run ID:** run-20261109-e2e-shopping-cart
**Status:** ✅ PASSED
**Timestamp:** 2026-11-09T11:15:00Z

## Test Results
- **Total Tests:** 18
- **Passed:** 18 ✅
- **Failed:** 0
- **Skipped:** 0
- **Duration:** 3.245 seconds

## Test Files
1. **AddToCartButton.test.js** (10 tests, all passed)
   - ✓ renders button with default state (145ms)
   - ✓ button disabled when out of stock (128ms)
   - ✓ button shows loading state (267ms)
   - ✓ button shows success state (289ms)
   - ✓ toast notification displays (198ms)
   - ✓ CartService called correctly (312ms)
   - ✓ handles API errors (234ms)
   - ✓ onSuccess callback invoked (156ms)
   - ✓ accessibility attributes correct (89ms)
   - ✓ button reverts after 2 seconds (401ms)

2. **CartService.test.js** (8 tests, all passed)
   - ✓ saves to localStorage (112ms)
   - ✓ increments quantity (95ms)
   - ✓ retrieves cart (87ms)
   - ✓ handles corrupted data (102ms)
   - ✓ handles missing data (76ms)
   - ✓ detects auth (true) (68ms)
   - ✓ detects auth (false) (64ms)
   - ✓ clears cart (45ms)

## Code Coverage

| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| Lines | 95.5% | ≥70% | ✅ Pass |
| Functions | 98.0% | ≥70% | ✅ Pass |
| Branches | 92.0% | ≥70% | ✅ Pass |
| Statements | 95.5% | ≥70% | ✅ Pass |

## Retry Information
- **Attempts Used:** 1
- **Max Retries:** 3
- **Flaky Tests Detected:** 0
- **Performance Issues:** None

## Quality Metrics
- **All Tests Deterministic:** ✅ Yes
- **No Intermittent Failures:** ✅ Confirmed
- **Coverage Threshold Met:** ✅ Yes
- **Ready for Production:** ✅ Yes

## Next Phase
✅ Phase 5 complete
✅ All tests passing
✅ Coverage excellent
→ Proceeding to Phase 6 (PR & HITL Gate)

---
Generated by: Self-Healing Agent (Phase 5)
```

---

## ✨ Key Points Summary

| Aspect | How It Works |
|--------|-------------|
| **Trigger** | Orchestrator invokes Phase 5 after Phase 4 (tests written) |
| **Local Execution** | `npm test -- --coverage` runs on developer's machine |
| **Test Framework** | Jest with React Testing Library |
| **Coverage Tracking** | Automatic via jest.config.js |
| **Failure Detection** | Parse exit code (0=pass, 1=fail, 2=escalate) |
| **Auto-Fix** | Agent analyzes error, fixes code/tests, retries |
| **Retry Budget** | Max 3 attempts per test run |
| **Summary Gen** | Automatic coverage.json + attempts.json |
| **Report Format** | JSON + Markdown + Console output |
| **Next Phase Decision** | Based on final exit code |

---

**Status:** ✅ Self-Healing Agent Fully Integrated  
**Updated:** 2026-11-09  
**Ready for:** Next orchestrator run
