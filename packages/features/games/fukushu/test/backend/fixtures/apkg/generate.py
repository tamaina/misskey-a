# SPDX-FileCopyrightText: misskey-project
# SPDX-License-Identifier: AGPL-3.0-only

"""Generate non-user APKG samples with the official Anki exporter (anki==25.9)."""
from pathlib import Path
from tempfile import TemporaryDirectory

from anki.collection import Collection
from anki.import_export_pb2 import ExportAnkiPackageOptions
from anki.lang import set_lang

here = Path(__file__).parent
set_lang("en")
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


# Set the actual backend language before creating a fresh collection so Anki
# itself assigns the stock field labels and template. Do not rename them manually.
with TemporaryDirectory() as directory:
    set_lang("ja")
    collection = Collection(str(Path(directory) / "collection.anki2"))
    try:
        deck = collection.decks.id("日本語版 標準テスト")
        model = collection.models.by_name("基本")
        assert model is not None
        assert [field["name"] for field in model["flds"]] == ["表面", "裏面"]
        note = collection.new_note(model)
        note.fields = ["日本の首都は？", "東京"]
        collection.add_note(note, deck)
        for legacy, filename in [(True, "basic-ja-anki21.apkg"), (False, "basic-ja-21b.apkg")]:
            collection.export_anki_package(
                out_path=str(here / filename),
                options=ExportAnkiPackageOptions(legacy=legacy),
                limit=None,
            )

        # This is valid for Anki, but does not have the stock question template:
        # the question uses the answer field rather than the front field.
        model["tmpls"][0]["qfmt"] = "{{裏面}}"
        collection.models.update_dict(model)
        collection.export_anki_package(
            out_path=str(here / "custom-ja-21b.apkg"),
            options=ExportAnkiPackageOptions(legacy=False),
            limit=None,
        )
    finally:
        collection.close()


with TemporaryDirectory() as directory:
    set_lang("en")
    collection = Collection(str(Path(directory) / "collection.anki2"))
    try:
        deck = collection.decks.id("Static custom")
        model = collection.models.by_name("Basic")
        assert model is not None
        model["name"] = "Custom vocabulary"
        model["tmpls"][0]["qfmt"] = '<div class="prompt">{{Front}}</div>'
        model["tmpls"][0]["afmt"] = '<strong class="answer">{{Back}}</strong>'
        model["css"] = ".prompt { color: navy; } .answer { font-weight: bold; }"
        collection.models.update_dict(model)
        note = collection.new_note(model)
        note.fields = ["箱", "box"]
        note.tags = ["synthetic"]
        collection.add_note(note, deck)
        collection.export_anki_package(
            out_path=str(here / "static-custom-21b.apkg"),
            options=ExportAnkiPackageOptions(legacy=False),
            limit=None,
        )
        model["tmpls"][0]["qfmt"] = '<a href="https://example.invalid/">{{Front}}</a>'
        collection.models.update_dict(model)
        collection.export_anki_package(
            out_path=str(here / "interactive-custom-21b.apkg"),
            options=ExportAnkiPackageOptions(legacy=False),
            limit=None,
        )
    finally:
        collection.close()
