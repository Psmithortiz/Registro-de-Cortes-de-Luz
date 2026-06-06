# Registro de Cortes de Luz

A 100% offline browser-based tool to log residential power outages and prepare
evidence for formal complaints to Chile's SEC (Superintendencia de Electricidad
y Combustibles).

Designed for use during outages themselves: opens directly in any browser,
persists locally, requires no internet after the initial load.

## Why this exists

I live on a rural property in Vilcún, La Araucanía, where power outages from
storms are frequent. The SEC's complaint process requires evidence —
timestamps, durations, and the folio number from the prior complaint filed
with the distribution company (CGE in my case). Tracking this by hand across
multiple outages is error-prone, and any solution that requires internet
defeats the purpose when there is no power.

This app records each outage with start/end timestamps generated from the
device clock, persists everything to `localStorage`, and lets the user
attach the distribution-company complaint folio to each outage for later
SEC submission.

## Stack

- **Vanilla JavaScript (ES Modules)** — no frameworks, no build step
- **HTML + CSS** — single page, served as static files
- **`localStorage`** — full persistence, ~5 MB budget shared across all data
- **Browser-native APIs only** — no external libraries

## Features

- Register an outage with a single click; close it with the same button
  (the button switches between "Registrar corte" and "Terminar corte"
  depending on whether an outage is currently active)
- Live "outage in progress" panel showing start time
- Historical log of closed outages with formatted dates and durations
- Inline editing per outage: notes and complaint folio from the distribution
  company
- Delete individual records (event delegation, no per-row listeners)
- User configuration form (titular, address, distributor, customer number)
  persisted separately from outage data
- Single-active-outage invariant enforced in code (matches physical reality:
  the power is either out or not)

## Project structure

```
registro-cortes/
├── index.html
└── js/
    ├── corte.js          ← Corte class with crear() / desdeDatos() factories
    ├── persistencia.js   ← localStorage adapters with defensive fallbacks
    └── app.js            ← orchestrator: state, listeners, render loop
```

## How to run

Open `index.html` in any modern browser. For local development with ES Modules,
serve it from a local web server (WebStorm's built-in server works; opening
the file directly with `file://` will fail because of CORS restrictions on
module imports).

## Key design decisions

- **`localStorage` over `IndexedDB`.** Data is small (text-only outage
  records), the synchronous API is simpler, and the 5 MB budget is plenty
  for years of outages. `IndexedDB` would be necessary only if storing
  uncompressed images, which is explicitly avoided.

- **ES Modules over a single script.** Even at this scale, splitting domain
  (`corte.js`), persistence (`persistencia.js`), and orchestration (`app.js`)
  pays off. Mirrors the same separation used in the Python projects in this
  portfolio.

- **Factory methods on `Corte` (`crear` / `desdeDatos`).** A single
  constructor cannot serve both "new outage from a button click" and "outage
  reconstructed from stored JSON" — the first generates new timestamps, the
  second must preserve the originals. Splitting into named static factories
  is the standard JS workaround for the absence of constructor overloading.

- **Defense in depth on `cargarCortes`.** Three layers: an explicit null /
  empty-string / `"undefined"` guard, then a `try/catch` around `JSON.parse`,
  then graceful fallback to an empty array. The middle layer matters because
  `JSON.parse(localStorage.getItem(missing))` does not throw for `null` — it
  returns `null` and downstream code (`.map`) breaks. Learned the hard way.

- **Event delegation for per-row buttons.** A single click listener on the
  history container handles edit / delete / save / cancel actions across all
  outage rows. Buttons are tagged with `data-id` and `data-accion`; the
  listener routes by action. Avoids polluting `window` and survives every
  re-render with zero extra wiring.

- **UI state in a single variable (`idCorteExpandido`).** Which outage row
  is currently expanded for editing is treated as application state, not as
  DOM state. The render function reads it and decides per row whether to
  draw the collapsed or expanded template. Same principle as a state-driven
  framework, applied manually with vanilla JS.

- **`reclamo` as a plain object, not a class.** Following YAGNI: no methods,
  no validation logic, single shape across the app. Promoting it to a class
  would add ceremony without benefit at the current scope.

- **All complaint fields optional.** The app does not gate saving on folio
  presence. Real-world reasons: complaint filed by phone (no folio yet),
  screenshot taken but folio still pending, user wants to log a note without
  having complained yet. The app's job is to record reality, not enforce
  SEC's rules at input time.

- **Type coercion at the edge.** `data-id` arrives from the DOM as a string,
  but `Corte.id` is a number from `Date.now()`. Without `Number()`
  conversion, `=== ` comparisons silently fail. This is documented because
  it's a recurring class of bugs in browser code.

## TODOs

- [ ] Screenshot upload per outage (compressed in-browser via `<canvas>`
  before storage to stay within the `localStorage` budget)
- [ ] SEC report generation: print-friendly view using `window.print()` and
  `@media print` CSS, exportable to PDF via the browser's native dialog
- [ ] Hide the configuration form behind a toggle button (data entered once,
  no need to occupy permanent screen space)
- [ ] General CSS pass for layout and mobile responsiveness

## License

MIT