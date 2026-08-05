# AirVIA Phase 4: Public Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the codebase is rigorously checked (Svelte strict typing), CI is robust, and public documentation accurately reflects current behavior and limitations.

**Architecture:** Use `svelte-check` inside `package.json` to enforce template type safety. Enhance GitHub Actions CI to validate PRs, not just the `master` push. Update `README.md` to reflect the truthful connection flow, tested bounds, and privacy model.

**Tech Stack:** Svelte 5, TypeScript, Vite, GitHub Actions.

## Global Constraints

- Initial public support: three to five hardware-verified keyboards.
- Local-first; no backend, accounts, analytics, telemetry, or cloud sync.
- No new dependency for queueing, storage, dialogs, icons, or styling.
- Device writes require loaded definition, verified compatibility, connected transport, and successful synchronization.
- Unsupported features render read-only or unavailable, never fabricated editable values.
- Preserve existing user changes; do not revert unrelated worktree changes.
- Run `pnpm check`, `pnpm test`, and `pnpm build` at every phase boundary.

---

### Task 1: Svelte Check and Package Constraints

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: Enhanced `check` script using `svelte-check`.
- Produces: explicit node/pnpm engines requirement.

- [ ] **Step 1: Check if `svelte-check` is installed**

Run `pnpm list svelte-check`. If it's missing, add it to `devDependencies` (`pnpm add -D svelte-check`).

- [ ] **Step 2: Update `package.json`**

Modify the `"check"` script to run `svelte-check --tsconfig ./tsconfig.json` instead of just `tsc --noEmit`. 
Add `engines` constraints to ensure predictable builds.

```json
{
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "scripts": {
    "check": "svelte-check --tsconfig ./tsconfig.json && tsc --noEmit"
  }
}
```

- [ ] **Step 3: Test `pnpm check`**

Run: `pnpm check`
Expected: Output from `svelte-check` showing 0 errors, followed by `tsc` completing silently. If there are existing errors, fix them in this step.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "build: enforce svelte-check in check script and define node engines"
```

### Task 2: GitHub Actions CI Matrix

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: CI that runs `check`, `test`, and `build` on Pull Requests, and restricts deployment to `master` branch pushes.

- [ ] **Step 1: Modify Workflow Triggers**

Update the `on` block to listen to `pull_request` on `master` and `push` to `master`.

```yaml
on:
  push:
    branches: ["master"]
  pull_request:
    branches: ["master"]
```

- [ ] **Step 2: Split Validation and Deployment jobs**

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: validate
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    # keep existing deploy steps...
```

- [ ] **Step 3: Validate yaml manually**

Ensure indentation and syntax are correct.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: run validation on pull requests and gate deployments"
```

### Task 3: Public Documentation & Capability Matrix

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: Truthful onboarding steps and privacy statements.

- [ ] **Step 1: Rewrite the Usage section in `README.md`**

Reflect the truthful flow (definition must be loaded before connecting):

```markdown
## Usage

1. Open the [live app](https://juarendra.github.io/AirVIA/) or serve locally.
2. Load a V3 JSON definition file for your keyboard.
3. Click **Connect** and pair with your BLE keyboard.
4. Wait for synchronization to complete.
5. Edit your keymap, encoders, or lighting (if supported).
```

- [ ] **Step 2: Add Privacy and Support statements**

```markdown
## Privacy and Security

AirVIA is **local-first**. It runs entirely in your browser without a backend.
- Profiles and backups are saved to your local machine.
- No analytics, telemetry, or cloud tracking are used.
- Web Bluetooth requests direct, local pairing only to the VIA service UUID.

## Hardware Support

Initial public support is bounded. Features like Encoders, Lighting, Layouts, and Macros will gracefully disable if your specific firmware version does not expose them.
```

- [ ] **Step 3: Update Test Count**

Remove the specific test count (e.g., `84/84 pass`). Just state: `pnpm test # Vitest unit tests`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update workflow, add privacy statement, and fix test count"
```