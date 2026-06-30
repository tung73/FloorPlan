# FloorPlan

Three.js apartment shell built from the supplied `floorplan.png` reference.

## What is included

- 3m high exterior and interior walls
- Room partitions for living/dining, kitchen, bathroom, bedroom 1, master bedroom, and balcony
- Door/window openings represented by split wall segments
- Balcony railing, basic glass/door markers, labels, lighting, and orbit controls
- The original floor plan shown as a low-opacity reference plane under the model

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal.

## Build

```bash
npm run build
```

## GitHub Pages

This project is configured for free hosting on GitHub Pages at:

```text
https://tung73.github.io/FloorPlan/
```

After this setup is merged to `main`, enable Pages in the repository settings:

1. Open **Settings > Pages** in GitHub.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.