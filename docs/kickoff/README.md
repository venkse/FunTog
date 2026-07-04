# Kickoff prompts

Paste-ready prompts to spin up each agentic subteam (e.g. in Claude Code, pointed at this repo).
Run **Phase 0 first** (`00-platform.md`), confirm it's green, then launch the six subsystem
prompts in parallel — each agent works only in its own `services/<x>/` folder.

| Order | Prompt | Folder |
|---|---|---|
| 0 (first, alone) | `00-platform.md` | repo root / packages/* |
| 1 (parallel) | `memory-ledger.md` | services/memory-ledger |
| 1 (parallel) | `crew-identity.md` | services/crew-identity |
| 1 (parallel) | `venue-knowledge.md` | services/venue-knowledge |
| 1 (parallel) | `suggestion-engine.md` | services/suggestion-engine |
| 1 (parallel) | `character-engine.md` | services/character-engine |
| 1 (parallel) | `convergence-orchestrator.md` | services/convergence-orchestrator |
