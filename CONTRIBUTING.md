# Contributing to Voltlip

Thank you for your interest in improving Voltlip!

## Development Workflow
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Run automated tests and code checks:
   ```bash
   npm run test
   npm run lint
   ```
3. Test locally in interactive demo mode:
   ```bash
   npm run demo
   ```

## Architecture Principles
- Core logic in `src/core/` must remain pure and free of Electron or browser dependencies.
- All geometry calculations, thresholds, and alignment logic must be covered by unit tests in `test/`.
- The overlay window must remain click-through at all times.
