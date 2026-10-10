<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Work flows through fabrika

report → triage → plan → build → review → ship. Every unit of work is a GitHub issue moving
through those stages; the fabrika skills run them, and the `fabrika` CLI's verbs are the ground
truth at every step.

**The default unit of work is a lane, and the operator drives it.** To get an issue built,
reviewed and shipped, spawn ONE **operator** on it (`operate` skill) — it runs the builder,
reviewer and shipper shells itself, feeds every outcome back to the lane ledger, and parks to a
human only when a gate genuinely needs one. Do not hand-dispatch the per-stage shells for normal
work, and never route around them with an ad-hoc general-purpose subagent — an off-pipeline run
skips the gates.

| Work intent | Skill | Agent |
|---|---|---|
| Get one issue built → reviewed → shipped | `operate` | **operator** |
| Capture an observation / bug / idea | `report` | — |
| Classify + prioritize the backlog | `triage` | **triager** |
| Decompose a triaged epic into children | `plan-epic`, then `check-epic-plan` | — |
| Record a decision | `adr` | — |
| Record how the code is shaped | `write-pattern` | — |

The per-stage shells are surgical — resume a half-dead lane, re-run one gate, repair one PR —
never the normal entry point: `build` (**builder**), `review` (**reviewer**), `ship`
(**shipper**), and `heal-ci` for a PR that is green but going nowhere.
