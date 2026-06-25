# Elvis — character reference

The in-game lead dog is matched to the real **Elvis**. Drop the actual reference photos in this
folder (e.g. `elvis-1.jpg` … `elvis-4.jpg`) so the look stays locked if the model is ever retuned.

## Appearance (used to build `src/husky.js` + the Elvis spec in `src/config.js`)

- **Breed / build:** Siberian husky, **wooly (long) coat**, small — about **30 lb**. Compact, fluffy
  silhouette rather than a tall racing-line husky.
- **Coat:** **pure white with a warm cream cast** (`#f3efe6` top / `#ffffff` underside). Long,
  soft, fluffy fur — a full neck ruff and chest floof, plumed curled tail.
- **Eyes:** **bright husky blue** (`~#6fb7e8`), with distinct **dark "eye-liner" rims** (the black
  skin around the eyes that gives the classic husky expression).
- **Nose:** black, slightly **pink/speckled ("snow nose")**.
- **Ears:** erect, triangular, fluffy, with a **warm cream tint on the tips/edges**.
- **Mouth/lips:** dark.

These traits are encoded as the `ELVIS` object in `src/config.js` (`wooly: true`, warm-white coat,
blue eyes) and rendered by `createHusky()` in `src/husky.js`. Recruited teammates reuse the same
model with different coat/eye palettes.
