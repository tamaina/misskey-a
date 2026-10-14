/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ServiceOffer } from '../backend/api.definition.js';
import type { BillingRefundGroup } from './billing-refund-groups.js';
import type { BillingTerm } from './billing-state.js';
import type { ReceiptEvidence } from '../backend/transfer.schema.js';
export interface RefundQuote { revision: number; effectiveCutoffAt: number; assignments: BillingTerm[]; groups: (BillingRefundGroup & { id: string; confirmations: number })[]; reviewReasons: string[] }
export interface RefundTransfer { id: string; status: 'prepared' | 'broadcast_pending' | 'submitted'; senderAddress: string | null; startedAt: number | null; txHash: string | null }
export interface RefundEvent { actorId: string; at: number; action: string; reason: string }
export interface RefundDocument { id: string; completedAt: number; requestedCutoffAt: number; effectiveCutoffAt: number; groups: RefundQuote['groups']; proofs: { transferId: string; senderAddress: string; evidence: ReceiptEvidence }[]; originalPurchases: { id: string; payerAddress: string; offer: ServiceOffer; cashAmountBaseUnits: string; txHash: string | null; paidAt: number | null }[] }
export interface RefundData { id: string; version: number; status: 'requested' | 'review_required' | 'prepared' | 'processing' | 'rejected' | 'cancelled' | 'completed'; requestedMode: 'immediate' | 'scheduled'; requestedCutoffAt: number; effectiveCutoffAt: number | null; reason: string; createdAt: number; quote: RefundQuote | null; transfers: RefundTransfer[]; events: RefundEvent[]; document: RefundDocument | null }
