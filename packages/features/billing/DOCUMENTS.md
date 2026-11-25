<!-- SPDX-FileCopyrightText: tamaina -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Completion email and PDF evidence

The source CFW purchase notification reservation is native PostgreSQL: a paid order reserves its global purchase event before looking up a verified email address and invoking the existing Misskey EmailService. Concurrent confirmations, zero-payable purchases and paid-order retries share the same reservation. A skipped, failed or unknown send is not automatically retried. A reservation records an attempt, not successful delivery. Payment state remains independent of SMTP results. No new credentials or mail provider are required.

Purchase email uses the original order, frozen seller and saved tax. The original CFW purchase and refund pdfme templates and IBM Plex Sans JP font/OFL are retained. The frontend pins the source pdfme6.1.5 dependency graph without changing existing locked resolutions. Actual PDF generation and parsing are tested, including Japanese text, precise integer amounts, zero decimals and long tax rates. Font failures reach native busy/error controls. Legacy purchases without saved tax/seller cannot invent a receipt PDF; their native history still displays.

Adapter fixes preserve evidence when fields grow: original order ID takes precedence over offer ID; decimal tax percentages avoid Number; long purchase fields point to a fully retained supplemental sheet; Unicode lines wrap before pagination. Refunds use a blank-dimension pdfme base so every schema page is emitted, instead of the source fixed one-page base which lost later pages in the actual generation check. All refund groups and original transfer proofs remain represented.

Refund documents freeze seller information at final confirmation under the purchase-policy lock, retain source purchase snapshots, approved cutoff reason, and allocate each refund line's tax as floor(savedPurchaseTax * refundCash / originalCash), matching CFW. The existing cash cap and floor allocation prevent reversing more original tax. Rounding residue is retained, not redistributed. Missing legacy tax/seller is explicitly unknown; old completed documents remain readable. Original paid orders are never rewritten.

Validation uses mock delivery and synthetic local orders only. Actual mail, signatures and transfers are not exercised. Admin order/check and sales summaries remain the next original procedures.
