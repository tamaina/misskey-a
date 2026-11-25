/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { createRouterClient } from '@orpc/server';
import { MiBillingAccountState } from '../../backend/models/BillingAccountState.js';
import { MiBillingRefund } from '../../backend/models/BillingRefund.js';
import { createRefundStore } from '../../backend/refund-store.js';
import { createServiceBillingRouter } from '../../backend/service.implementation.js';
import type { DataSource } from 'typeorm';
import type { BillingState } from '../../backend/billing-state.js';
import type { RefundData } from '../../shared/refund-types.js';
import type { ReceiptReader, ReceiptResult } from '../../backend/transfer-confirmation.js';
import type { ServiceBillingStore } from '../../backend/service-store.js';
import type { MiBillingServiceOrder } from '../../backend/models/BillingServiceOrder.js';
import type { ServiceOffer } from '../../backend/api.definition.js';

const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;

function createRefundFixture(initialData: RefundData, initialState: BillingState, readReceipt: ReceiptReader) {
	let refundRow: MiBillingRefund = { id: initialData.id, userId: 'alice', requestKey: 'req-1', data: structuredClone(initialData) } as MiBillingRefund;
	let accountState: BillingState = structuredClone(initialState);

	const manager = {
		query: vi.fn(async () => []),
		findOneBy: vi.fn(async (entity: unknown) => {
			if (entity === MiBillingRefund) return structuredClone(refundRow);
			if (entity === MiBillingAccountState) return { userId: 'alice', data: structuredClone(accountState) };
			return null;
		}),
		getRepository: vi.fn((entity: unknown) => {
			if (entity === MiBillingAccountState) {
				return {
					findOne: vi.fn(async () => ({ userId: 'alice', data: structuredClone(accountState) })),
				};
			}
			const qb = {
				select: () => qb,
				where: () => qb,
				setLock: () => qb,
				getOne: async () => ({ id: 'alice' }),
				getOneOrFail: async () => ({ id: 'alice' }),
			};
			return {
				findOne: vi.fn(async () => null),
				createQueryBuilder: vi.fn(() => qb),
			};
		}),
		upsert: vi.fn(async (entity: unknown, payload: { data?: BillingState }) => {
			if (entity === MiBillingAccountState && payload?.data) {
				accountState = structuredClone(payload.data);
			}
			return {};
		}),
		update: vi.fn(async (entity: unknown, _id: string, patch: Record<string, unknown>) => {
			if (entity === MiBillingRefund && patch.data) {
				refundRow = { ...refundRow, data: structuredClone(patch.data as RefundData) };
			}
			if (entity === MiBillingAccountState && patch.data) {
				accountState = structuredClone(patch.data as BillingState);
			}
		}),
	};

	const db = {
		getRepository: vi.fn((entity: unknown) => {
			if (entity === MiBillingRefund) {
				return { findOneBy: vi.fn(async () => structuredClone(refundRow)) };
			}
			throw new Error(`Unexpected repository ${String(entity)}`);
		}),
		transaction: vi.fn(async <T>(fn: (m: typeof manager) => Promise<T>) => fn(manager)),
	} as unknown as DataSource;

	const store = createRefundStore(db, () => 'gen-id', readReceipt, () => 1_700_000_000_000);
	return {
		store,
		getState: () => accountState,
		getRefund: () => refundRow.data,
	};
}

function baseRefundData(transfers: RefundData['transfers'], groups: NonNullable<RefundData['quote']>['groups']): RefundData {
	return {
		id: 'refund-1',
		version: 3,
		status: 'processing',
		requestedMode: 'immediate',
		requestedCutoffAt: 1_699_000_000_000,
		effectiveCutoffAt: 1_699_000_000_000,
		reason: 'requested refund',
		createdAt: 1_699_000_000_000,
		quote: {
			revision: 1,
			effectiveCutoffAt: 1_699_000_000_000,
			assignments: [],
			groups,
			reviewReasons: [],
		},
		transfers,
		events: [{ actorId: 'alice', action: 'requested', at: 1_699_000_000_000, reason: 'requested refund' }],
		document: null,
	};
}

test('refund check releases account lock with audit event on two-pass confirmed canonical revert', async () => {
	const group = { id: '0', payerAddress: address(1), chainId: 1, contractAddress: address(3), decimals: 6, amountBaseUnits: '100', lines: [], confirmations: 2 };
	const data = baseRefundData(
		[{ id: '0', status: 'submitted', senderAddress: address(9), startedAt: 1_699_500_000_000, txHash: hash(10) }],
		[group],
	);
	const revertEvidence = { chainId: 1, txHash: hash(10), timestamp: 1_699_500_100_000, blockHash: hash(99), blockNumber: '42' };
	const fixture = createRefundFixture(
		data,
		{ revision: 1, lockRequestId: 'refund-1', terms: [], lots: [], refunded: {} },
		async () => ({ status: 'invalid', canonicalRevert: revertEvidence }),
	);

	const result = await fixture.store.check('refund-1', 'admin');
	expect(result.status).toBe('cancelled');
	expect(fixture.getState().lockRequestId).toBeNull();
	expect(result.events.at(-1)).toMatchObject({ actorId: 'admin', action: 'reverted_failed' });
	expect(result.events.at(-1)!.reason).toContain(hash(10));
	expect(result.events.at(-1)!.reason).toContain('block=42');
});

test('refund check retains account lock on unknown outcome, unconfirmed revert, or mixed group status', async () => {
	const group0 = { id: '0', payerAddress: address(1), chainId: 1, contractAddress: address(3), decimals: 6, amountBaseUnits: '100', lines: [], confirmations: 2 };
	const group1 = { id: '1', payerAddress: address(2), chainId: 1, contractAddress: address(3), decimals: 6, amountBaseUnits: '50', lines: [], confirmations: 2 };
	const revertEvidence = { chainId: 1, txHash: hash(10), timestamp: 1_699_500_100_000, blockHash: hash(99), blockNumber: '42' };

	// Pending (unknown outcome) must keep lock.
	const pendingFixture = createRefundFixture(
		baseRefundData([{ id: '0', status: 'submitted', senderAddress: address(9), startedAt: 1_699_500_000_000, txHash: hash(10) }], [group0]),
		{ revision: 1, lockRequestId: 'refund-1', terms: [], lots: [], refunded: {} },
		async () => ({ status: 'pending' }),
	);
	expect((await pendingFixture.store.check('refund-1', 'admin')).status).toBe('processing');
	expect(pendingFixture.getState().lockRequestId).toBe('refund-1');

	// Invalid without canonical revert evidence must keep lock.
	const bareInvalidFixture = createRefundFixture(
		baseRefundData([{ id: '0', status: 'submitted', senderAddress: address(9), startedAt: 1_699_500_000_000, txHash: hash(10) }], [group0]),
		{ revision: 1, lockRequestId: 'refund-1', terms: [], lots: [], refunded: {} },
		async () => ({ status: 'invalid' }),
	);
	expect((await bareInvalidFixture.store.check('refund-1', 'admin')).status).toBe('processing');
	expect(bareInvalidFixture.getState().lockRequestId).toBe('refund-1');

	// One reverted group + one broadcast_pending group must keep lock.
	const mixedFixture = createRefundFixture(
		baseRefundData(
			[
				{ id: '0', status: 'submitted', senderAddress: address(9), startedAt: 1_699_500_000_000, txHash: hash(10) },
				{ id: '1', status: 'broadcast_pending', senderAddress: address(9), startedAt: 1_699_500_000_000, txHash: null },
			],
			[group0, group1],
		),
		{ revision: 1, lockRequestId: 'refund-1', terms: [], lots: [], refunded: {} },
		async () => ({ status: 'invalid', canonicalRevert: revertEvidence }),
	);
	expect((await mixedFixture.store.check('refund-1', 'admin')).status).toBe('processing');
	expect(mixedFixture.getState().lockRequestId).toBe('refund-1');
});

const offer: ServiceOffer = {
	id: 'offer-1',
	serviceKey: 'svc',
	name: 'Plan',
	chainId: 1,
	contractAddress: address(3),
	recipientAddress: address(9),
	tokenSymbol: 'TEST',
	decimals: 6,
	amountBaseUnits: '100',
	duration: 1,
	durationUnit: 'months',
	confirmationsRequired: 2,
	isEnabled: true,
};

function makeOrder(overrides: Partial<MiBillingServiceOrder> = {}): MiBillingServiceOrder {
	return {
		id: 'order-1',
		userId: 'alice',
		walletId: 'wallet-1',
		requestKey: 'rk-1',
		offer,
		chainId: 1,
		payerAddress: address(1),
		cashAmountBaseUnits: '100',
		quote: null,
		billingRevision: null,
		status: 'pending',
		txHash: hash(1),
		createdAt: 1000,
		expiresAt: 2000,
		paidAt: null,
		startsAt: null,
		endsAt: null,
		...overrides,
	} as MiBillingServiceOrder;
}

function makeClient(store: ServiceBillingStore, readReceipt: ReceiptReader) {
	return createRouterClient(
		createServiceBillingRouter({ store, readReceipt, rpcUrl: async () => 'https://rpc.example.test' }),
		{
			context: {
				credential: 'synthetic',
				headers: {},
				ip: '127.0.0.1',
				services: {
					authenticate: async () => [{ id: 'alice', isSuspended: false, movedToUri: null }, { permission: ['read:account', 'write:account'] }],
					limitActor: () => null,
					rateLimitFactor: async () => 1,
					limit: async () => null,
				},
			},
		},
	);
}

test('service checkOrder replaces an unconfirmed transaction hash and confirms the replacement', async () => {
	let current = makeOrder({ txHash: hash(1) });
	const replaceCalls: Array<[string, string]> = [];
	const store = {
		findOrder: vi.fn(async () => ({ ...current })),
		replaceTransaction: vi.fn(async (_u: string, _id: string, prev: string, next: string) => {
			replaceCalls.push([prev, next]);
			current = { ...current, txHash: next };
			return { ...current };
		}),
		submitTransaction: vi.fn(async () => ({ ...current })),
		applyReceipt: vi.fn(async (_u: string, _id: string, tx: string, res: ReceiptResult) => {
			if (res.status === 'confirmed') current = { ...current, status: 'paid', txHash: tx, paidAt: 1500, startsAt: 1500, endsAt: 2500 };
			return { ...current };
		}),
	} as unknown as ServiceBillingStore;

	const readReceipt: ReceiptReader = async (_chainId, txHash) => {
		if (txHash === hash(1)) return { status: 'pending' };
		return {
			status: 'confirmed',
			evidence: {
				chainId: 1,
				txHash,
				timestamp: 1500,
				transfers: [{ logIndex: 0, contractAddress: offer.contractAddress, fromAddress: address(1), toAddress: offer.recipientAddress, amountBaseUnits: '100' }],
			},
		};
	};

	const client = makeClient(store, readReceipt);
	const result = await client.checkOrder({ orderId: 'order-1', txHash: hash(2) });
	expect(replaceCalls).toEqual([[hash(1), hash(2)]]);
	expect(result.status).toBe('paid');
	expect(result.txHash).toBe(hash(2));
});

test('service checkOrder settles already-confirmed original hash instead of replacing it', async () => {
	let current = makeOrder({ txHash: hash(1) });
	const replaceTransaction = vi.fn();
	const store = {
		findOrder: vi.fn(async () => ({ ...current })),
		replaceTransaction,
		submitTransaction: vi.fn(async () => ({ ...current })),
		applyReceipt: vi.fn(async (_u: string, _id: string, tx: string, res: ReceiptResult) => {
			if (res.status === 'confirmed') current = { ...current, status: 'paid', txHash: tx, paidAt: 1500, startsAt: 1500, endsAt: 2500 };
			return { ...current };
		}),
	} as unknown as ServiceBillingStore;

	const readReceipt: ReceiptReader = async (_chainId, txHash) => ({
		status: 'confirmed',
		evidence: {
			chainId: 1,
			txHash,
			timestamp: 1500,
			transfers: [{ logIndex: 0, contractAddress: offer.contractAddress, fromAddress: address(1), toAddress: offer.recipientAddress, amountBaseUnits: '100' }],
		},
	});

	const client = makeClient(store, readReceipt);
	const result = await client.checkOrder({ orderId: 'order-1', txHash: hash(2) });
	expect(replaceTransaction).not.toHaveBeenCalled();
	expect(result.status).toBe('paid');
	expect(result.txHash).toBe(hash(1));
});

test('service cancelOrder cancels an expired dropped-hash order and marks confirmed-invalid orders failed', async () => {
	const cancelCalls: Array<unknown> = [];
	const applyCalls: Array<unknown> = [];
	const current = makeOrder({ txHash: hash(1) });
	const store = {
		findOrder: vi.fn(async () => ({ ...current })),
		cancelOrder: vi.fn(async (_u: string, _id: string, opts?: { allowExpiredTxHash?: string }) => {
			cancelCalls.push(opts);
			return { ok: true as const };
		}),
		applyReceipt: vi.fn(async (_u: string, _id: string, tx: string, res: ReceiptResult) => {
			applyCalls.push([tx, res.status]);
			return { ...current, status: 'failed' as const };
		}),
	} as unknown as ServiceBillingStore;

	const droppedClient = makeClient(store, async () => ({ status: 'pending' }));
	expect(await droppedClient.cancelOrder({ orderId: 'order-1' })).toEqual({ ok: true });
	expect(cancelCalls).toEqual([{ allowExpiredTxHash: hash(1) }]);

	const revertedClient = makeClient(store, async () => ({ status: 'invalid' }));
	expect(await revertedClient.cancelOrder({ orderId: 'order-1' })).toEqual({ ok: true });
	expect(applyCalls).toEqual([[hash(1), 'invalid']]);
});
