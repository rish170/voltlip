# Voltlip Release Checklist

Perform these steps before releasing a new version of Voltlip:

- [ ] **1. Code Cleanliness**:
  - `npm run lint` passes with 0 warnings and 0 errors.
  - `npm run test` passes all unit test suites.
- [ ] **2. Version Consistency**:
  - `package.json` `version` is updated (e.g. `1.0.0`).
  - `CHANGELOG.md` has an entry for the release version and date.
- [ ] **3. Manual Verification**:
  - Follow `docs/MANUAL_TESTING.md`.
  - Verify `npm run demo` cycles through all 12 scenarios.
  - Verify click-through behavior and tray pause toggle.
- [ ] **4. Package Integrity**:
  - Run `npm run test:install` to verify tarball packing and execution.
- [ ] **5. Git Tag**:
  - Stage and commit all changes.
  - Create annotated git tag: `git tag v1.0.0`.
  - Push to remote: `git push origin main --tags`.
