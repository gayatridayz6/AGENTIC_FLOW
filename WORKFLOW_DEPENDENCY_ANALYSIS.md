# Workflow Dependency Structure & Independence

**Question:** Should phases run sequentially (complete dependency) or independently?

**Answer:** **HYBRID MODEL** - Currently SEQUENTIAL, but can be made INDEPENDENT with proper input handling.

---

## Current Design: Sequential (Dependent)

```
Phase 1 (Requirements) 
       ↓ (outputs: spec.json)
Phase 2 (Architecture)
       ↓ (outputs: design.json)
Phase 3 (Development)
       ↓ (outputs: src/ code)
Phase 4 (Testing)
       ↓ (outputs: tests)
Phase 5 (Self-Healing)
       ↓ (outputs: coverage.json)
Phase 6 (PR)
       ↓
Phase 7 (Dashboard)
```

### Why Sequential is Smart
1. **Spec defines design** - Architecture needs requirements
2. **Design guides code** - Dev follows architecture
3. **Code needs tests** - Testing validates dev output
4. **Tests inform healing** - Failures trigger fixes
5. **Healing validates PR** - Coverage confirms quality
6. **PR shows results** - Dashboard summarizes

**Current Status:** ✅ Correct for end-to-end workflows

---

## Can Phases Run Independently? YES - With Smart Input

### Phase 1.5 Incremental Check
The orchestrator already has this logic:

```
IF (Phase 1.5 finds existing code in src/ AND existing tests):
    SKIP Phases 2-4
    JUMP to Phase 5 (Self-Healing)
```

This means:
- ✅ Phase 5 (Self-Healing) can run independently if code + tests already exist
- ✅ Phase 6 (PR) can run if coverage.json exists
- ✅ Phase 7 (Dashboard) can run if audit.jsonl exists

### How to Run Individual Phases

**To run Phase 6 (PR) independently:**
1. Ensure `workspace/artifacts/pr/pr_meta.json` exists with:
   - Title, branch, description
   - PR metadata complete
2. Ensure `state/.approval` exists (HITL gate)
3. Run: `run_subagent("6.pr_agent", "...inputs...")`

**To run Phase 5 (Self-Healing) independently:**
1. Ensure `src/` code exists
2. Ensure `src/__tests__/` tests exist
3. Run: `run_subagent("5.heal_agent", "...inputs...")`

---

## Recommended Architecture Changes

**Option A: Current (Keep Sequential)**
- ✅ Pros: Clear dependencies, no orphaned artifacts
- ❌ Cons: Slower end-to-end, must complete all phases
- **Use case:** Full feature development

**Option B: Add Independent Paths**
```
Path 1 (Full):     Phase 1 → 2 → 3 → 4 → 5 → 6 → 7
Path 2 (Code Fix): Phase 3 → 4 → 5 → 6 (skip 1,2 if spec/design exist)
Path 3 (PR Only):  Phase 6 (if all artifacts ready)
Path 4 (Test Only): Phase 5 (if code exists)
```

**Implementation:**
- Add `--skip-phases` parameter to orchestrator
- Add validation that required artifacts exist before running
- Add `--only-phase N` for single phase execution

**Example:**
```powershell
# Run only PR creation (assumes all prior phases done)
orchestrator --only-phase 6

# Run dev + testing (skip requirements/arch)
orchestrator --skip-phases 1,2

# Run full end-to-end
orchestrator
```

---

## What You Should Do

### Short Term (Now): Keep Current Sequential Design
✅ It's correct for feature development workflows
✅ Phase 1.5 incremental check already handles smart skipping
✅ Each phase properly depends on prior phase outputs

### Medium Term (Future): Add Independence Options
1. Make Phase 6 (PR) callable independently with:
   - Optional `--pr-only` flag
   - Validation that branch exists on GitHub
   - Validation that `pr_meta.json` exists
   
2. Make Phase 5 (Self-Healing) callable independently with:
   - Optional `--test-only` flag
   - Validation that `src/` code exists
   - Automatic `npm install`

3. Add input validators:
   ```powershell
   # Before running phase independently, check:
   - Required artifact exists
   - Required state exists
   - All inputs populated
   ```

---

## Decision: What Should Workflow Do?

| Scenario | Current | Recommended |
|----------|---------|-------------|
| Full feature (Req → Code → PR) | Sequential ✅ | Keep sequential |
| Code fix (update code, test, PR) | Must start from Phase 1 ❌ | Add --skip-phases flag |
| PR only (branch ready, create PR) | Must start from Phase 1 ❌ | Add --only-phase 6 flag |
| Test only (retest existing code) | Must start from Phase 1 ❌ | Add --only-phase 5 flag |

---

## My Recommendation

**The workflow is CORRECT as-is for complete feature development.**

But add optional independence:
```powershell
# Full workflow (current - keep this as default)
orchestrator

# Independent PR creation (new)
orchestrator --only-phase 6

# Independent testing (new)
orchestrator --only-phase 5

# Skip completed phases (new)
orchestrator --skip-phases 1,2,3  # Start from Phase 4 (Testing)
```

**To implement:** Add parameter parsing to orchestrator_agent.md and conditional phase execution.

---

**Current Status: ✅ SEQUENTIAL DESIGN IS CORRECT**

Do you want me to:
1. Keep it as-is (sequential only)
2. Add independent phase execution options
3. Something else?
