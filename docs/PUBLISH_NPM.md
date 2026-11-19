# Publishing Voltlip to npm

This guide describes how to publish Voltlip to the npm registry.

---

## Prerequisites
1. An active account on [npmjs.com](https://www.npmjs.com/).
2. Two-factor authentication (2FA) enabled on your npm account.

---

## Method A: Automated GitHub Actions Release (Recommended)

1. **Generate an npm Automation Token**:
   - Log in to [npmjs.com](https://www.npmjs.com/).
   - Click your profile icon -> **Access Tokens** -> **Generate New Token** -> Select **Automation**.
   - Copy the token value.

2. **Add Secret to GitHub**:
   - Go to your repository on GitHub: `Settings` -> `Secrets and variables` -> `Actions`.
   - Click **New repository secret**.
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token.

3. **Tag and Push**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   GitHub Actions will automatically run linting, tests, publish to npm with provenance, build the Windows `.exe` installer, and draft the GitHub release.

---

## Method B: Manual Local Publish

If you prefer publishing directly from your terminal:
```bash
# 1. Login to npm
npm login

# 2. Run verification
npm run lint
npm run test

# 3. Publish to npm registry
npm publish --access public
```
