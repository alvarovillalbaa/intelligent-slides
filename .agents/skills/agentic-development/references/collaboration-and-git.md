# Collaboration and Git

Choose the collaboration mode that fits the current branch, risk level, and expected integration path. Do not apply one git workflow mechanically to every repo.

## Working on `main`

If the user is already on `main`, it is acceptable to work there. Do not force a branch or worktree just to satisfy ceremony.

Still apply these limits:

- Do not commit, push, merge, or rewrite history on `main` without explicit user intent.
- Recommend a branch or worktree when the change is large, risky, multi-day, or likely to become a PR.
- Avoid mixing the user's unrelated local edits with your task. Read `git status` first.

## Working on an Existing Branch

If the current branch is not `main`, treat it as collaborative work by default.

- If the tree is clean, syncing from `main` before new work is often correct.
- If the tree is dirty, do not auto-rebase or pull in a way that risks conflicts.
- Keep commits grouped by coherent change slices when the user wants commits.

## When to Use a New Branch

Create a new branch when:

- the user wants a PR
- the task should be isolated from current work
- multiple changes should land independently
- you need a safe place for experimental or risky edits

Use descriptive names such as `feat/...` or `fix/...` when the repo has a naming convention.

## When to Use a Worktree

Use a worktree when you need branch isolation without disturbing the current checkout, or when multiple PR-sized efforts must move in parallel.

Prefer this directory order:

1. existing `.worktrees/`
2. existing `worktrees/`
3. repo-documented preferred location
4. ask the user

If the worktree directory lives inside the repo, verify it is ignored before creating a worktree there.

## Pull Requests

PRs are collaboration artifacts, not a formality.

- Check whether the current branch already has a PR before creating a new one.
- Keep one branch per PR whenever practical.
- Summarize what changed, how it was verified, and what remains risky.
- If the repo uses `gh`, prefer inline review-thread replies over top-level comments for line-specific feedback.

## Review Comments and Thread Hygiene

- Resolve comments with code or technical reasoning, not performative agreement.
- Reply in-thread when the platform supports it.
- Distinguish blocker comments from optional cleanup so you can sequence work correctly.

## Cleanup and Completion

When implementation is complete on a branch or worktree, do not silently stop. Present the next integration choice:

1. merge locally
2. push and create or update a PR
3. keep the branch or worktree as-is
4. discard the work

If discard is chosen, require explicit confirmation before deleting a branch or worktree.
