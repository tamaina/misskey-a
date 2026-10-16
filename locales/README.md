# **DO NOT edit locale files** except `ja-JP.yml`.

When you add text to the ja-JP file (of misskey-dev/misskey), it will automatically be applied to other language files.
Translations added in ja-JP file should contain the original Japanese strings.

Please see [Contribution guide](../CONTRIBUTING.md) for more information.

The VVI shared vocabulary is selected from these existing catalogs by
`packages/features/runtime/frontend/shared/global-locale.ts`. Screen-specific
messages stay in their owning Vue `<locale>` blocks. Match meaning and all
28 effective translations before moving an owner label into the shared scope.

The catalog pruning in PR #204 was explicitly authorized across languages.
The Japanese catalog now has 135 leaves: 23 shared labels, one language-name
field, 78 dynamically selected achievement titles, 18 notification labels,
two offline messages and 13 other SW labels. Every retained path has a concrete
caller in `packages/i18n/catalog-retention.json`; no unconfirmed category remains.
Achievement descriptions/flavors stay with the Vue owner, while SW only needs
`_achievements._types[achievement].title`.

The remaining 168 unresolved paths and 145 raw-oracle paths from the first pass
were confirmed to have no live production consumer and removed. Backend email
helpers are commented out. Boot message types now derive from the existing
embed boot JSON instead of the legacy catalog.

Raw translation history (including missing/empty/inactive translations) lives
only in `packages/frontend/test/unit/catalog-history.json`. Its reconstruction
checks independent pre-pruning raw/effective hashes and the unchanged older
migration hashes. Historical frontend tests also reconstruct the earlier
1,391 migrated messages from Vue owners. The production loader/fallback policy
is unchanged, and no test history is imported by production code.
