# Pushing FunTog to GitHub

The repo in this archive is a complete local git repository — full history is included
(`git log --oneline` shows the scaffold, both contract bumps, and all six subsystem builds).
It has **not** been pushed anywhere. Here is how to publish it.

## Prerequisites
- `git`, and Node 20+ (only needed to *run* tests, not to push)
- A GitHub account; the [`gh` CLI](https://cli.github.com/) is optional but easiest

## 1. Unpack and verify history
```bash
unzip funtog-repo.zip
cd funtog
git log --oneline      # you should see the full history, HEAD = "Build Crew + Identity ..."
```

## 2. Publish

### Option A — GitHub CLI (one command)
```bash
gh repo create funtog --private --source=. --remote=origin --push
```
Drop `--private` for a public repo.

### Option B — manual
Create a new **empty** repo on github.com (no README/license/.gitignore), then:
```bash
git remote add origin git@github.com:<you>/funtog.git   # or the https:// URL
git branch -M main
git push -u origin main
```

That publishes everything. On the first push, GitHub Actions runs `.github/workflows/ci.yml`
(`npm install` + `npm test` on Node 20 and 22) — the full 51-test suite across all six subsystems.

## 3. Verify locally (optional)
`node_modules` is intentionally excluded from the archive, so install first:
```bash
npm install
npm test            # expect: 51 passing, 0 failing
```

## Recommended follow-ups
- **Commit a lockfile** for reproducible installs: `npm install` generates `package-lock.json` —
  commit it, then CI can switch from `npm install` to the faster, stricter `npm ci`.
- **Branch protection** on `main` requiring the `test` checks to pass before merge.
