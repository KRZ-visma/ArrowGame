# ARROW OUT

A minimalist arrow-escape puzzle. White bent arrows lock together on a black board — tap one and it slides off in the direction of its tip, but only when nothing blocks the path.

## Play

Open `index.html` in a browser (or serve the folder):

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Controls

- **Click / tap** an arrow to send it flying
- **Undo** — reverse the last move
- **Reset** — restart the level
- **Skip** — jump to the next level
- Shortcuts: `Ctrl/Cmd+Z` undo, `R` reset

## How it works

Each arrow is a rigid polyline. When you click it, the whole shape translates in the tip direction. If any other arrow occupies a cell along that sliding path, the move is blocked (shake). Clear every arrow to finish the level.
