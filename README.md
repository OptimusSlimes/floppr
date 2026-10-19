# Floppr 🦛

A cosy daily browser game about movie budgets. Each day you get 7 real films: guess each one's production budget, then call whether it was a Flop, Even, Hit or Smash at the worldwide box office. Closer guesses climb Pip the hippo higher up the diving board; after film 7 Pip dives — swan dive, cannonball or belly flop.

Play: https://optimusslimes.github.io/floppr/

- Plain static site (HTML/CSS/JS), no build step. Music and sound are generated live with the Web Audio API.
- Budget and worldwide gross figures come from English Wikipedia infoboxes (each film links its source; budget ranges use the midpoint). Figures are not inflation-adjusted.

## v2 (Big Update)
- Score is altitude: every guess climbs 150 m–3 km, ⚡ Updraft multiplier (×1→×6) from calls, Headliner ×2 on film 7 (with a right call). Perfect day 103.5 km.
- Compact card (v3): one-row shelf strip → fine-tune slider (or type it) → one-row Flop/Even/Hit/Smash call; Ask the Producer lifeline (1/day). The card slides away during every climb and the dive.
- v3: 6 dives chosen by final altitude (Belly Flop → Cannonball → Front Flip → Superhero → Starfish Twister → Re-entry Triple) with freeze-frames and judges' cards; 37 real-world landmarks (landmarks.js, each with a Wikipedia source) pop up as Pip passes them.
- 8 altitude bands (Studio Lot → Space) with props, ladder materials, title cards and a postcard album.
- Game feel: trauma camera shake + hit-stop (scene layer only), wind gusts above 800 m, descent montage, canvas FX layer.
- Postcard PNG share, `?vs=<day>.<metres>` challenge flag, streak freezes, rehearsal round, reduced-motion support.
- Debug: `?debug=alt:35000`.
