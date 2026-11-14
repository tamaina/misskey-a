# markup

MFM、メンション、リンクとURLプレビュー、コードの表示と編集、シンタックスハイライト、MFMの装飾とパラメーター。

## Standalone MFM (Node)

`backend/standalone-mfm.ts` exports `renderStandaloneMfm(text, options)`.
It uses the same `createMfmRenderer` AST-to-Vue implementation as the application
and embed, then `vue/server-renderer` and Juice. It does not use `MfmService.toHtml`.
The result contains `html` (including a retained style element), `css`, and a
manifest of emoji `resources`. The caller should supply the plain-text MIME part
separately and use this same function for previews and eventual outgoing mail.
This module does not itself send mail or replace existing notification rendering.

Required options: `instanceUrl`. Optional inputs: `locale`, `timeZone`, `animated`,
hexadecimal `theme` colors, pre-resolved `emojiUrls`, and an asynchronous trusted
`highlight(code, language)` callback returning text or Vue nodes. Highlighting is
completed before SSR. Missing emoji render their shortcode. Relative image and
link URLs are resolved against the instance origin; only HTTP(S) images and
HTTP(S)/mailto links are emitted. The renderer never fetches resources. Callers
must authorize resource access before preparing them, especially private/CID
attachments. Raw HTML is not an input. A highlighter is trusted server code, not
an API-supplied callback.

The shared MFM stylesheet lives in `frontend/shared/mfm.css`; browser adapters
import it statically through the normal bundler, while standalone scopes its rules
under `.misskey-mfm` and resolves theme variables before inlining. After changing
CSS, run `node packages/features/markup/scripts/generate-mfm-styles.mjs` to update
its generated TS representation. A byte-parity test prevents stale output. This
avoids runtime style injection, separate Node CSS asset copying, and CSS-module
hash differences. Animation
keyframes, hover/pseudo-element rules, and reduced-motion media rules are retained.

Known differences from the interactive application:

- Sparkle uses deterministic CSS stars rather than measured/random DOM particles.
- Mentions are static links without fetched avatars or profile menus.
- Unicode emoji use the recipient's emoji font rather than a fetched image set.
- Times are absolute and locale/timezone explicit (UTC by default), never a live clock.
- Clickable MFM keeps readable content but has no event action in SSR HTML.
- Code is escaped monospace unless a trusted highlighter is supplied.
- Browser rendering preserves transforms/animations; mail clients may strip these,
  styles, pseudo-elements, or remote images. Identical mail-client rendering is not
  promised. Browser screenshot comparison and a real mail-client matrix remain
  necessary before claiming visual parity.

Focused Node tests (no frontend app build, DOM, configuration mock, or component
stubs required), from the repository root:

```sh
node packages/frontend/node_modules/vitest/vitest.mjs run \
  --config packages/features/markup/test/vitest.standalone.config.mjs
```
