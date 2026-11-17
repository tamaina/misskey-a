<!-- SPDX-FileCopyrightText: syuilo and misskey-project -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Media browser regression

After the normal frontend dependency/icon builds, run from `packages/frontend`:

```sh
node --import tsx test/browser-feature/media.mjs
```

The fixture uses the real CW button, media list, lightbox, image/Blurhash components,
VVI, CSS and Blurhash workers. A synthetic popup host mirrors the application's
reactive props; account/configuration, menus and navigation are isolated adapters.
All images are synthetic data URLs. Non-loopback network requests fail the test.

Checks cover initially hidden CW layout, repeated CW toggles, individual reveal/hide,
lightbox navigation and reveal persistence, narrow viewport sizing, and full/average
Blurhash pixel buffers after a dimension change. This is component-browser coverage,
not a logged-in full-server E2E. Unported media-TL/AI policies remain outside scope.

`MISSKEY_TEST_CHROMIUM` may select an existing browser binary, and
`MISSKEY_MEDIA_SCREENSHOTS` saves review screenshots. Chromium runs headless with
one fixture context at a time and worker concurrency capped at two reported cores.
