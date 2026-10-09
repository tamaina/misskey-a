# Frontend typecheck memory diagnosis

Measurements on 2026-10-08 were taken while preparing the RSS/WebAuthn cohort based on `1c1de8f4`. Node 24.18.0, frontend TypeScript 6.0.3, Vue 3.5.42 and vue-tsc 3.3.11 were held constant. SDK declaration builds used the installed workspace compiler. Commands ran serially with a 5120 MiB Node heap and sufficient available RAM; no dependency installation or production compiler-option changes were needed.

Frontend imports reach feature-owned Valibot schemas and oRPC declaration types through the published `misskey-js` contract graph. Import file size alone does not measure the cost of generic instantiation.

| Diagnostic | Result | Wall time | Peak RSS, KiB | Files | Types | Instantiations |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Current frontend/SDK | PASS | 41.65 s | 3,738,176 | 3,602 | 595,023 | 2,232,137 |
| Same frontend, SDK at `ec5614c1` | 3 expected RSS fixture errors | 44.92 s | 3,976,076 | 3,775 | 660,756 | 2,786,304 |
| 94 contract aliases using direct public schema inference | PASS | 41.66 s | 3,732,156 | 3,602 | 587,936 | 2,174,745 |
| Application-root probe excluding tests/stories | PASS | 38.23 s | 3,447,336 | 2,589 | 510,369 | 2,104,792 |
| Pre-oRPC frontend/SDK at `a9f9ec62`, current dependencies/options/root patterns | PASS | 32.70 s | 2,532,512 | 3,092 | 436,116 | 1,432,452 |
| Later RSS fixes, instrumented original VVI type generator | PASS | 41.54 s | 3,724,104 | 3,606 | 600,412 | 2,247,592 |

The old-SDK run is an error-bearing diagnostic, **not a clean performance benchmark**. The pre-oRPC snapshot is a broad historical comparison: source placement, portable contract coverage, VVI and tests changed together. Holding dependencies and compiler options constant does not isolate those source changes.

The direct-inference experiment retained the actual contract schemas and runtime oRPC construction. Inputs selected `wireInput` where present; other inputs used `InferInput`, and outputs used `InferOutput`. Twenty-three router aliases remained unchanged. Full-route key, request and response equality passed against a matched reference snapshot before measuring. Instantiations fell modestly, but peak memory and elapsed time did not materially change. The experiment was not adopted in production.

Test/Storybook roots accounted for about 8% of peak RSS in this probe. Removing their checks is not a proposed fix.

VVI 1.1.3's original `getGeneratedTypes` was timed in a temporary plugin copy, returning its original strings and retaining all checks. It ran 728 times, returned 350 distinct cached type sets and produced 2,730,712 characters across calls. Generation took 84.95 ms in total. **This measures string generation, not TypeScript's subsequent checking or memory use for those types.** No claim that VVI's type graph is cheap follows from this measurement.

## Repeating the diagnosis

1. Record the source checkpoint and worktree delta, compiler/dependency versions and available RAM. Run each heavy command alone.
2. Capture wall time, peak RSS and compiler diagnostics:

   ```sh
   env NODE_OPTIONS=--max-old-space-size=5120 /usr/bin/time -v \
     pnpm --filter frontend exec vue-tsc --noEmit --extendedDiagnostics
   ```

3. Build historical SDK/frontend sources in temporary snapshots with the same installed dependencies. Invoke the workspace compiler/build entry directly; do not run a package manager in a snapshot sharing `node_modules`, which can rewrite command wrappers. Use absolute diagnostic paths for workspace aliases and SDK declarations, preserving the production compiler options and root patterns.
4. Label runs with errors explicitly. Compare full source snapshots only as broad history; compare matched source graphs when attributing a particular inference change.
5. Before measuring an inference candidate, compile an equality proof for every route's keys, requests and responses. Preserve both matched snapshots so later worktree edits cannot change the reference.
6. For VVI timing, copy the installed plugin to a temporary location and time only the original generator's call without changing its result. Use a standalone copy of the frontend config with exactly one plugin entry; inherited plugin arrays can otherwise duplicate injection. Keep the original primary locale and every check.

Exact named public schema aliases can prevent repeated declaration expansion without widening contracts. Replace-only reactive containers can use `shallowRef` where behavior permits it. These are concrete type-depth fixes; neither establishes the cause of overall graph memory usage. No disabled checks, broad `any`, backend alias leakage into SDK types, or per-feature tsconfigs are required.
