# Subteam brief — Crew + Identity

## Mission
Own durable crews and members, link-based joining, lightweight identity. The crew is the durable
root entity.

## Defining decision (sacred)
**Join by link — no install, no account to vote.** Identity is a one-tap claim. The crew (owned
by a logged-in organizer) persists.

## You implement
`CrewService` (createCrew, joinByLink) + identity claim + token issue/validate.

## You PRODUCE
`CrewProfile`, `MemberRef`, join tokens.

## You CONSUME
Nothing.

## Build
Crew CRUD · join-token issue/validate · identity claim · membership.

## Boundaries
Edit only this folder. Depend only on `@funtog/contracts`.

## Definition of done
Create crew, join by link, claim identity; tokens validated; CrewProfile contract test green.

## Build for horizontal scale
Partition by **crewId**; stateless behind a partitioned store. Use **signed/stateless join tokens** that validate O(1) (no DB round-trip) and **idempotent** joins, so a viral link (join storm onto one crew) stays flat. Cache memberships. Lowest scaling risk. Bottlenecks: join storm (hot partition), token-validation QPS.

A perf + stress skeleton is in `perf/` (`npm run bench` / `npm run stress`) — it prints its scenarios now and measures once you build. Keep it honest; capture new bottlenecks in `docs/SCALING.md`. Full map: `docs/SCALING.md`.
