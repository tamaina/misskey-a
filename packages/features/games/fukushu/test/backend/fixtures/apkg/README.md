# Anki package fixtures

The basic and tagged synthetic flashcards were exported by the official Anki 25.09 Python
package. They contain no personal data, media or scheduling history. The
tagged fixture verifies that unsupported source data is rejected, not dropped.

For the separate complex source fixture, see [generated-anki-25.09.md](generated-anki-25.09.md).

To regenerate the basic and tagged fixtures, install `anki==25.9` in a Python environment and run
`python generate.py`. Generated Anki IDs and timestamps can differ.
