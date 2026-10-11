/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
const chainId = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER));
const timestamp = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
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
	WALLET_ALREADY_LINKED: walletFailure,
	WALLET_CHALLENGE_NOT_FOUND: walletFailure,
	WALLET_SIGNATURE_INVALID: walletFailure,
	WALLET_NOT_FOUND: walletFailure,
	PAYMENT_TRANSACTION_INVALID: walletFailure,
};
const procedure = oc.errors({ ...commonErrors, ...walletErrors });
export const walletContract = {
	list: procedure.$meta({ ...read, requestName: 'account/wallets/list' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(linkedWallet)),
	chains: procedure.$meta({ ...read, requestName: 'account/wallets/link/chains' })
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(walletChain)),
	begin: procedure.$meta({ ...write, requestName: 'account/wallets/link/begin' })
		.input(v.strictObject({ chainId, address,
																										currentPassword: v.exactOptional(v.pipe(v.string(), v.maxLength(256))),
																										twoFactorToken: v.exactOptional(v.pipe(v.string(), v.maxLength(128))),
		})).output(v.strictObject({ nonce: text, message: v.pipe(v.string(), v.maxLength(4096)) })),
	verify: procedure.$meta({ ...write, requestName: 'account/wallets/link/verify' })
		.input(v.strictObject({ nonce: text, message: v.pipe(v.string(), v.minLength(1), v.maxLength(4096)),
																										signature: v.pipe(v.string(), v.regex(/^0x(?:[0-9a-fA-F]{2})+$/), v.maxLength(16386)),
		})).output(linkedWallet),
	unlink: procedure.$meta({ ...write, requestName: 'account/wallets/unlink' })
		.input(v.strictObject({ walletId: id })).output(v.strictObject({ ok: v.literal(true) })),
};
