# Aayush Creator Lab: agentic product operating model

This playbook describes a human-directed, agent-assisted product loop. It is not a self-training system and does not run code changes on a schedule by itself.

## Product principle
Help creators make original, useful videos and learn from their own audience. Viewer trust and creator control outrank short-term engagement. Never promise that a tactic will make a video go viral.

## Lightweight startup-style loop

### 1. Discover
Use creator feedback, observed workflow friction, accessibility checks, support reports, and responsibly sourced platform information. Separate observed facts from assumptions. Record the audience and problem before suggesting a feature.

### 2. Decide
Choose one small bet. State the problem, who benefits, the expected outcome, a measurable acceptance criterion, and what would make the team stop or reverse the change. Prefer an experiment that does not require collecting more personal data.

### 3. Build
Use the Creator Strategist for concept work, Script Editor for drafts, Trust and Fact Checker for editorial review, and Product Quality Engineer for code changes. Humans own product direction and approve consequential decisions.

### 4. Verify
Add tests, run `npm test` and relevant build checks, review accessibility and privacy implications, and verify sources for factual claims. Report failures honestly. Keep changes small and reversible.

### 5. Learn
After a creator tries a feature, compare the result with the stated hypothesis using data the creator intentionally provides. Do not treat a single video's performance as proof of causation. Capture lessons in a reviewed issue, PR, or product note; do not imply that Copilot permanently trains itself from the interaction.

## Daily cadence
A daily session means one review of the backlog or product, not a requirement to ship code every day. If there is no evidence-backed improvement, do nothing and explain why. If work is worthwhile, propose a small PR for human review; never auto-publish videos or silently change external creator accounts.

## Useful success signals
Prefer measures tied to actual value, such as successful completion of a creator workflow, fewer failed generations, task time, accessibility defects fixed, source coverage for factual scripts, and creator-reported usefulness. Use channel metrics only when deliberately supplied, interpret them in context, and never present them as guaranteed outcomes.
