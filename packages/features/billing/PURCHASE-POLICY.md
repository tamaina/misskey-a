<!-- SPDX-FileCopyrightText: tamaina -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Purchase policy and immutable receipts

The native administrator configures the source CFW region allow/deny rules, global residency statement, included tax rate and seller details. The procedure is disabled until configured. Enabled purchases require verified geography, the current country statement ID and explicit agreement. Existing pending payments and paid history remain accessible.

The adapter trusts only the actual TCP socket peer in configured IP/CIDR ranges, never forwarded caller IP. Every trusted upstream must remove caller-provided geographic headers and overwrite the Cloudflare geographic headers with independently verified values. Do not trust a general-purpose proxy which passes these headers through. Cloudflare Managed Transforms provides the geographic fields: https://developers.cloudflare.com/rules/transform/managed-transforms/reference/ . Unknown required dimensions fail closed. EU membership is derived from the verified country code using the 27 countries at https://european-union.europa.eu/principles-countries-history/eu-countries_en ; caller custom EU headers are ignored. Direct/internal/MCP calls without a trusted transport peer cannot create a new purchase when policy is enabled.

As in CFW, a single configurable statement becomes an immutable version per country. Policy changes retire old statement versions; preflight lazily creates the current version. One global SQL advisory lock covers settings, statement creation and order snapshot. Revision CAS prevents lost admin edits. An order saves region, agreed statement text/ID, agreement time, seller, currency and integer tax breakdown of final payable cash after discounts/proration, including zero-payable orders. Seller or tax edits do not rewrite old receipts. Replaying an existing order uses its original statement ID.

Only the owner may retrieve a paid purchase receipt. Legacy orders without snapshots explicitly report absent saved metadata. This slice presents the receipt with native Misskey components; original PDF rendering and notification email are separate remaining procedures, not simulated by this screen. The migration supports empty rollback and refuses to discard saved settings, statements or receipts.
