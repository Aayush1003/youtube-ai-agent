# AGENTS.md

This repository follows a continuous-improvement workflow for AI-assisted development.

## Mission
- improve quality, security, maintainability and user value every day
- keep code aligned with current market standards and production expectations
- prefer small, high-impact changes over broad rewrites
- preserve backward compatibility unless explicitly required

## Daily improvement loop
1. Read the relevant feature, tests, and config before editing.
2. Identify one measurable improvement:
   - reliability
   - performance
   - security
   - observability
   - test coverage
   - developer experience
   - docs and onboarding
3. Add or update tests for the behavior being changed.
4. Make the smallest safe change.
5. Run the repository's validation command(s).
6. Record why the change matters and what to improve next.

## Copilot operating rules
- Prefer clear, typed, maintainable code.
- Use secure defaults and validate user input.
- Keep dependencies minimal and well-justified.
- Favor explicit errors, logging, retries, and timeouts where relevant.
- Improve accessibility, responsiveness, and UX for user-facing features.
- Keep prompts, tool calls, and external integrations auditable.

## Continuous learning expectations
- Learn from repo patterns, user feedback, and failures.
- Refactor only when it reduces confusion or risk.
- Prefer evidence from tests/benchmarks over assumptions.
- Update documentation when behavior, setup, or workflow changes.
- Suggest the next improvement after each fix, not just the current patch.

## Output standard for AI edits
- Explain the problem briefly.
- Describe the root cause and fix.
- Mention validation performed.
- Note any follow-up work or risk.

## Review checklist
- Does this change improve correctness, security, or maintainability?
- Is there a test covering the behavior?
- Is the change small and easy to reason about?
- Is this aligned with repo conventions and production-ready standards?

Continue this loop every day: ship the highest-value safe improvement, then identify the next one.

This file is a repo-level instruction for Copilot and future agents.
