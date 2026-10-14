/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ServiceOffer } from '../backend/api.definition.js';
import type { FundingBasis } from './billing-funding.js';
export interface BillingTerm { id: string; orderId: string; offer: ServiceOffer; startsAt: number; expiresAt: number; provenanceComplete: boolean }
export interface FundingLot extends FundingBasis { id: string; termId: string; sourceOrderId: string }
export interface BillingState { revision: number; lockRequestId: string | null; terms: BillingTerm[]; lots: FundingLot[]; refunded: Record<string, string> }
