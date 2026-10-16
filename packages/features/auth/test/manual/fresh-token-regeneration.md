# Fresh passkey token regeneration acceptance

Use only an explicitly authorized disposable test account and instance. These
steps describe pending physical-device acceptance; they have not been executed
against real users. Enabling independent MFA is outside this slice.

1. Sign in twice with individual browser sessions, retain a third session for a
   different disposable account, and register an owned test passkey.
2. Open Security settings and choose the passkey token-regeneration action.
   Confirm the current password is requested before native required-UV WebAuthn.
3. Complete strict UV. Both sessions of the selected account must lose access
   after the commit; the unrelated account remains signed in. No replacement
   credential or reusable grant appears in the completion response.
4. Repeat after signing in again; cancel password entry/native UI, reject UV,
   expire the challenge, or leave and return to the KeepAlive page before the
   native result. No protected completion or automatic legacy fallback may run.
5. Revoke the originating session or change password/factor policy while the
   ceremony is pending. Completion must fail without token/session mutation.
6. Check supported browsers and physical authenticators, including cross-device
   passkeys. Record versions, outcome and timing without credentials or tokens.

Automated tests separately cover exact purpose/session binding, Redis replay,
real signed WebAuthn, PostgreSQL lock races, concurrent distinct-key attempts and
transaction rollback after token/session writes. They do not replace these
physical-device checks.
