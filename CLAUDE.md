# Scorekeeper — guidance for future iterations

Mobile-first PWA for tracking Hartenjagen scores. **Read README.md first**: it documents the house rules and product decisions in detail. Those rules were chosen deliberately with the owner — never change game semantics (points per round, pit behavior, global return game, tie handling, payment formula) without an explicit request.

## Architecture decisions (keep these)

- **No backend, no login.** Everything lives in `localStorage` (`scorekeeper.games.v1`). Do not introduce a server or database for score data.
- **Rounds are the source of truth.** Scores are derived by replaying rounds in `computeState` (`src/engine/scoring.ts`). Never store computed scores. Consequence: rule changes reinterpret old saved games — mention this to the user when changing rules.
- **`src/engine/` stays pure and React-free**, fully covered by Vitest tests in the same folder. Every rule change lands there with tests for the edge cases (exactly 0 is no win, pit before the return game is no win, tie below 0, overshoot at 100).
- **Simple view state, no router.** Navigation is a `useState` in `App.tsx` plus `activeGameId` in the store.
- All user-facing text is Dutch and lives in `src/ui/strings.ts` — never hardcode strings in components.

## UI conventions

- Tailwind 4 utility classes only; no CSS files beyond `src/index.css`.
- Every color has a `dark:` variant. Primary is `red-700`; in dark mode use `red-400` with `dark:text-red-950` on buttons, surfaces `stone-800/900/950`.
- The game screen is a fixed-height flex column (`h-dvh`): the round-entry button must always stay visible; only the score table scrolls (`min-h-0 flex-1 overflow-y-auto`).
- Numeric entry fields keep a **string draft** so they can be empty while typing; a field showing 0 clears itself on focus; blur restores 0. Keep `inputMode="numeric"`.
- Touch targets ≥ 44px (`h-11` etc.); safe-area insets via `env(safe-area-inset-*)`.

## Verification workflow

1. `npm test` — all engine/store tests green.
2. `npm run build` + `npx tsc -b` — clean.
3. Verify UI changes in the browser at mobile viewport (375px), in **both** light and dark color schemes. Play a real flow (setup → rounds → pit → return game → winner + payments); check persistence by reloading.
4. Delete any test games you created in the browser afterwards.

## Deployment

GitHub repo `BTenT/scorekeeper` is connected to Vercel: **every commit pushed to `main` auto-deploys to production.** Only push verified work. No CI beyond that — the test suite runs locally.
