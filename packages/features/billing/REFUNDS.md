# Funded service terms and programmable refunds

Source: cfw-fileup PR139, head569523a; refs Misskey Issue171. Requires wallet#64 → receipt#103 → service terms#81. P2P#126 remains independent. No merge or deployment is part of this implementation.

## Purchase prerequisites

Admin configures planGroup and sortOrder to compare ranked service keys. pricingAssetKey permits credit lineage across settlement tokens/chains only when the administrator explicitly declares an equivalent pricing unit; decimals must match. Without that key, credit is restricted to the original chain/token/decimals. No guessed exchange rate or balance is introduced.

Server quote snapshots carry revision, 15-minute expiry, payable amount, discount assignment IDs and effective interval. Initial/same-plan renewal, ranked upgrades, downgrade scheduling and UTC calendar clipping use the source math. Upgrades consume only overlapping lower-ranked terms; retained pieces preserve immutable funding bases. Zero-payable upgrades apply the same entitlement transaction without a chain transfer. Confirmed order receipts remain immutable.

A billing account state holds independent terms, original-purchase funding lots, revision and refund reservation in one JSONB row under the native user-first PostgreSQL lock. Old paid orders are imported as terms with unknown provenance; no cash lots are invented. Shared chain/hash claims persist independently of account deletion. Unverified purchase hints are not authoritative claims and cannot exclude a matching refund.

## Refund workflow

1. The authenticated account requests immediate or scheduled termination with an idempotency key and reason. Immediate time is sampled by the server. Original requested time is retained across retry and waiting.
2. An administrator re-quotes and approves/rejects with an audit reason. Effective cutoff cannot precede the original request. Unknown provenance, excessive/corrupt allocation or empty target sets cannot be approved automatically. An unresolved purchase or another prepared refund prevents approval. Preparing reserves the account, preventing purchase/entitlement mutation.
3. Unused intervals are floored against immutable funding bases. Inherited upgrade funding follows each original paid purchase, not the current wallet or plan price. Cumulative allocations are capped at that original order's payable cash. Groups use original payerAddress × chain × token × decimals; at most20 groups and1000 targeted terms per request.
4. The admin chooses a connected wallet. Before its ERC20 send call the server persists broadcast intent, sender and start time. Unknown outcomes expose hash recovery only; no resend action. A hash is immutable and idempotent, and its chain/hash is claimed across purchases/refunds. The human controls the wallet; the server owns no signing key.
5. Every group must have a successful, sufficiently confirmed canonical receipt, expected chain/token/sender/original payer/exact amount and a block timestamp after the recorded intent. All groups are freshly checked twice; changed/disappeared evidence leaves rights untouched. The final native transaction rechecks reservation, version, revision, quote, target intervals and claim ownership, then truncates all terms/funding lots, records cumulative claims and an immutable refund document in one commit. Role reads use the current independent intervals; no manual role assignment is overwritten.
6. Owner history is paginated with exclusive cursor and owner-only ID lookup. Completed records supply printable, escaped HTML evidence/download, containing original purchases and canonical chain proofs. The original purchase stays paid with its original interval and transaction.

## Boundaries

This slice delivers funding provenance, prorated plan transitions and refunds above#81. It does not claim Issue171's broader scheduled price catalog/deal display, geographic tax/residency settings or completion-email migration is finished. The existing#81 order has no original tax/seller statement fields to recover; this document preserves its actual offer/payment snapshot without fabricating them. Printable HTML can be saved as PDF through the browser; it is not the cfw-fileup PDF renderer and no tax-document legal classification is claimed.

Processing transfers cannot be cancelled/rebroadcast automatically. Completion-time reorg is detected; automatic post-completion re-send or entitlement reactivation is not implemented. No internal balance/custody, real test transfer/signature, credentials, production migration or shared9000 server/state changes.
