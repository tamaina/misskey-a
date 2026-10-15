/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { http, HttpResponse } from 'msw';
import type { ResidenceClient } from './residence-client.js';
import type { WalletClient, WalletConnector } from './wallet-client.js';
import type { ServiceAccountClient } from './service-client.js';
import type { PeerPaymentClient } from './peer-client.js';
import type { ServiceOffer } from '../backend/api.definition.js';

/** In-memory synthetic fixtures. No wallet, credential, RPC or API writes. */
export async function blocked(): Promise<never> { throw new Error('Financial actions are disabled in review stories'); }
export const reviewParameters = {
	layout: 'padded',
	msw: { handlers: [http.all('*/api/*', () => HttpResponse.json({ error: 'Review stories never call an API' }, { status: 503 }))] },
};
export function residenceClient(state: 'empty' | 'registered' | 'subdivision'): ResidenceClient {
	return {
		getResidence: async () => ({
			residence: state === 'empty' ? null : { country: state === 'registered' ? 'JP' : 'US', subdivision: null, revision: 1, declaredAt: 1792022400000, kind: 'self_declared' },
			requiredSubdivisions: ['US'], isReady: state === 'registered',
		}),
		setResidence: blocked,
	};
}
export const reviewConnectors: WalletConnector[] = [{ id: 'synthetic', name: 'Synthetic wallet (disabled)', provider: { request: blocked } }];
export const reviewWalletClient: WalletClient = {
	list: async () => [],
	chains: async () => [{ chainId: 123456, name: 'Synthetic chain', nativeCurrencyName: 'Test', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null }],
	begin: blocked, verify: blocked, unlink: blocked, passkeyOptions: blocked,
};
export const reviewWallet = { id: 'synthetic-wallet', chainId: 123456, address: '0x0000000000000000000000000000000000000003', label: null, createdAt: 1792022400000, updatedAt: 1792022400000 };
export const reviewOffer: ServiceOffer = {
	id: 'synthetic-plan', serviceKey: 'synthetic', name: 'Synthetic plan', chainId: 123456,
	contractAddress: '0x0000000000000000000000000000000000000001', recipientAddress: '0x0000000000000000000000000000000000000002',
	tokenSymbol: 'TEST', decimals: 2, amountBaseUnits: '1000', duration: 30, durationUnit: 'days', confirmationsRequired: 1, isEnabled: true,
};
export const reviewServiceClient: ServiceAccountClient = {
	listCatalog: async () => [{ offer: reviewOffer, priceHistory: [], priceDisplayWindow: { previousPeriod: null, currentPeriod: null, nextPeriod: null }, dealDisplay: { canShowDeal: false, referenceAmountBaseUnits: null, reason: 'no_reference_price', checkedFrom: 1792022400000, checkedTo: 1792022400000, referenceSoldMs: 0, totalSoldMs: 0, referenceLastSoldAt: null } }],
	listOffers: async () => [reviewOffer], listOrders: async () => [],
	quoteOrder: blocked, createOrder: blocked, checkOrder: blocked, cancelOrder: blocked,
};
export const reviewPeerClient: PeerPaymentClient = {
	listTokens: async () => [], ownPublication: async () => [], list: async () => [], publicWallets: async () => [],
	listSettings: async () => [], saveSettings: blocked, publish: blocked, prepare: blocked, start: blocked, check: blocked,
};
