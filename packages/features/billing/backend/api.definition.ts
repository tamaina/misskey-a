/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import { webAuthnAuthenticationOptionsSchema, webAuthnAuthenticationResponseSchema } from '../../auth/backend/webauthn.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
const timestamp = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const chainId = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER));
export const paymentSummary = v.strictObject({
	id,
	status: v.picklist(['pending', 'paid', 'expired', 'failed']),
	chainId,
	tokenSymbol: v.pipe(v.string(), v.minLength(1), v.maxLength(32)),
	amountBaseUnits: v.pipe(v.string(), v.regex(/^[0-9]{1,78}$/)),
	decimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
	planName: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
	createdAt: timestamp,
	paidAt: v.nullable(timestamp),
});
export const disabledPaymentChain = v.strictObject({
	chainId,
	name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(128)),
	confirmationsRequired: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)),
	isEnabled: v.literal(false),
});
export type PaymentSummary = v.InferOutput<typeof paymentSummary>;
export type DisabledPaymentChain = v.InferOutput<typeof disabledPaymentChain>;

const procedure = oc.errors(commonErrors);
export const billingContract = {
	listMyPayments: procedure.$meta({
		requestName: 'billing/list-my-payments', requireCredential: true, kind: 'read:account',
	} as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/list-my-payments' })
		.input(v.intersect([v.strictObject({
			limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20),
			cursor: v.exactOptional(id),
		}), rawObjectInputGuard])).output(v.strictObject({ items: v.array(paymentSummary), nextCursor: v.nullable(id) })),
	listChains: procedure.$meta({
		requestName: 'admin/billing/list-chains', requireCredential: true, requireAdmin: true, kind: 'read:admin:meta',
	} as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/billing/list-chains' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(disabledPaymentChain)),
	upsertChain: procedure.$meta({
		requestName: 'admin/billing/upsert-chain', requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	} as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/billing/upsert-chain' })
		.input(disabledPaymentChain).output(disabledPaymentChain),
};

const address = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{40}$/));
const text = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
export const linkedWallet = v.strictObject({ id, chainId, address, label: v.nullable(text), createdAt: timestamp, updatedAt: timestamp });
export const walletChain = v.strictObject({
	chainId, name: text, nativeCurrencyName: text, nativeCurrencySymbol: text,
	nativeCurrencyDecimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
	blockExplorerUrl: v.nullable(v.pipe(v.string(), v.url(), v.maxLength(2048))),
});
export type LinkedWallet = v.InferOutput<typeof linkedWallet>;
export type WalletChain = v.InferOutput<typeof walletChain>;
const httpsUrl = v.pipe(v.string(), v.url(), v.maxLength(2048), v.check(value => /^https:\/\//i.test(value)));
export const walletChainSettings = v.strictObject({ ...walletChain.entries, isEnabled: v.boolean(), hasRpc: v.boolean() });
export const walletChainSettingsInput = v.strictObject({ ...walletChain.entries, isEnabled: v.boolean(), rpcUrl: v.exactOptional(v.nullable(httpsUrl)) });
export type WalletChainSettings = v.InferOutput<typeof walletChainSettings>;
export type WalletChainSettingsInput = v.InferOutput<typeof walletChainSettingsInput>;
const read = { requireCredential: true, kind: 'read:account' } as const satisfies ApiProcedureMetadata;
const write = { requireCredential: true, kind: 'write:account', limit: { duration: 60 * 1000, max: 10 } } as const satisfies ApiProcedureMetadata;
const walletFailure = { status: 400, data: apiErrorData };
export const walletErrors = {
	WALLET_CHAIN_UNSUPPORTED: walletFailure,
	WALLET_REAUTHENTICATION_REQUIRED: { status: 403, data: apiErrorData },
	WALLET_ALREADY_LINKED: walletFailure,
	WALLET_CHALLENGE_NOT_FOUND: walletFailure,
	WALLET_SIGNATURE_INVALID: walletFailure,
	WALLET_NOT_FOUND: walletFailure,
	PAYMENT_TRANSACTION_INVALID: walletFailure,
};
const walletProcedure = oc.errors({ ...commonErrors, ...walletErrors });
export const walletContract = {
	listChainSettings: walletProcedure.$meta({ requireCredential: true, requireAdmin: true, kind: 'read:admin:meta', requestName: 'admin/wallets/chains/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/wallets/chains/list' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(walletChainSettings)),
	upsertChainSettings: walletProcedure.$meta({ requireCredential: true, requireAdmin: true, kind: 'write:admin:meta', requestName: 'admin/wallets/chains/upsert', limit: { duration: 60 * 1000, max: 10 } } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/wallets/chains/upsert' })
		.input(walletChainSettingsInput).output(walletChainSettings),
	passkeyOptions: walletProcedure.$meta({ ...write, requestName: 'account/wallets/link/passkey-options' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/link/passkey-options' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(webAuthnAuthenticationOptionsSchema),
	list: walletProcedure.$meta({ ...read, requestName: 'account/wallets/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/list' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(linkedWallet)),
	chains: walletProcedure.$meta({ ...read, requestName: 'account/wallets/link/chains' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/link/chains' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(walletChain)),
	begin: walletProcedure.$meta({ ...write, requestName: 'account/wallets/link/begin' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/link/begin' })
		.input(v.strictObject({ chainId, address,
																										passkey: v.exactOptional(webAuthnAuthenticationResponseSchema),
																										currentPassword: v.exactOptional(v.pipe(v.string(), v.maxLength(256))),
																										twoFactorToken: v.exactOptional(v.pipe(v.string(), v.maxLength(128))),
		})).output(v.strictObject({ nonce: text, message: v.pipe(v.string(), v.maxLength(4096)) })),
	verify: walletProcedure.$meta({ ...write, requestName: 'account/wallets/link/verify' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/link/verify' })
		.input(v.strictObject({ nonce: text, message: v.pipe(v.string(), v.minLength(1), v.maxLength(4096)),
																										signature: v.pipe(v.string(), v.regex(/^0x(?:[0-9a-fA-F]{2})+$/), v.maxLength(16386)),
		})).output(linkedWallet),
	unlink: walletProcedure.$meta({ ...write, requestName: 'account/wallets/unlink' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/unlink' })
		.input(v.strictObject({ walletId: id })).output(v.strictObject({ ok: v.literal(true) })),
};

// Fixed-term service purchases, not automatic debits or a balance ledger.
const units = v.pipe(v.string(), v.regex(/^(0|[1-9][0-9]{0,77})$/), v.check(value => /^(0|[1-9][0-9]{0,77})$/.test(value) && BigInt(value) < 2n ** 256n));
const transactionHash = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{64}$/));
export const serviceOffer = v.pipe(v.strictObject({
	id: v.pipe(id, v.maxLength(32)), serviceKey: text, name: text, chainId,
	deploymentId: v.exactOptional(v.pipe(id, v.maxLength(32))), currencyCode: v.exactOptional(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))), catalogPriceId: v.exactOptional(text), priceStartsAt: v.exactOptional(timestamp), priceExpiresAt: v.exactOptional(v.nullable(timestamp)),
	pricingAssetKey: v.exactOptional(text), planGroup: v.exactOptional(text), sortOrder: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100000))),
	roleId: v.exactOptional(v.nullable(v.pipe(id, v.maxLength(32)))),
	contractAddress: address, recipientAddress: address, tokenSymbol: text,
	decimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
	amountBaseUnits: units,
	duration: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(36500)),
	durationUnit: v.picklist(['days', 'months', 'years']),
	confirmationsRequired: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100000)),
	isEnabled: v.boolean(),
}), v.check(offer => offer.amountBaseUnits !== '0' || offer.priceStartsAt != null, 'Zero base price requires a dated catalog entry'));
export type ServiceOffer = v.InferOutput<typeof serviceOffer>;
const nonnegativeUnits = v.pipe(v.string(), v.regex(/^(0|[1-9][0-9]{0,77})$/));
export const paymentQuoteSchema = v.strictObject({
	quoteCreatedAt: timestamp, quoteExpiresAt: timestamp, baseAmountBaseUnits: nonnegativeUnits, discountBaseUnits: nonnegativeUnits, payableAmountBaseUnits: nonnegativeUnits,
	discountAssignmentIds: v.array(id), effectiveStartsAt: timestamp, effectiveExpiresAt: timestamp,
	currentPlan: v.nullable(v.strictObject({ id, name: text, sortOrder: v.number(), expiresAt: timestamp, priceAmountBaseUnits: nonnegativeUnits, priceDurationDays: v.number(), priceDurationUnit: v.picklist(['days', 'months', 'years']) })),
});
const pricePeriod = v.strictObject({ id, priceId: id, assetId: v.string(), planId: text, amountBaseUnits: nonnegativeUnits,
	durationDays: v.number(), durationUnit: v.picklist(['days', 'months', 'years']), isEnabled: v.boolean(), startsAt: timestamp, expiresAt: v.nullable(timestamp) });
export const catalogOffer = v.strictObject({ offer: serviceOffer, priceHistory: v.array(pricePeriod),
	priceDisplayWindow: v.strictObject({ previousPeriod: v.nullable(pricePeriod), currentPeriod: v.nullable(pricePeriod), nextPeriod: v.nullable(pricePeriod) }),
	dealDisplay: v.strictObject({ canShowDeal: v.boolean(), referenceAmountBaseUnits: v.nullable(nonnegativeUnits), reason: v.picklist(['eligible', 'no_reference_price', 'reference_not_higher', 'sold_less_than_half_recent_period', 'sold_less_than_two_weeks', 'reference_too_old']),
		checkedFrom: v.number(), checkedTo: timestamp, referenceSoldMs: v.number(), totalSoldMs: v.number(), referenceLastSoldAt: v.nullable(timestamp) }) });
export type CatalogOffer = v.InferOutput<typeof catalogOffer>;
export const serviceQuote = v.strictObject({ revision: timestamp, quote: paymentQuoteSchema });

export const serviceOrder = v.strictObject({
	id, offer: serviceOffer, payerAddress: address,
	amountBaseUnits: nonnegativeUnits, quote: v.nullable(paymentQuoteSchema),
	status: v.picklist(['pending', 'paid', 'expired', 'failed']),
	txHash: v.nullable(transactionHash), createdAt: timestamp, expiresAt: timestamp,
	paidAt: v.nullable(timestamp), startsAt: v.nullable(timestamp), endsAt: v.nullable(timestamp),
});
export type ServiceOrder = v.InferOutput<typeof serviceOrder>;
const serviceProcedure = oc.errors({ ...commonErrors,
	BILLING_NOT_FOUND: { status: 404, data: apiErrorData },
	BILLING_UNAVAILABLE: { status: 400, data: apiErrorData },
	BILLING_CONFLICT: { status: 409, data: apiErrorData },
	BILLING_TRANSACTION_INVALID: { status: 400, data: apiErrorData },
});
const adminRead = { requireCredential: true, requireAdmin: true, kind: 'read:admin:meta' } as const;
const adminWrite = { ...adminRead, kind: 'write:admin:meta', limit: write.limit } as const;
const empty = v.intersect([v.strictObject({}), rawObjectInputGuard]);
export const serviceBillingContract = {
	listCatalog: serviceProcedure.$meta({ ...read, requestName: 'billing/catalog/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/catalog/list' }).input(empty).output(v.array(catalogOffer)),
	cancelOrder: serviceProcedure.$meta({ ...write, requestName: 'billing/orders/cancel' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/orders/cancel' }).input(v.strictObject({ orderId: id })).output(v.strictObject({ ok: v.literal(true) })),
	quoteOrder: serviceProcedure.$meta({ ...read, requestName: 'billing/orders/quote' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/orders/quote' }).input(v.strictObject({ offerId: id })).output(serviceQuote),
	listOfferSettings: serviceProcedure.$meta({ ...adminRead, requestName: 'admin/billing/offers/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/billing/offers/list' }).input(empty).output(v.array(serviceOffer)),
	upsertOffer: serviceProcedure.$meta({ ...adminWrite, requestName: 'admin/billing/offers/upsert' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/billing/offers/upsert' }).input(serviceOffer).output(serviceOffer),
	listOffers: serviceProcedure.$meta({ ...read, requestName: 'billing/offers/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/offers/list' }).input(empty).output(v.array(serviceOffer)),
	createOrder: serviceProcedure.$meta({ ...write, requestName: 'billing/orders/create' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/orders/create' }).input(v.strictObject({ offerId: id, walletId: id, requestKey: text, quotedOffer: serviceOffer, quotedQuote: v.exactOptional(serviceQuote) })).output(serviceOrder),
	checkOrder: serviceProcedure.$meta({ ...write, requestName: 'billing/orders/check' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/orders/check' }).input(v.strictObject({ orderId: id, txHash: v.exactOptional(transactionHash) })).output(serviceOrder),
	listOrders: serviceProcedure.$meta({ ...read, requestName: 'billing/orders/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/orders/list' }).input(empty).output(v.array(serviceOrder)),
};
