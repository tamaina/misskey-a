/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(32));
const address = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{40}$/));
const hash = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{64}$/));
const integer = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const chainId = v.pipe(integer, v.minValue(1));
const unitsPattern = /^[1-9][0-9]{0,77}$/;
const units = v.pipe(v.string(), v.regex(unitsPattern), v.check(value => unitsPattern.test(value) && BigInt(value) < 2n ** 256n));
const empty = v.intersect([v.strictObject({}), rawObjectInputGuard]);
export const peerToken = v.strictObject({ id, name: v.pipe(v.string(), v.minLength(1), v.maxLength(128)), chainId, contractAddress: address,
	tokenSymbol: v.pipe(v.string(), v.minLength(1), v.maxLength(32)), decimals: v.pipe(integer, v.maxValue(255)),
	confirmationsRequired: v.pipe(integer, v.minValue(1), v.maxValue(100000)), isEnabled: v.boolean() });
export type PeerToken = v.InferOutput<typeof peerToken>;
export const preparePeerTransfer = v.strictObject({ requestKey: v.pipe(v.string(), v.minLength(1), v.maxLength(128)), walletId: id,
	recipientUserId: id, recipientAddress: address, tokenId: id, amountBaseUnits: units });
export type PreparePeerTransfer = v.InferOutput<typeof preparePeerTransfer>;
export const peerTransfer = v.strictObject({ id, token: peerToken, fromAddress: address, toAddress: address, amountBaseUnits: units,
	senderUserId: v.nullable(id), recipientUserId: v.nullable(id), createdAt: integer, expiresAt: integer,
	status: v.picklist(['pending', 'confirmed', 'failed', 'expired']), txHash: v.nullable(hash), logIndex: v.nullable(integer), confirmedAt: v.nullable(integer),
	data: v.pipe(v.string(), v.regex(/^0x[0-9a-f]+$/), v.maxLength(138)) });
export type PeerTransfer = v.InferOutput<typeof peerTransfer>;
const read = { requireCredential: true, kind: 'read:account' } as const;
const write = { ...read, kind: 'write:account', limit: { duration: 60000, max: 10 } } as const;
const admin = { requireCredential: true, requireAdmin: true, kind: 'read:admin:meta' } as const;
const procedure = oc.errors({ ...commonErrors, PEER_NOT_FOUND: { status: 404, data: apiErrorData }, PEER_UNAVAILABLE: { status: 400, data: apiErrorData }, PEER_CONFLICT: { status: 409, data: apiErrorData } });
export const peerPaymentContract = {
	listSettings: procedure.$meta({ ...admin, requestName: 'admin/peer-payments/tokens/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/peer-payments/tokens/list' }).input(empty).output(v.array(peerToken)),
	saveSettings: procedure.$meta({ ...admin, kind: 'write:admin:meta', limit: write.limit, requestName: 'admin/peer-payments/tokens/upsert' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/peer-payments/tokens/upsert' }).input(peerToken).output(peerToken),
	listTokens: procedure.$meta({ ...read, requestName: 'peer-payments/tokens/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/peer-payments/tokens/list' }).input(empty).output(v.array(peerToken)),
	ownPublication: procedure.$meta({ ...read, requestName: 'account/wallets/publication/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/publication/list' }).input(empty).output(v.array(v.strictObject({ walletId: id, chainId, address, isPublic: v.boolean() }))),
	publish: procedure.$meta({ ...write, secure: true, requestName: 'account/wallets/publication/set' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/wallets/publication/set' }).input(v.strictObject({ walletId: id, isPublic: v.boolean() })).output(v.strictObject({ isPublic: v.boolean() })),
	publicWallets: procedure.$meta({ ...read, requestName: 'users/payment-wallets' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/users/payment-wallets' }).input(v.strictObject({ userId: id })).output(v.array(v.strictObject({ chainId, address }))),
	prepare: procedure.$meta({ ...write, requestName: 'peer-payments/prepare' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/peer-payments/prepare' }).input(preparePeerTransfer).output(peerTransfer),
	check: procedure.$meta({ ...write, requestName: 'peer-payments/check' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/peer-payments/check' }).input(v.strictObject({ intentId: id, txHash: v.exactOptional(hash), logIndex: v.exactOptional(integer) })).output(peerTransfer),
	list: procedure.$meta({ ...read, requestName: 'peer-payments/list' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/peer-payments/list' }).input(empty).output(v.array(peerTransfer)),
};
