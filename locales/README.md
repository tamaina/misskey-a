# **DO NOT edit locale files** except `ja-JP.yml`.

When you add text to the ja-JP file (of misskey-dev/misskey), it will automatically be applied to other language files.
Translations added in ja-JP file should contain the original Japanese strings.

Please see [Contribution guide](../CONTRIBUTING.md) for more information.

The VVI shared vocabulary is selected from these existing catalogs by
`packages/features/runtime/frontend/shared/global-locale.ts`. Screen-specific
messages stay in their owning Vue `<locale>` blocks. Match meaning and all
28 effective translations before moving an owner label into the shared scope.

The catalog pruning in PR #204 was explicitly authorized across languages.
It removes 1,391 Japanese key paths from every YAML catalog, without changing
any retained value. `packages/i18n/catalog-retention.json` records why the
remaining 570 paths are kept: 257 cover shared vocabulary, runtime consumers
and conservative dynamic branches; 145 preserve existing raw translation
oracles; 168 need further investigation before deletion. Those 168 are not
asserted to be used. Notification, achievement, email and boot consumers must
be checked before further removal. The backend email helpers are currently
commented out; their two titles are retained conservatively, not counted as
active AST references.

Historical frontend tests reconstruct the deleted effective messages from
their existing Vue owners and verify independently frozen pre-deletion hashes.
Their historical type is test-only; the generated production `Locale` contains
only the current catalog. No second production translation catalog is added.
