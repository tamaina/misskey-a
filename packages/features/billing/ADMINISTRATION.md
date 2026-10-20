# Catalog administration

This continuation ports the asset/deployment and price lifecycle procedures from cfw-fileup `worker/api/admin-billing.ts` into native administrator APIs and Misskey components. It builds on the wallet, receipt, fixed-term, transition/refund and dated price slices.

Administrators configure pricing assets, their currency codes, and enabled ERC20 deployments. A deployment uses an existing configured chain and recipient. Token metadata resolution makes read-only calls through the existing RPC fetch policy; decimals are required while unavailable token labels can remain manually configured. The chain test checks the saved RPC's chain ID. No private RPC URL is returned or written into the catalog audit log.

Service prices select a registered deployment in the service settings. Equivalent deployments share a logical price only when the pricing unit and decimals match; there is no implicit exchange or decimal conversion. An independent recorded price retains its selling period after the last deployment or chain is deleted and may be attached to another equivalent deployment later. Asset keys cannot change while a deployment or recorded price still refers to them. Saving a disabled rail does not hide the logical price history if another rail is enabled.

Deleting a logical price removes all current offers for that price. Deleting an asset removes its deployments and recorded prices. Existing pending/paid orders, funded terms, transfer claims, and refund documents retain their own immutable snapshots. These deletion operations require administrator permission and show native confirmation dialogs. Changes and before/after values are recorded atomically in the existing moderation log.

The migration seeds dated offers without inventing legacy selling periods. Its `down()` refuses to discard configured assets or retained prices. SQL entity/migration parity and empty up/down are checked in the dedicated synthetic PostgreSQL fixture.

Admin order checking and monetary sales summaries, trusted region rules, tax/residency statements, seller snapshots, owner receipts, deduped completion email, and the original PDF renderer are still separate remaining procedures under #171. This slice does not complete the whole source migration.
