# Kiwari slides

Mathematical slides in the cedar, washi-paper, and Garamond style of [Michael Ruofan Zeng’s website](https://zengrf.github.io). Includes a small starter talk, a visual Markdown/LaTeX editor, drag-and-drop slide organization, undo/redo, layout and image controls, theorem environments, editable diagram labels, speaker notes, section navigation, formatting help, and a separate static audience exporter.

Read [Slide-writing guidelines](SLIDE-WRITING-GUIDELINES.md) for the mathematical and editorial discipline behind the toolkit.

## Start a talk

Requires Python 3.10 or later. Install the small tooling dependencies in a virtual environment:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python tools/serve.py
```

Open the printed localhost URL. Click **Edit** or press **E**. Edit text, formulas, theorem titles, diagram text and labels, or recorded code output. Click **Save to server** / **⌘S** / **Ctrl+S** to save to this directory. Saves keep backups under `.local/` and reject stale revisions. The local server binds only to your machine; it is not a public hosting service.

Alternatively, open `index.html` directly for browser drafts and YAML import/export. After editing `deck.yaml` externally, run `python tools/sync.py` to refresh the direct-file fallback.

Copy this repository for each talk. Change `deck.yaml`, then preview every affected slide. The starter examples are deliberately short; `figures.js` provides reusable mathematical diagrams and an animated tangent-conic title illustration. Fonts and rendering libraries are bundled with their licenses.

## Organize and arrange slides

Choose **Organize** to see slide thumbnails, search, and drag slides by their handles. Mouse, touch, and keyboard are supported; a focused handle accepts ↑ / ↓ and Home / End. Select several slides or **Select section** to move, duplicate, or delete them together. **First**, **Last**, and **Position** move the selection directly. Add slides or section dividers from the same window.

In **Edit**, open **Slide layout & spacing** for one, two, or three columns; title/body/heading sizes; margins, line and paragraph spacing; alignment; and two-column proportions. **Arrange columns & panels** edits and reorders the blocks separated by `---`. **Image size & crop** adjusts an individual image without changing the original asset. The fit indicator flags content outside the slide's safe area. Empty settings preserve the existing design; reset controls remove only layout adjustments.

**Undo / Redo** includes content, layout, slide order, additions, duplication, and deletion. Use ⌘Z / Ctrl+Z outside a text field; text fields keep native text undo. History lasts for the editing session. Use **Save to server** to publish changes to the authoring directory. Browser drafts survive reloads, and a stale save cannot overwrite a newer server revision.

Layout overrides are stored in the optional per-slide `design` object and survive YAML export/import, printing, and audience export. For example:

```yaml
design:
  preset: columns-2
  bodySize: 28
  columnGap: 32
  columnRatio: 55
  images:
    assets/photo.jpg:
      height: 300
      fit: cover
      x: 50
      y: 40
```

The toolkit keeps Kiwari's existing theme and starter slides; the editor modules use the theme's color and font variables.

## Authoring fields

- `id`: stable slide link; `title`, `kicker`, `body`: visible Markdown/LaTeX.
- `layout`: `title`, `section`, `problem`, `standard`, `split`, `theorem`, or `result`.
- `statement_label`, `statement`: editable environment heading and content; place `PAPERSTATEMENT` in the body to position the environment.
- `visual`: diagram name; `visual_text`: per-slide text and LaTeX overrides edited through **Diagram text and labels**.
- `code_title`, `code`, `code_result`: displayed code, heading, and recorded LaTeX output. The starter does not execute code.
- `notes`, `minutes`, `central_message`: preparation and presenter information; excluded from audience exports.
- `class`: optional layout styles; `nav_title`: short navigation name for a section divider.

Use `$…$`, `$$…$$`, Markdown blockquotes, and the **?** formatting menu. Every authored diagram label has an editing field; duplicated slides have independent overrides. When changing a diagram’s DOM structure in code, review existing `visual_text` bindings, whose keys identify nodes in that diagram.

The authoring app has **P** for a presenter window, **O** for overview, **F** for fullscreen, **T** for lighting, and browser print for a PDF. Arrow keys and swipe gestures navigate.

## Publish an audience deck

Install Chrome or Chromium (or set `CHROME` to its executable), then run:

```sh
python tools/export_audience.py . dist
python -m http.server 8000 --directory dist
```

The output contains pre-rendered slide HTML and mathematics, local assets, and audience navigation. It contains no editor, presenter notes, original deck data, save service, or backend calls. Publish the contents of `dist/` to GitHub Pages or another static host. Print that audience page for a PDF containing exactly the released slides.

Do not publish the authoring directory when an audience-only release is intended. The exporter deliberately copies an allowlist of assets rather than every working file. Bundle any custom static iframe app at its referenced relative path.

Recorded Macaulay2 runs can be supplied using `--recordings PATH`; see [recordings](docs/RECORDINGS.md). The export never executes an audience member’s code. Other computation engines can use the same pattern: store actual results, retain their provenance, and let the browser inspect the saved data.

## Verify before release

Compare the exported slide count and text with the saved source; inspect formulas and dense slides at presentation size; test navigation and mobile controls; disconnect the network after loading and test the recorded interactions; check that no editor, notes, or API requests remain; and verify public links after deployment. The `release.json` file records the source hash and recording provenance.

## License

Toolkit code and documentation are MIT licensed. Vendored fonts, KaTeX, Marked, and JS-YAML retain their own licenses under `lib/`. The theme and guidelines are by Michael Ruofan Zeng; the original talk was based on joint mathematical work with Arkamouli Debnath.
