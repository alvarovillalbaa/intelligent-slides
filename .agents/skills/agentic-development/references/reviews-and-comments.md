# Reviews and Comments

Treat review as technical evaluation, not social performance.

## When Performing a Review

Lead with findings, ordered by severity. For each finding, include the file and line, the concrete risk, and why it matters. If no findings are present, say so explicitly and mention any residual testing or verification gaps.

## When Receiving Review Feedback

- Read the feedback completely before changing code.
- Restate unclear requirements in precise technical terms or ask for clarification.
- Verify whether the issue still exists in the current code.
- Push back when the feedback is technically wrong for this repo.
- Implement one area at a time and re-verify.

Do not use performative agreement in place of analysis.

## Review Thread Hygiene

If the review platform supports inline replies, answer in the thread for line-specific comments. Use top-level comments only for cross-cutting discussion.

When fixing comments:

- cluster related comments
- fix blockers first
- re-run the narrowest relevant verification
- reply with the concrete change, not vague reassurance

## Bot Comments

Treat comments from Sentry, static analyzers, or CI bots as triage inputs.

- verify the comment is not stale
- inspect the exact file and line it references
- confirm the root cause before editing
- summarize what changed and what evidence supports the fix

## GitHub Helpers

If the repo exposes `gh-address-comments`, use it for comment triage. If CI is failing, use `gh-fix-ci` to inspect the checks before you start guessing at fixes.
