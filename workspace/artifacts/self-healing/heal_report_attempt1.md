# Heal Report - Attempt 1 (retry 1 of 3)

Phase: 5 Self-Healing (retry 1)
Classification: CONFIG (neither TEST nor CODE). Production code and tests are correct.

## Root cause
`npm_test_attempt1.log`: `Test Suites: 11 failed, 11 passed, 22 total; Tests: 268 passed, 268 total`.
- The 11 passing suites are the live tests in `src/__tests__/` (268 tests, coverage ~100% lines/functions, 99.15% branches).
- The 11 failing suites are the archive copies in `workspace/artifacts/test/src/__tests__/`. They fail with `Cannot find module '../store'`, `'../App'`, `'../components/...'` etc. because the archive has no sibling source.
- Root `jest.config.js` had no `roots` or ignore patterns, so Jest crawled `workspace/`.
- The log also shows `jest-haste-map: Haste module naming collision: shopping-cart-feature`, between root `package.json` and `workspace/artifacts/dev/package.json`.

## Change
Patch file: `workspace/artifacts/self-healing/patches/jest.config.js`. It is the root config plus three keys. All existing settings are unchanged.

```js
roots: ['<rootDir>/src'],
testPathIgnorePatterns: ['/node_modules/', '<rootDir>/workspace/', '<rootDir>/coverage/'],
modulePathIgnorePatterns: ['<rootDir>/workspace/', '<rootDir>/coverage/'],
```

The orchestrator should copy the patch over the root `jest.config.js`. I did not modify any root file.

## Verification
Patch check (already run): `npx jest --config workspace/artifacts/self-healing/patches/jest.config.js --rootDir . --coverage=false --listTests`
- It listed exactly 11 files, all under `src/__tests__/`.
- No `workspace/` path appeared.

Orchestrator check after applying the patch:
`npx jest --coverage` (expect: Test Suites 11 passed / 11 total, Tests 268 passed, no haste-map collision warning, 70% thresholds met)

## learned_patterns digest
```json
{"flaky_tests": [], "last_run_notes": "Attempt 1 had 11 spurious failing suites from workspace/artifacts/test archive copies (missing sibling source) plus a haste-map package.json collision; fixed by restricting Jest roots and ignoring workspace/ and coverage/ (config-only, no test or code change)."}
```
