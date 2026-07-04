# Character Engine
The moat: persona, voice, mediation, evolution.
See `AGENTS.md` and `docs/funtog-character-engine.md`.

## Moods & the sprite map
The Persona Registry carries a **sprite map** (`mood → animation id`). `render`/`mediate` emit a
`Mood` (contracts 0.2.0); the client plays the matching animation. See the live demo of all eight
moods — including a "play a whole night" sequence — in `assets/funtog-mascot.html`.

## In-app helper (AI-powered)
`assets/funtog-helper.html` is a working support chatbot that stays **in FunTog's character** while
answering "how does this work" questions (crew, spark, plans, the wheel, the ledger). It calls the
model live and drives the mascot's mood animations from each reply's mood tag. In the real system this
belongs behind the Character Engine (same persona + Safety Guard) with the model call served
server-side and answers grounded in real product docs.
