# Misskey-a release versions

Misskey-a uses independent SemVer starting at `9000.0.0`. NodeInfo continues to
advertise `software.name: misskey`; federation identifiers are unchanged.

Use the existing **Release Manager [Dispatch]** workflow on the intended release
branch, with the existing repository vars/secrets and external Release App. The
caller remains on Release Manager v2. Do not manually bump manifests, create tags
or publish releases to perform this transition.

- The first target from a valid `2026.<month>.<patch>` version is `9000.0.0`,
  regardless of the selected increment. Other legacy major series are rejected.
- Create Target appends `-beta.0`, so the first testing release is
  `9000.0.0-beta.0`. The manifest remains on its current version until that action
  runs; merging this caller change does not publish a release.
- After the transition, choose `patch`, `minor` or `major` (default: `patch`).
  For example, `9000.2.3` targets `9000.2.4`, `9000.3.0` or `9001.0.0`.
  A supported prerelease suffix is stripped when creating a new target.
- For an existing draft release PR, dispatch increments beta (`beta.0` to
  `beta.1`). Once ready for review, dispatch starts `rc.0`; subsequent dispatches
  increment rc. Explicit `start-rc` uses the same channel and resets its number
  on channel change. Release Manager rejects `start-rc` on a draft PR.
- `merge` uses Release Manager's existing approval/check gates and removes the
  prerelease suffix for the stable version. A merge/rc request with no release
  PR does not create a new release target.

Before the first release, check that no old release PR or `9000.0.0*` tag exists
and use a branch containing this caller change. Do not dispatch from an old
2026 checkout after the transition: the version guard is based on the checked-out
manifest, not a global migration flag. Existing release PRs follow the existing
prerelease/merge paths instead of the transition script.

Run the offline caller tests with `node --test scripts/release-versioning.test.mjs`.
These tests execute the actual inline script and use the frontend's pinned
`compare-versions` dependency. They do not invoke GitHub Actions or publish.
