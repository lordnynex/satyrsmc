# Deployment

## Overview

This repo uses Netlify for hosting. There are three independent Netlify sites:

| App        | Directory              | Netlify site             |
| ---------- | ---------------------- | ------------------------ |
| Public UI  | `packages/app-public`  | app-public staging site  |
| Members UI | `packages/app-members` | app-members staging site |
| Node API   | `packages/api`         | api staging site         |

Deploys are triggered via **Netlify build hooks** — a `curl POST` to a hook URL tells Netlify to pull the latest commit from the connected branch and rebuild.

---

## Staging Deploy Workflow

The workflow lives at [.github/workflows/deploy-staging.yml](.github/workflows/deploy-staging.yml).

### Automatic: on every PR to `main`

When a PR targeting `main` is opened or updated, the workflow:

1. Installs dependencies (`pnpm install --frozen-lockfile`)
2. Builds each app (`pnpm --filter <app> build`) as a pre-flight check
3. Fires the Netlify build hook for each site

If a build fails in step 2, the workflow stops and the corresponding hook is never fired.

### Manual: for any branch

Go to **Actions → Deploy to Staging → Run workflow**, enter a branch name or SHA, and click Run. Useful for testing feature branches against a bigger feature branch before opening a PR to `main`.

---

## Required GitHub Secrets

Set these in **repo Settings → Secrets and variables → Actions**:

| Secret name               | What it is                                     |
| ------------------------- | ---------------------------------------------- |
| `NETLIFY_HOOK_PUBLIC_UI`  | Build hook URL for the public UI Netlify site  |
| `NETLIFY_HOOK_MEMBERS_UI` | Build hook URL for the members UI Netlify site |
| `NETLIFY_HOOK_API`        | Build hook URL for the API Netlify site        |

### How to create a Netlify build hook

1. Open the Netlify dashboard for the site
2. Go to **Site configuration → Build & deploy → Build hooks**
3. Click **Add build hook**, give it a name (e.g. `github-staging`), select the branch to build from
4. Copy the generated URL and add it as the corresponding GitHub secret above

---

## Neon Staging Database

The API connects to Postgres via the `DATABASE_URL` environment variable at runtime. The tsup build step does **not** need it — it is purely a runtime variable read by `process.env.DATABASE_URL` in the deployed function.

To connect the API staging site to the Neon staging database:

1. In your Neon dashboard, create a staging branch (or use an existing one) and copy its connection string
2. Open the API's Netlify site → **Site configuration → Environment variables**
3. Add `DATABASE_URL` with the Neon staging connection string
4. Redeploy for the change to take effect

---

## Extending to Production

When ready to add production deploys:

1. Create a new workflow at `.github/workflows/deploy-production.yml`
2. Trigger it on `push` to `main` (or on a release tag)
3. Add a separate set of secrets for production hooks: `NETLIFY_HOOK_PUBLIC_UI_PROD`, etc.
4. Set `DATABASE_URL` in each production Netlify site's environment variables pointing at the Neon production branch
5. Consider adding a manual approval step before firing production hooks
