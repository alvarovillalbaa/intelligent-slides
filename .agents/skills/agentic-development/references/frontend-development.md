# Frontend Development

Start with the design system and interaction model the repo already has. Frontend quality comes from intentional consistency, not generic component churn.

## Default Heuristics

- Reuse existing primitives, tokens, utilities, and component patterns before building new ones.
- Keep components cohesive. Split only when complexity, ownership, or reuse justifies it.
- Preserve the framework's data-flow conventions: server versus client boundaries, router patterns, fetching strategy, and state ownership.
- Handle loading, error, empty, and responsive states as first-class behavior.
- Check accessibility, keyboard behavior, focus management, and semantic structure before calling UI work complete.

## Design-System Preservation

If the repo already has a design language, preserve it. If it does not, still avoid generic output. Match the product's tone and constraints instead of dropping in interchangeable UI.

## Instrumentation

- Use existing analytics and feature-flag clients.
- Track meaningful user intent and workflow transitions, not every render or micro-interaction.
- Add error boundaries or reporting through the repo's existing error tracking system.

## Refactor Triggers

Refactor when a component mixes too many concerns:

- long render function plus heavy state logic
- API orchestration inside view code
- repeated JSX patterns
- unclear ownership between hooks, stores, and components

When the repo exposes specialized frontend skills such as `ui-skills`, `building-components`, `frontend-design`, or `component-refactoring`, use them instead of re-explaining those rules here.

## Cloush-Aligned Bias

Favor reuse, minimize duplicate UI logic, and avoid over-modularization. A larger but clearer component tree is often better than fragmenting one concept across many tiny files with repeated logic.
