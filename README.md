<p align="center"><img src="public/logo.png" alt="Blackwood Files" width="560"></p>

# Blackwood Files

*Every Secret Leaves a Trace.*

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Nikola1114/Detektive.AI)

A noir crime-investigation game for the browser. Examine crime scenes, collect evidence, interrogate suspects who lie for their own reasons, pin it all to an evidence board, and prove who did it.

The first case, **CASE 001: THE LAST LIGHT**, is fully hand-authored. A procedural generator builds more cases, and each generated case must pass the same consistency checks before anyone can play it.

## Quick start

Requires **Node 22.18+**, which runs the TypeScript server directly with no build step for the server.

```bash
npm install
npm run dev          # API on :8787 + Vite on http://localhost:5173
```

Production build:

```bash
npm run build        # typechecks client + server, builds the client
npm start            # serves the game and API on http://localhost:8787
```

Optional AI dialogue: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without a key the game uses its authored dialogue engine and stays fully playable. The Settings screen shows which engine is active.

## Talking to suspects

The interrogation room is a monochrome scene: the suspect sits across the table under a lamp, and their posture changes with their mood. Replies appear in speech bubbles with a line of body language (*"They avert their gaze."*), a heart-rate monitor shows stress, and other suspects wait on the right.

- **Ask questions any way you like.** Pick a suggested question, or type or speak your own. The game tolerates typos and different wordings, and it understands follow-ups ("why?", "are you sure?"), greetings and "who are you?". If you **mention evidence you've found** ("why was your car in the garage at 22:03?"), that counts as confronting the suspect with it. When it doesn't understand, it suggests what you could ask.
- **Voices.** Suspects speak their lines aloud, each with their own voice. *Standard* uses the browser's built-in speech (instant; best in Microsoft Edge). *Realistic* runs the open-source Kokoro neural voice model on the player's own computer. It's free with no key, downloads about 90 MB once from Hugging Face, and runs in a background worker; if the download fails, the game falls back to standard voices. Click the microphone to ask out loud (Edge or Chrome). Voice quality, volume and speed are in Settings.
- **AI answers (optional).** With an `ANTHROPIC_API_KEY`, suspects answer typed or spoken questions in their own words, within the safety rules described below.

## Story mode

Pick **Story** when a case starts (or switch to it in Settings). The case is told like a film:

- Every chapter opens with a cutscene: letterboxed, with film grain, flicker, slow camera moves over the case artwork, typewriter subtitles and a narrator reading the lines aloud. Sgt. Kane and the suspects speak their own lines. Click or press Space to move on, Esc or **Skip** to skip it, and **Replay chapter scene** to watch it again.
- Case 001 has seven chapters (The Scene, The Tower Remembers, Five Stories, Cracks, Lantern, The Warrant, The Accusation). Each one has a checklist of objectives. The next chapter starts as soon as the checklist is done.
- **Ask for a clue** points at whatever the current chapter still needs.
- Story mode uses the relaxed Easy rules.
- Generated cases get a simpler five-chapter story built from their own content.
- The final reveal plays as a film in every mode.

## Difficulty, clues and giving up

- **Story, Easy or Detective:** you choose when a case starts, and you can switch in Settings. In Easy mode, nothing in a room is hidden, deductions are made automatically as soon as you have both pieces of evidence, suspects confess the moment you show the right evidence, and you can accuse as often as you like. After each attempt you're told which parts (motive, method, sequence) were right.
- **Ask for a clue:** Sgt. Kane suggests the most useful next step: an object you haven't examined, a question to ask, evidence to show someone, or two items to link. In Detective mode the first clue is vague and asking again gives the exact step. A test proves that a player who does nothing but follow clues can solve every case.
- **I give up:** reveals the full solution and closes the case. Restart it from Case Files.

## Share it with friends

**Easiest: put it online (free).** Click **Deploy to Render** above, sign in with GitHub, and click **Apply**. A few minutes later you get a web address like `https://blackwood-files.onrender.com` that anyone can open on a computer or phone. Each visitor gets their own private save.

Things to know about Render's free plan:
- The site goes to sleep after about 15 minutes with no visitors, and the next visit takes up to a minute to wake it.
- **Saves are wiped whenever the server restarts or sleeps.** To keep saves, choose a paid plan and add a disk mounted at `/opt/render/project/src/data`.
- AI answers are off unless you add your own `ANTHROPIC_API_KEY` in Render's Environment settings. Usage is billed to you; `DETECTIVE_AI_DAILY_LIMIT` caps replies per player per day.

**Same Wi-Fi only:** run `npm run build` and then `npm start` on your computer. Friends on the same network open `http://<your-computer's-IP>:8787`. The microphone only works on `localhost` or over HTTPS, so for voice input the Render option is better.

## Tests

```bash
npm test             # 45 unit/integration tests (no network needed)
npm run test:e2e     # browser playthroughs (server must be running on :8787)
```

- `tests/case001.test.ts` runs the **case validator** on Case 001 (described below) and checks that the client view leaks nothing. It also covers dialogue changing when evidence is presented, refusal of solution-seeking prompts, XP that can't be farmed, recognition of board deductions, and all four accusation verdicts.
- `tests/ai-guard.test.ts` checks that the AI reply validator rejects invented times, secrets that haven't been unlocked, confessions, and breaking character.
- `tests/generator.test.ts` generates every setting at every difficulty and validates each case. It also confirms the validator **rejects** broken cases: unreachable evidence, multiple possible culprits, contradictory facts, and an out-of-order timeline.
- `tests/e2e/playthrough.mjs` plays Case 001 in Chromium from the Welcome screen to the resolution. It explores all 7 locations, interviews all 5 suspects, presents evidence, links deductions on the board, reloads the page to check persistence, makes a wrong accusation and then the correct one, and finishes with mobile-layout screenshots.
- `tests/e2e/generated.mjs` generates a case through the UI and plays its opening.

## Architecture

```
browser (React + TS + Tailwind + Framer Motion)     ← holds NO case data
   │  JSON over /api, bearer session token
   ▼
server/ (Node, TypeScript, no framework)
   ├─ cases/            canonical case data (solutions, secrets)  ← server-only
   │   ├─ case001/      evidence, locations, deductions, 5 suspects, canon
   │   └─ types.ts      the CaseDef authoring schema
   ├─ engine/           rules: discovery, unlocks, deductions, accusation,
   │                    XP/ranks/achievements, sanitised views, validator
   ├─ dialogue/         authored dialogue engine + optional Claude layer
   ├─ generator/        procedural case generator
   └─ store.ts          save files (atomic JSON writes, one per player)
shared/api.ts           request/response *types* only
supabase/schema.sql     target Postgres schema with RLS (see limitations)
```

**How the solution stays secret.** The client bundle contains UI code only. The test suite checks this, and a grep of `dist/` for case secrets returns nothing; source maps are disabled. Each API response is a projection of the case: discovered evidence only, location descriptions only once unlocked, hotspot labels without their contents until inspected, no deduction rules, and no solution. The truth is served only after the case closes, through `/resolution`.

**Persistence.** Every meaningful action (inspecting, collecting, interrogating, linking, writing a note, accusing) is saved on the server immediately. A session token in `localStorage` identifies the player anonymously.

## The six investigation systems

| System | What you can do |
|---|---|
| **Crime scenes** | Seven illustrated SVG locations with clickable objects and an inspection panel (Collect / Photograph / Add observation). Hidden clues stand out only when you *Search closely*. A list of points of interest lets keyboard and touch players do everything without hunting for hotspots. |
| **Interrogations** | Ask suggested questions or type freely. Present evidence to test a story. Suspects have stress, trust and a visible mood, which is a cue rather than a lie detector. Admissions come only from evidence or pressure, and asking for the solution gets an in-character refusal. |
| **Evidence board** | Drag cards and suspect photos, pan and zoom, and add notes and hypotheses. Link two items to test a theory: valid pairs become *deductions* or *contradictions*. You can mark your own suspected contradictions, and a form lets keyboard users link items. Layout persists between sessions. |
| **Notebook** | Evidence, interview transcripts, suspects, locations, a searchable timeline, deductions and your own notes. Confirmed evidence, testimony and your hypotheses are colour-coded; a note that starts with a time such as `22:30 — …` appears on the timeline. |
| **City map** | Illustrated Blackwood City. Locked leads explain what will unlock them. |
| **Accusation** | Name the culprit, motive, method and sequence of events, and cite at least 3 pieces of evidence. Verdicts are *Case solved*, *Correct suspect / incomplete reasoning*, *Incorrect accusation* or *Insufficient evidence*. You get three attempts, then a cinematic resolution reveals what really happened. |

You start as a **Rookie Detective** and can rise through seven ranks to **Legendary Detective**. XP is awarded once per discovery, deduction, admission or solved case, so repeating actions earns nothing. There are 9 achievements.

**Audio** is synthesised in the browser with the Web Audio API: rain, traffic, office hum, an interrogation-room clock, a slow minor-key score and cues for discoveries. There are no audio files, so there's nothing to license. Sound is off until the player enables it, and ambience, music and effects each have a volume slider. **Accessibility** settings include reduced motion (following the OS setting by default), larger text, high contrast and toggles for film grain and rain. The UI has focus rings, ARIA labels and keyboard paths throughout.

## Case 001: The Last Light (spoiler-free)

Blackwood City, 14 November 2026. Tech founder Daniel Mercer is found dead in his locked office on the 42nd floor of Blackwood Tower, and the cameras were dark for eleven minutes. The suspects are his estranged wife, his business partner, his assistant, the building's security chief, and a journalist.

| Requirement | Required | Built |
|---|---|---|
| Evidence | ≥ 20 | 59 in total: 43 found at locations, plus 16 statements and documents obtained in interrogations |
| Deductions | ≥ 15 | 34 |
| Contradictions | ≥ 10 | 12 |
| Locations | ≥ 5 | 7 (one requires a search warrant you earn) |
| Suspects | 5 | 5 fully written, each with a secret and a lie unrelated to the murder |
| Misleading clues | ≥ 3 | The broken watch, the whiskey sedative, the camera blackout, the wife's absence, the journalist's lie, the bookie's napkin |

The canonical truth, including the minute-by-minute timeline, is in `server/cases/case001/index.ts`. **It contains spoilers.**

## The validator

`server/engine/validate.ts` checks that every reference in a case resolves. It then plays the case to exhaustion **with the real engine**: it explores every unlocked location, asks every question, presents every item to every suspect and links every valid pair. A case passes only if:

- every location, evidence item, deduction and major admission can be reached
- the culprit is implicated by at least 2 deductions and cleared by none
- every innocent suspect is ruled out by at least one deduction, so there's a single solution
- the canonical timeline is in order
- the canonical accusation succeeds using only evidence that can be found

## Case generator

Seven settings: small-town murder, luxury hotel disappearance, art museum theft, missing person, corporate espionage, inheritance dispute, and a 1920s historical mystery. Three difficulties:

| Difficulty | Suspects | Locations | Field clues |
|---|---|---|---|
| Beginner | 3 | 3 | 10–15 |
| Intermediate | 5 | 5 | 20–30 |
| Expert | 7–8 | 7 | 35+ |

Generation is seeded and deterministic. The canonical solution is fixed first, then everything else is derived from it. Each candidate goes through the validator and is regenerated if it fails. All suspects share the same greeting, alibi and demeanour templates, so only evidence separates the culprit from the innocents.

## AI dialogue (optional)

The authored engine always decides *what* a suspect reveals in a turn: admissions, evidence handed over, and deductions recognised in the room. When `ANTHROPIC_API_KEY` is set, free-text questions are voiced by Claude (`claude-opus-5-5`, effort `low`, JSON structured output, server-side refusal fallback enabled). The model only rephrases that turn's authored content in response to the player's actual words.

- The model receives only what the character is currently willing to say: their public stance, lines they have already spoken, and this turn's content. Secrets that haven't been unlocked are never in the prompt, so prompt injection has nothing to extract.
- Replies are checked before use. A reply is rejected if it uses a guarded term the player hasn't unlocked, invents a clock time, confesses, or breaks character. On rejection or API error the authored line is used instead.
- Model: `DETECTIVE_AI_MODEL`, default `claude-opus-5-5`. The key stays on the server.

## Development phases

**Phase 1 (playable foundation): done.** Welcome screen, Detective Office hub, Case 001, crime scenes and the inspection panel, authored interrogations, notebook, accusation and resolution, all sharing one persistent server state.

**Phase 2 (advanced gameplay): done.** Evidence board with persistent connections and a deduction engine, conditional dialogue, suspect emotional states, searchable timeline, city map with unlocks, ranks and achievements, procedural audio, and accessibility settings.

**Phase 3 (AI interactions): built; not tested against the live API.** Natural-language interrogation with a Claude layer constrained by authored content, reply validation, conversation persistence and graceful fallback. Free-text questions already work without AI through intent matching.

**Phase 4 (expansion): done in its first form.** Procedural case generator across 7 settings and 3 difficulties, with consistency checks and a UI in Case Files.

## Known limitations

- **Supabase is not wired up.** Saves use server-side JSON files behind a small interface (`server/store.ts`). `supabase/schema.sql` is the target schema with row-level security, but no Supabase adapter or Supabase Auth integration has been written. Players are identified by an anonymous token, so clearing browser storage loses access to the save; Settings offers a save export.
- **The AI dialogue path hasn't run against the live API**, because no API key was available while this was built. The request code follows the official SDK, and the fallback and validation logic is unit-tested.
- **shadcn/ui** wasn't installed through its CLI. Equivalent primitives (Button, Badge, Modal, Tabs, Meter) are written in `src/components/ui.tsx` in the same style. Lucide icons and Framer Motion are used as specified.
- **Generated cases** use template prose and generic room art. They are logically sound but less rich than Case 001, and they always follow one blueprint: key access, a false alibi, and a two-document motive.
- **The art** is stylised SVG and procedural, not painted or photographic, and the portraits are procedurally drawn.
