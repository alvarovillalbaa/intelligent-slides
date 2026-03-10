# Specs, Plans, and Tests

Do not collapse these ideas into one blob. Each solves a different problem.

## Definitions

- A `spec` defines what must be true when the work is done: user-visible behavior, constraints, acceptance criteria, invariants, and non-goals.
- A `plan` defines how to get there: ordered steps, files likely to change, risks, checkpoints, and verification commands.
- A `test` proves behavior. In TDD, the test fails first, then passes after the minimal fix.

## When to Use Each

Write or refine a spec when:

- the behavior is unclear
- multiple valid product interpretations exist
- success criteria are missing
- several engineers or agents need a shared contract

Write a plan when:

- the user explicitly asks for a plan
- the repo requires planning before implementation
- the change is large enough that execution order matters
- several agents or sessions must coordinate

Use TDD when:

- fixing a bug with a reproducible symptom
- changing business logic, parsing, data transformation, or policy code
- the repo already has a strong automated test culture
- tests are in scope for the task

## Default Execution Modes

- Small and clear: implement directly, then verify.
- Fuzzy request: clarify the spec first.
- Explicit planning request: write a plan before code.
- Large multi-step change: define the spec, then write the plan, then execute in checkpoints.
- Bug fix: reproduce, add a failing regression test when tests are in scope, make the minimal fix, then re-run the proof.

## Do Not Confuse a Plan with a Spec

A list of steps is not a behavior contract. A user story is not an execution recipe. Keep both artifacts distinct so you can tell whether you have a product ambiguity or an implementation ambiguity.

## Repo Policy Overrides

Always respect local policy for planning and tests. Some repos want plans only on explicit request. Some repos do not want tests run automatically. In those repos, state what you verified and what you intentionally did not run.
