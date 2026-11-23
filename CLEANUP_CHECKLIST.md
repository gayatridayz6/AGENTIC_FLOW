# Cleanup Checklist - Before Running Workflow

## Testing Artifacts to Clean Up

### ✅ REVERTED/CLEANED

| Item | Status | Action |
|------|--------|--------|
| `6.pr_agent.md` | ✅ Reverted | Testing section removed |
| `6_pr_agent_workflow.ps1` | ✅ Deleted | Test helper script removed |
| `.mcp.json` | ✅ Token embedded | Keep as-is (for workflow to use) |

### ⚠️ NEEDS REVIEW

| Item | Status | Action |
|------|--------|--------|
| `state/.approval` | Check | **Should NOT exist** - Only human creates this during workflow |
| Test artifacts in `workspace/artifacts/pr/` | Check | Can keep or clean (will be regenerated) |

### Optional Cleanup (Test Artifacts)

These can be deleted (they'll be regenerated during workflow):
- `workspace/artifacts/pr/pr_meta.json` (old test data)
- `workspace/artifacts/pr/pr_creation_*.json` (test files)
- `workspace/artifacts/pr/PR_*.md` (test reports)
- `workspace/artifacts/orchestrator/PHASE6_*.md` (test reports)

### Keep for Reference (Do NOT delete)

- `.github/agents/orchestrator_agent.md` - Main orchestrator
- `.github/agents/6.pr_agent.md` - Reverted PR agent (production-ready)
- `.github/prompts/pr_instructions.md` - PR instructions
- `scripts/` - All helper scripts

---

## Status: READY FOR WORKFLOW

✅ **6.pr_agent is reverted to production state**
✅ **Test helper files removed**
✅ **Token embedded in .mcp.json (ready for orchestrator)**

**Next Step:** Run the full orchestrator workflow to create PR properly.

```powershell
# When ready, run:
run_subagent("orchestrator_agent", "story_id=SHOPPING-CART-ADD-BTN")
```

This will:
1. Phase 1-4: Generate requirements, architecture, code, tests
2. Phase 5: Run npm test (self-healing)
3. Phase 6: Create PR (will prompt for HITL approval)
4. Phase 7: Generate dashboard

---

## Token Optimization

**See: TOKEN_OPTIMIZATION_GUIDE.md**

### Quick Summary
- **Full E2E (first time):** ~20K tokens (all phases 1-7)
- **Code updates:** ~12K tokens (skip phases 1-2)
- **PR only:** ~2K tokens (phase 6 only)

Use Phase 1.5 incremental check → skips Phases 2-4 if code exists = **50-70% token savings**
