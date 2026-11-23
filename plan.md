# OmniFlow AI

## Implementation plan

OmniFlow is a managed React/Express/tRPC web app for a focused multimodal AI workspace. The first release includes a persistent-looking conversation sidebar, a real server-side LLM chat procedure, a creative image-generation mode backed by the managed image service, markdown answers, copy actions, responsive layout, empty/loading/error states, and explicit trust language for uncertainty and high-stakes topics. The client sends chat history to the server; the server owns platform credentials and calls `invokeLLM` or `generateImage`. Generated image URLs are returned for preview in the current session.

Project structure:
- `client/src/pages/Home.tsx`: primary responsive workspace, mode switching, thread UI, composer, creative controls.
- `client/src/index.css`: Obsidian Signal visual system, responsive layout utilities, motion, and typography.
- `server/routers.ts`: public `ai.chat` and `ai.generateImage` procedures.
- `public/manus-routes.json`: page route manifest.
- `plan.md`, `TODO.md`: implementation record and outcome criteria.

## Design direction

Three possible styles:
- Obsidian Signal — 0.04: dark command-center surfaces, cyan signal accents, editorial precision.
- Paper Circuit — 0.03: warm research notebook with cobalt controls.
- Aurora Workshop — 0.02: near-black creative studio with violet/mint glow.

Chosen: **Obsidian Signal**.

- Design movement: technical editorial command center with restrained glass surfaces.
- Core principles: signal over noise; calm hierarchy; visible system state; creative power without visual clutter.
- Color philosophy: deep navy-black grounds long sessions; cyan is reserved for active intelligence and actions; warm white text protects readability.
- Layout paradigm: asymmetric shell with a narrow utility rail, expansive conversation field, and a right-side capability panel that collapses on small screens.
- Signature elements: cyan hairline signal mark; soft radial glow behind the active workspace; compact uppercase labels for system state.
- Interaction philosophy: every control explains its mode; sending feels deliberate; loading states name the work being done.
- Animation: short ease-out reveals, low-amplitude pulse on live status, no distracting looping motion.
- Typography: Space Grotesk for headings and labels, Inter/system sans for body copy, monospace for metadata and code.
- Brand essence: an AI workbench for thinking, making, and checking — precise, capable, and candid. Personality: lucid, technical, composed.
- Brand voice: “Make the next move clearer.” / “Strong answers, with the edges labeled.”
- Wordmark & logo: an angular `O` signal loop paired with a small cyan pulse bar.
- Signature brand color: electric cyan `#35D0FF`.
