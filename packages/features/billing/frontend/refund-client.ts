/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ContractRouterClient } from '@orpc/contract';
import type { refundContract } from '../backend/refund.contract.js';
import type { RefundDocument } from '../shared/refund-types.js';
export type RefundClient = ContractRouterClient<typeof refundContract>;
const escape = (value: unknown) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
/** Self-contained printable evidence retains original purchases and canonical chain proofs. */
export function renderRefundDocument(document: RefundDocument): string {
	return `<!doctype html><html lang="ja"><meta charset="utf-8"><title>返金証憑 ${escape(document.id)}</title><style>body{font:16px sans-serif;margin:3rem;line-height:1.6}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0}}</style><h1>返金証憑</h1><p>ID: ${escape(document.id)}<br>確定日時: ${escape(new Date(document.completedAt).toISOString())}<br>希望終了日時: ${escape(new Date(document.requestedCutoffAt).toISOString())}<br>承認終了日時: ${escape(new Date(document.effectiveCutoffAt).toISOString())}</p><h2>原購入・返金内訳・チェーン確認証拠</h2><pre>${escape(JSON.stringify(document, null, 2))}</pre></html>`;
}
