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
