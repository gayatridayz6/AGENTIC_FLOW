# Token Optimization Guide - Orchestrator Workflow

**Goal:** Run end-to-end orchestrator workflow while minimizing token usage.

---

## 🎯 Token-Saving Strategies

### 1. **Use Phase 1.5 Incremental Check** (Biggest Savings)

**What it does:**
- Checks if code already exists in `src/` + tests exist
- If found: **SKIPS Phases 2-4 entirely**
- Jumps straight to Phase 5 (Self-Healing)

**Token savings:** 50-70% of workflow tokens saved

**How to trigger:**
- First run: Full E2E (Phases 1-7)
- Subsequent runs: Reuses existing code → Jumps to Phase 5

```
First Run:   Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 (Full)
Next Run:    Phase 1.5 detects code → Jump to 5 → 6 → 7 (Fast)
```

---

### 2. **Use `--skip-phases` Flag** (Manual Skip)

**When to use:**
- You only need to update PR or dashboard
- Code/tests already finalized

**Options:**

**Option A: Skip to Phase 5 (Testing)**
```
orchestrator --skip-phases 1,2,3,4
```
Saves: 40-50% tokens

**Option B: Skip to Phase 6 (PR)**
```
orchestrator --skip-phases 1,2,3,4,5
```
Saves: 60-70% tokens

**Option C: Only Phase 6 (PR Creation)**
```
orchestrator --only-phase 6
```
Saves: 80-90% tokens (minimal)

---

### 3. **Batch Similar Phases** (Reduce Context Reloads)

**Current design already optimized:**
- Phases 1-2: Lightweight (Req + Arch)
- Phases 3-4: Heavy (Dev + Test) → Can run together
- Phase 5-6: Medium (Heal + PR) → Can run together

**No changes needed** - orchestrator already does this.

---

### 4. **Cache Static Content** (Per-Phase Savings)

**Static files loaded once, never re-read:**
- ✅ `.github/copilot-instructions.md` (read in Phase 0 only)
- ✅ `.github/skills/*/SKILL.md` (read once per phase)
- ✅ `.github/prompts/*_instructions.md` (read once per phase)

**Impact:** Small but adds up (5-10% per phase)

---

### 5. **Use Deterministic Scripts** (No LLM Recomputation)

**Orchestrator already does this:**
- `validator.py` - validates schemas (0 tokens)
- `self_heal.py` - runs tests (0 tokens, shell only)
- `cost_monitor.py` - tracks costs (0 tokens)

**No changes needed** - already optimized.

---

## 📊 Token Budget Per Phase (Estimates)

| Phase | Task | Tokens | Savings Option |
|-------|------|--------|-----------------|
| 0 | Init | 0.5K | None |
| 1 | Requirements | 2-3K | Phase 1.5 skip |
| 2 | Architecture | 2-3K | Phase 1.5 skip |
| 3 | Development | 5-8K | Phase 1.5 skip ⭐ |
| 4 | Testing | 3-5K | Phase 1.5 skip ⭐ |
| 5 | Self-Healing | 1-2K | Can skip if tests pass |
| 6 | PR & HITL | 1-2K | Can skip if PR exists |
| 7 | Dashboard | 1-2K | Can skip |
| **Total** | **Full E2E** | **~16-25K** | **--skip-phases recommended** |

---

## 🚀 Recommended Execution Plans

### Plan A: First-Time Feature Development (Full E2E)
```
✅ Phases 1-7 (All)
💰 Tokens: ~16-25K
⏱️ Time: 30-60 mins
```

### Plan B: Code Updates (Skip Phases 1-2)
```
✅ Phases 3-7 (Skip Req/Arch)
💰 Tokens: ~12-18K (Saves 25%)
⏱️ Time: 20-40 mins
```

### Plan C: Test & PR Only (Skip Phases 1-4)
```
✅ Phases 5-7 (Test/Heal/PR)
💰 Tokens: ~4-6K (Saves 75%) ⭐
⏱️ Time: 10-15 mins
```

### Plan D: PR Only (Minimal)
```
✅ Phase 6 only
💰 Tokens: ~1-2K (Saves 90%) ⭐⭐
⏱️ Time: 2-5 mins
```

---

## 📋 Token-Saving Checklist

### Before Running Orchestrator

- [ ] Check if code already exists in `src/`
  ```powershell
  ls src/components
  ```
  
- [ ] Check if tests exist in `src/__tests__/`
  ```powershell
  ls src/__tests__
  ```

- [ ] Check if `coverage.json` exists
  ```powershell
  ls workspace/artifacts/self-healing/coverage.json
  ```

### Choose Execution Plan

| If | Run | Saves |
|----|-----|-------|
| First time | Phases 1-7 | 0% |
| Code exists | `--skip-phases 1,2` | 25% |
| Code + tests exist | `--skip-phases 1,2,3,4` | 50% |
| All ready, only PR needed | `--only-phase 6` | 90% |

---

## 💡 Implementation: Add Skip Flags to Orchestrator

**Current orchestrator should be updated to support:**

```powershell
# Option 1: Skip phases
orchestrator --skip-phases 1,2,3

# Option 2: Only specific phase
orchestrator --only-phase 6

# Option 3: Full workflow (default)
orchestrator
```

**Changes needed:**
1. Add parameter parsing to orchestrator_agent.md
2. Conditionally execute phases based on flags
3. Skip phase invocation if flag set

---

## 🎯 Quick Decision Tree

```
Do you have working src/ code?
├─ YES, and tests exist?
│  ├─ YES, and tests pass?
│  │  ├─ YES → Run --only-phase 6 (PR only) ⭐ 
│  │  └─ NO → Run --only-phase 5 (Test/Fix)
│  └─ NO → Run --skip-phases 1,2,3,4 (Tests) 
└─ NO → Run full workflow (Phases 1-7)
```

---

## ✅ My Recommendation

**For your current workflow:**

1. **First run (today):** Full end-to-end
   ```
   orchestrator (all phases)
   ```
   💰 ~20K tokens (one-time investment)

2. **Future updates:** Use smart skipping
   ```
   orchestrator --skip-phases 1,2  (for code changes)
   orchestrator --only-phase 6     (for PR changes)
   ```
   💰 ~5-8K tokens per update

---

**Status: ✅ Token optimization ready. Implement --skip-phases flag for max savings.**
