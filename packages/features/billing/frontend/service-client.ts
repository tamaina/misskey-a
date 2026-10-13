/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ContractRouterClient } from '@orpc/contract';
import type { serviceBillingContract } from '../backend/api.definition.js';
export type ServiceBillingClient = ContractRouterClient<typeof serviceBillingContract>;
export type OfferAdminClient = Pick<ServiceBillingClient, 'listOfferSettings' | 'upsertOffer'>;
export type ServiceAccountClient = Pick<ServiceBillingClient, 'listOffers' | 'createOrder' | 'checkOrder' | 'listOrders'>;

/** String-only display; never round financial base units through Number. */
export function formatServiceAmount(value: string, decimals: number): string {
	if (decimals === 0) return value;
	const padded = value.padStart(decimals + 1, '0');
	const fraction = padded.slice(-decimals).replace(/0+$/, '');
	return padded.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}
