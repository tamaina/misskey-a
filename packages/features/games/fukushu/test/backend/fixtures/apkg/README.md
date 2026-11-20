# Anki package fixtures

These synthetic flashcards, authored for this repository, were exported by the
official [Anki 25.09 Python package](https://pypi.org/project/anki/25.9/). They
contain no personal data, media or scheduling history. Embedded stock templates
and other defaults come from [Anki 25.09](https://github.com/ankitects/anki/tree/25.09)
(Ankitects Pty Ltd and contributors, AGPL-3.0-or-later).

- `basic-anki21.apkg` / `basic-21b.apkg`: English stock note type with Japanese
  literal card content (control); `tagged-21b.apkg` checks that tags are rejected.
- `basic-ja-anki21.apkg` / `basic-ja-21b.apkg`: actual Japanese stock note type
  from a fresh Japanese-language Anki collection, exported unchanged.
- `custom-ja-21b.apkg`: the same Japanese note type with the question switched
  to reference `裏面`. Anki exports it normally; Fukushu must reject it.

For the separate complex source fixture, see [generated-anki-25.09.md](generated-anki-25.09.md).

To regenerate the synthetic card fixtures, install `anki==25.9` in a Python environment and run
`python generate.py`. Generated Anki IDs and timestamps can differ.
