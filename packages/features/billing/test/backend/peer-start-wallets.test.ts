/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBillingWallet } from '../../backend/models/BillingWallet.js';
import { MiBillingPolicy } from '../../backend/models/BillingPolicy.js';
import { MiPeerPaymentIntent, MiPeerPaymentToken } from '../../backend/models/PeerPayment.js';
import { createPeerPaymentStore } from '../../backend/peer-store.js';
import type { SelectQueryBuilder, DataSource, EntityManager, Repository } from 'typeorm';

const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const now = 250;
const chainId = 31337;

function fixture() {
	const row = mockDeep<MiPeerPaymentIntent>({
		id: 'intent', senderUserId: 'alice', recipientUserId: 'bob', chainId, expiresAt: now + 1000,
		status: 'pending', txHash: null, broadcastStartedAt: null, broadcastCountryEligibility: null,
		terms: { senderWalletId: 'alice-wallet', recipientWalletId: 'bob-wallet', fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7' },
	});
	const walletRows = [
		mockDeep<MiBillingWallet>({ id: row.terms.senderWalletId, userId: 'alice', chainId, address: row.terms.fromAddress, isPublicForPayments: false }),
		mockDeep<MiBillingWallet>({ id: row.terms.recipientWalletId, userId: 'bob', chainId, address: row.terms.toAddress, isPublicForPayments: false }),
	];
	const wallets = mockDeep<Repository<MiBillingWallet>>();
	wallets.findOne.mockImplementation(async ({ where }) => {
		if (!where || Array.isArray(where)) return null;
		return walletRows.find(wallet => Object.entries(where).every(([key, value]) => wallet[key as keyof MiBillingWallet] === value)) ?? null;
	});
	const intents = mockDeep<Repository<MiPeerPaymentIntent>>();
	intents.findOne.mockResolvedValue(row);

	const users = mockDeep<Repository<MiUser>>();
	const query = mockDeep<SelectQueryBuilder<MiUser>>();
	users.createQueryBuilder.mockReturnValue(query);
	query.select.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.getOne.mockResolvedValue(mockDeep<MiUser>({ id: 'bob', host: null, isSuspended: false, movedToUri: null }));

	const profiles = mockDeep<Repository<MiUserProfile>>();
	profiles.findOne.mockResolvedValue(mockDeep<MiUserProfile>({
		billingResidence: { country: 'JP', subdivision: null, declaredAt: 1, revision: 1, kind: 'self_declared' },
		billingPeerReceiptSettings: { revision: 0, acceptForeignPayments: false },
	}));
	const policy = mockDeep<MiBillingPolicy>({ revision: 1, policy: { countryEligibility: { operatorCountry: 'JP', mode: 'domestic', allowedCountries: [] }, residenceRequiredSubdivisions: [] } });
	const repositories = new Map<unknown, unknown>([
		[MiUser, users], [MiUserProfile, profiles], [MiBillingWallet, wallets], [MiPeerPaymentIntent, intents], [MiPeerPaymentToken, mockDeep<Repository<MiPeerPaymentToken>>()],
	]);

	function getRepository(entity: unknown) { return repositories.get(entity); }

	const update = vi.fn();
	const manager = { getRepository, update, query: async () => [], findOneBy: async () => policy } as unknown as EntityManager;
	const db = { getRepository, transaction: <T>(fn: (tx: EntityManager) => Promise<T>) => fn(manager) } as unknown as DataSource;
	return { row, walletRows, wallets, update, store: createPeerPaymentStore(db, () => 'id', () => now) };
}

test.each([0, 1])('first start rejects a relinked wallet at position %i, with no reservation', async index => {
	const f = fixture();
	f.walletRows[index] = { ...f.walletRows[index], id: 'third-wallet', userId: 'charlie' };
	await expect(f.store.start('alice', f.row.id)).rejects.toMatchObject({ code: 'PEER_UNAVAILABLE' });
	expect(f.update).not.toHaveBeenCalled();
});

test('first start locks the original ownership, and known-start hash recovery remains independent', async () => {
	const f = fixture();
	const started = await f.store.start('alice', f.row.id);
	expect(started.broadcastStartedAt).toBe(now);
	expect(f.wallets.findOne).toHaveBeenNthCalledWith(1, { where: { id: 'alice-wallet', userId: 'alice', chainId, address: address(1) }, lock: { mode: 'pessimistic_read' } });
	expect(f.wallets.findOne).toHaveBeenNthCalledWith(2, { where: { id: 'bob-wallet', userId: 'bob', chainId, address: address(2) }, lock: { mode: 'pessimistic_read' } });

	Object.assign(f.row, started);
	f.walletRows.length = 0;
	f.wallets.findOne.mockClear();
	await expect(f.store.start('alice', f.row.id)).rejects.toMatchObject({ code: 'PEER_CONFLICT' });
	const txHash = `0x${'a'.repeat(64)}`;
	expect((await f.store.submit('alice', f.row.id, txHash)).txHash).toBe(txHash);
	expect((await f.store.submit('alice', f.row.id, txHash)).broadcastStartedAt).toBe(now);
	expect(f.wallets.findOne).not.toHaveBeenCalled();
});
