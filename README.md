# Floppr 🦛

A cosy daily browser game about movie budgets. Each day you get 7 real films: guess each one's production budget, then call whether it was a Flop, Even, Hit or Smash at the worldwide box office. Closer guesses climb Pip the hippo higher up the diving board; after film 7 Pip dives — swan dive, cannonball or belly flop.

Play: https://optimusslimes.github.io/floppr/

- Plain static site (HTML/CSS/JS), no build step. Music and sound are generated live with the Web Audio API.
- Budget and worldwide gross figures come from English Wikipedia infoboxes (each film links its source; budget ranges use the midpoint). Figures are not inflation-adjusted.

## v2 (Big Update)
- Score is altitude: every guess climbs 150 m–3 km, ⚡ Updraft multiplier (×1→×6) from calls, Headliner ×2 on film 7 (with a right call). Perfect day 103.5 km.
- Shelf → fine-tune guide with 3 real comparable films (comps.js, Wikipedia-sourced), Ask the Producer lifeline (1/day).
- 8 altitude bands (Studio Lot → Space) with props, ladder materials, title cards and a postcard album.
- Game feel: trauma camera shake + hit-stop (scene layer only), wind gusts above 800 m, descent montage, canvas FX layer.
- Postcard PNG share, `?vs=<day>.<metres>` challenge flag, streak freezes, rehearsal round, reduced-motion support.
- Debug: `?debug=alt:35000`.
