<!-- SPDX-FileCopyrightText: misskey-project -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# OIDC acceptance

Use a synthetic/test provider and synthetic local accounts. Never change a real
user's security settings for this checklist. Do not merge/deploy as part of it.

- In administrator settings create a disabled provider with a name. Register its
  displayed redirect URL at the test IdP, then save client details and enable.
  Reload: the secret must stay blank. Concurrent stale provider edits must fail.
  Disable and unlink all identities before explicitly erasing its saved secret;
  erasure while enabled/linked and stale versions must fail. Blank save must
  preserve the existing secret.
- Public login lists enabled providers. Cancel at the IdP and retry from the
  beginning. Browser back/KeepAlive and delayed callbacks must not complete an
  abandoned login or open the old native authentication UI.
- A linked account with local TOTP/passkey/recovery requires that local factor.
  UP-only is permitted only as a second factor after the verified external
  primary. Passwordless primary and local management's strict paths stay strict.
- Unknown subjects, including a verified IdP email equal to an existing local
  email, must not log into or automatically link that account.
- New registration requires local password, terms/rules, CAPTCHA/invitation when
  enabled, and the local confirmation email. Wrong code can be corrected; expired
  state requires a fresh start. Forced failure must not leave half-created users.
- Log into an existing account locally, choose link, authenticate externally,
  review the exact issuer/subject and explicitly agree. Local sudo is required.
  Changing accounts/revoking the session during the roundtrip must reject linking.
- Unlink after local sudo; keep another usable login method. A proof captured
  before unlink/relink must not issue a session afterward.
- Repeat code/callback/completion and race two browsers for the same identity.
  There must be at most one consume/account/link/session owner as appropriate.
- Disable/change provider settings while pending. Completion must fail without
  granting a session. Existing sessions remain separately revocable in settings.
- Only server-configured private-network CIDRs may authorize internal IdPs.
  DNS rebinding, mismatched TLS, redirects and cross-origin metadata must fail.

Physical browsers, authenticators, device transfer, production SMTP and a real
IdP have not been exercised merely by adding the synthetic fixtures.
