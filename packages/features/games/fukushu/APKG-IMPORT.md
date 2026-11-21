# Import a new material from Anki (#359, #361)

Upload an Anki `.apkg` to your Drive, then select **Import an Anki deck (.apkg) from Drive** in Fukushu. Confirm to copy the cards as a **new** private study material. The original remains in Drive; importing never overwrites or merges a deck. The default Drive policy allows recognized Anki packages as `application/x-anki-package`; custom server and role policies, size and quota limits still apply. Arbitrary ZIPs remain blocked by default.

Drive checks the bounded ZIP envelope, Anki metadata and the collection signature before classifying a `.apkg` upload. Use the original Anki export, not a repacked, encrypted, split or ZIP64 archive. The filename or submitted media type alone is insufficient. Stored objects and Drive responses use binary attachment downloads rather than previews.

### What is supported

* One populated deck, 1–1,000 cards and up to 1 MiB of validated material. The full published `@aqz/anki-reader/node` converter resolves static field substitutions and supported template constructs. Tests use genuine Anki 25.09 exports in legacy (anki21) and current (21b) format.
* Keep the unchanged plain representation for previously supported English and Japanese literal-text Basic cards. For static templates store the processed front and back, note type, tags, sanitized CSS and source IDs/template provenance separately from their plain-text projections. The original file remains the source for full raw note fields and Anki settings.
* Static cards support a subset of plain HTML formatting, simple class/ID and layout-free CSS. The browser reconstructs permitted markup and limits which CSS rules are applied. It renders in an opaque-origin iframe with a policy that disables scripts and network requests. Raw provenance is never used to render cards.
* This slice rejects packages with multiple populated decks, unsupported media, review history, flags or unsafe/unsupported content and conversion warnings. It does not execute Anki JavaScript or carry due dates, scheduling settings, suspensions or FSRS state over. Dynamic or typed-answer templates are not supported. The app starts a fresh study history.
* Input is bounded by the reader's 256 MiB compressed limit, not a split size; existing Drive and native-material bounds still apply. The entire import fails if data cannot be represented within this slice instead of omitting cards.

### Experimental media support

* A deck may reference one static PNG and one RIFF/WAVE 16-bit PCM file, each up to 256 KiB. A side may display each once. SVG, animation, MP3, external files and arbitrary markup or CSS media are not supported. A WAVE file must have a single standard PCM format and data chunk, 8–48 kHz, mono or stereo. The current ceiling is approximately 2.7 seconds at 48 kHz stereo, or 16 seconds at 8 kHz mono. Larger, unused, mismatched or unsupported files reject the whole import; keep the APKG in Drive for later support.
* Each asset is verified as actual media, content-addressed and stored per deck under its owner's account. Card JSON only references the asset digest. Select the image or audio button to load it. Only verified PNG bytes may enter the restricted iframe; trusted outer study controls play verified WAVE bytes on demand without autoplay. No remote media is requested.
* Native **deck backup** v2 includes actual bytes once per asset and can restore without the original APKG. The existing 8 MiB backup cap remains. Decks without media still emit v1; v2 exports cannot be restored by older builds. The migration refuses to delete nonempty attachment storage on downgrade.

### Queue and persistence

The owner-bound queue carries the accepted original file ID, size and MD5, not the archive contents. The worker rechecks ownership, refuses links, spools the recorded original to a private temporary directory, verifies its bytes and reads it with the published package in a separate, time-bounded Node process with a non-executing per-call DOM. No external resources are loaded. The spool is removed on success or failure.

The Drive identity is checked again in the owner-locked transaction that saves the deck, cards, any attachments and completion receipt. Replaying a completed request uses the receipt; an identical archive does not make a second deck for that owner. Request IDs cannot be reused for another file or format. Native backups written by this build can include the optional template record; previous builds do not understand that new record. Backups of plain cards are unchanged.

### Next slices

1. **More media:** the next useful format is MP3. Start with measured synthetic and Anki fixtures before changing quotas. Use the already available FFmpeg toolchain, if supported across the package's actual deployment targets, only in an isolated, timeout- and byte-bounded local decode with no external protocols. Require a single MP3 audio stream, successful full decode, duration/sample bounds and metadata stripping or canonical output, not magic or ffprobe alone. If retaining many/larger assets would overrun native backup capacity, design the backed-up collection and byte-budget semantics separately before lifting limits.
2. **Review history:** preserve Source/Card/Revlog identity in a read-only imported history, separately from actual Fukushu answers and FSRS state. Reconcile raw, accepted, attached and skipped event counts; no inferred Anki due dates. Verify original retention, owner isolation, idempotent retries, backup round trip and a subsequent native review. An opt-in replay belongs in a separate design with a labeled, derived Fukushu baseline.
3. **Packages with multiple decks:** require atomic ownership/receipt state for the complete selection, retain source deck provenance and report skipped/unsupported contents before committing.

Cross-owner sharing and synchronization with later Anki exports remain separate work.
