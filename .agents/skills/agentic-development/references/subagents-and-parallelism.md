# Subagents and Parallelism

Use subagents to improve focus, not to outsource thinking. The controller remains responsible for scope, integration, and truthfulness.

## Good Reasons to Split Work

- backend and frontend changes are largely independent
- several failures live in unrelated files or subsystems
- a role split helps quality: implementer, spec reviewer, code reviewer
- the repo is large enough that parallel exploration saves time

## Bad Reasons to Split Work

- the tasks edit the same files
- one fix changes the assumptions of the others
- you have not yet understood the architecture
- the prompt to the subagent would just be “figure it out”

## Controller Responsibilities

Before dispatching, provide each subagent:

- the exact scope
- the acceptance criteria or spec excerpt
- relevant files and commands
- constraints such as “do not touch unrelated files”
- the format of the expected result

After dispatching:

- review what came back
- check for overlapping edits
- verify claims independently
- integrate in a deterministic order

## Parallel Investigation Pattern

Parallelize exploration when the domains are independent. Typical split:

- one agent maps architecture
- one agent inspects tests or failure modes
- one agent inspects observability or CI logs

Parallelize implementation only when the agents will not race on shared files or shared generated artifacts.

## Review Loops

For large tasks, a strong pattern is:

1. implementer agent
2. spec or behavior review
3. code quality review
4. controller integrates and verifies

Do not let “self-review” replace independent review.

## Skill Routing

If local skills exist, use them as specialists. Typical combinations:

- `create-plan` for formal planning
- `architecture-advisor` for mapping dependencies
- `test-assistant` for tests
- `gh-address-comments` or `gh-fix-ci` for GitHub workflows
- frontend-specific design or refactor skills when the task is UI-heavy
