# The Belly Trap

A tiny responsive browser game. Hold the cat's belly (mouse, touch, or Space), then release as soon as its eyes open. Clean escapes build your current run; your best score is saved in localStorage on this browser. No account, backend, dependencies, or build step.

## Play immediately

Open `play.html` directly in Chrome, Firefox, Edge, or Safari. It is the complete game in one file, with no server, installation, or network requests. File-based storage support varies by browser; when unavailable the score lasts for the current visit.

## Local development

```sh
npm start
```

Open http://localhost:3000. Use `PORT=3001 npm start` to choose another port. For a phone on the same network, open your computer's LAN IP on port 3000.

```sh
npm test
```

The UI contains only the cat, current and best scores, and a small guide. After an attack, release and press the belly again to play another round.

## Animation

The kitten is one articulated SVG character. A continuously evaluated pose system drives its spine, shoulders, wrists, hips, head, ears, eyelids, jaw, and retractable claws. Belly rubbing produces full-body rolling, alternating leg kicks, paw play, and responses to finger movement. The belly hit area follows the moving torso.

An attack uses anticipation, a forward leap with foreshortened limbs, a paw swipe, recoil, landing, and a roll back onto its back. The same drawing remains visible at full opacity for the whole sequence. No raster images, character swaps, crossfades, or WebGL are used.

Reduced-motion preferences suppress the rolling and camera-directed leap. Sound begins on interaction and is synthesized locally using Web Audio; press M to mute or unmute. Existing sound preferences are preserved.

A successful release closes the eyes and returns the kitten to sleep. Current time counts up while rubbing and freezes when the eyes open. A clean escape banks that time and updates the best score; the next rub continues the same run. Releasing before the eyes open keeps the run, its banked time, and its stage, but forfeits that touch's unbanked time. The wake-up countdown pauses rather than restarting, so lifting and pressing again cannot dodge it, and rapid tapping banks only the instant before the eyes open. Getting caught or an interrupted gesture clears the current run and resets difficulty. Unbanked time never improves the best. The best score persists across visits; a reload starts a fresh run. The legacy lifetime total is not migrated into a best score because it used different rules, but the sound preference is preserved.

Every two successful escapes advances a stage, capped at stage five. Reaction windows are 330–460, 300–410, 270–365, 240–325, and 220–290 milliseconds. Eyes open over 65 milliseconds. Warnings start after a random 650–3,700 milliseconds in stage one, decreasing to 350–2,500 milliseconds in stage five. Actual elapsed time governs deadlines, including releases between animation frames. Pointer capture, pointer cancellation, tab visibility, and focus changes are handled. Storage failure limits the best to the current visit.

The vector illustration includes shaded fur, fine tabby markings, tufts, ear hairs, padded paws, iris detail, and dimensional mouth and claw shapes. All details belong to the existing articulated groups and follow the same continuous animation in every state.

## Deploy on Vercel

Import `langley-2/cat` into Vercel as a new project. Use **Other** for Framework Preset. The included `vercel.json` sets **Build Command: `npm run build`** and **Output Directory: `site`**. No environment variables or dependencies are required. Use Node.js 22 or newer. Vercel deployment is managed by the repository owner.

The build generates `site/index.html`, a single page containing the game, styles, character, audio code, and favicon. It works at the project root and behind a `/cat` rewrite without asset-path conflicts. Source modules remain in `dist/` for local development.

After deploying, test the production `*.vercel.app` URL on desktop and iPhone. The source has automated game, animation, and app wiring checks; this workspace could not run a fresh browser test.

## Serve at langley.wyrk.work/cat

Keep `langley.wyrk.work` assigned to the existing portfolio project. In that project's routing configuration, merge these rules with any existing rules, before a catch-all. Replace `YOUR-CAT-PROJECT.vercel.app` with the game's stable production domain, not a temporary preview URL:

```json
{
  "rewrites": [
    { "source": "/cat", "destination": "https://YOUR-CAT-PROJECT.vercel.app/" },
    { "source": "/cat/", "destination": "https://YOUR-CAT-PROJECT.vercel.app/" }
  ]
}
```

These rules belong to the **portfolio project**, not this game. Adapt them to the portfolio's framework routing if necessary; do not replace its existing configuration wholesale. No DNS change is required. The game's production deployment must be accessible to visitors for this rewrite to work. This repository does not change the portfolio or deploy anything automatically outside your configured Vercel integration.

Best scores are stored per browser origin, so records on the Vercel domain and on `langley.wyrk.work` are separate.

## Assets

The cat is original SVG illustration, served locally. No remote fonts, trackers, or asset requests.

To regenerate the standalone game after edits, run `npm run bundle`.
