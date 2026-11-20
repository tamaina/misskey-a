# Import a new material from Anki (#359)

Upload an Anki `.apkg` to your Drive, then select **Import an Anki deck (.apkg) from Drive** in Fukushu. Confirm to copy the cards as a **new** private study material. The original remains in Drive; this is not a backup restore or a merge into an existing deck. **Default ordinary-user Drive roles do not allow `application/zip`, the MIME detected for Anki exports.** This feature can use an already-owned original; it does not change upload permissions, disguise files, or enable arbitrary ZIP uploads.

### What is supported

* One populated deck with 1–1,000 untagged, unflagged, stock Basic cards (English `Front`/`Back` template with literal text). The exact packaged examples were exported with Anki 25.09, both legacy (anki21) and current (21b).
* Copy question/answer text and the deck name. Start fresh in Fukushu: no Anki due dates, scheduling settings, suspended/buried state, FSRS state or review replay. Empty deck hierarchy, unused note types and Anki collection settings are not copied.
* Refuse the whole import for custom templates, HTML, media, tags, multiple populated decks or review history. Do not silently remove unsupported cards to make the package fit.
* The input cap is the reader's 256 MiB compressed limit, not a split size; existing Drive and native-material bounds (including 1 MiB of validated material) also apply.

### Queue and persistence

The existing owner-bound queue stores the accepted file ID, declared size and MD5, not the archive. The worker rechecks ownership, rejects links, spools the recorded original to a private temporary directory, verifies the bytes, then passes them to the published archive reader in a separate, time-limited Node process. Its result is plain data; no DOM, scripts, HTML or SQL from the deck are executed by the Misskey server as application code. SQLite decoding uses the reader's matching bundled dependency/WASM. The spool is removed on success or failure.

The Drive identity is checked again in the owner-locked transaction which saves the deck, questions and completion receipt together. Replaying a completed request uses the receipt; a new request for the identical archive cannot create another deck for that owner. Request IDs are not reusable for other files or formats. Sharing/deduplication across owners is outside this pilot.
