> この個別 slice の履歴手順は、現在の共通本人確認 UI では [認証改修の実機受入確認](auth-completion.md) に置き換わります。旧 API の互換検証と現在の UI 受入確認を区別してください。

# Fresh email change acceptance

Pending physical-device checks, using only an explicitly authorized disposable
account/instance. No real-user settings or external delivery were used here.

1. Sign in with two individual browser sessions and register a disposable passkey.
2. Edit the email input. No authentication starts until an explicit save button.
3. Choose the passkey button, enter the current password, then complete required UV.
   The captured address becomes unverified, with a fresh verification email code.
4. Cancel either UI, reject UV, leave/return to the KeepAlive page while native UI
   waits, or try a competing save. No late completion or legacy fallback may run.
5. Change/revoke credentials or session, verify the previous code, or change the
   address in the other session while the ceremony waits. The old ceremony fails.
6. Confirm an old verification URL cannot verify a replacement address; each
   current code works only once. Removing an address respects instance policy.
7. Simulate delivery failure on a disposable mail sink. The committed address/code
   remain changed; a consumed proof is not reusable and retry requires a new save.
8. Record browser/authenticator versions and cross-device outcomes without secrets.

Account deletion, factor/recovery/reset management, key display, credential
issuance, generic sudo and independent MFA activation are separate unfinished work.
