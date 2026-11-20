# SPDX-FileCopyrightText: misskey-project
# SPDX-License-Identifier: AGPL-3.0-only

"""Generate non-user APKG samples with the official Anki exporter (anki==25.9)."""
from pathlib import Path
from tempfile import TemporaryDirectory

from anki.collection import Collection
from anki.import_export_pb2 import ExportAnkiPackageOptions

here = Path(__file__).parent
with TemporaryDirectory() as directory:
    collection = Collection(str(Path(directory) / "collection.anki2"))
    try:
        deck = collection.decks.id("取込テスト")
        model = collection.models.by_name("Basic")
        for front, back in [("同じ質問", "最初の答え"), ("別の質問", "安全なプレーンテキスト")]:
            note = collection.new_note(model)
            note.fields = [front, back]
            collection.add_note(note, deck)
        for legacy, filename in [(True, "basic-anki21.apkg"), (False, "basic-21b.apkg")]:
            collection.export_anki_package(
                out_path=str(here / filename),
                options=ExportAnkiPackageOptions(legacy=legacy),
                limit=None,
            )
        note.tags = ["not-supported"]
        collection.update_note(note)
        collection.export_anki_package(
            out_path=str(here / "tagged-21b.apkg"),
            options=ExportAnkiPackageOptions(legacy=False),
            limit=None,
        )
    finally:
        collection.close()
