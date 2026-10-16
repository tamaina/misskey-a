/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { FindOperator, IsNull } from 'typeorm';
import { describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import type { BrowserSessionsRepository, MiBrowserSession, MiUser } from '@features/persistence/backend/repositories/models.js';

function matches(row: object, criteria: unknown): boolean {
	if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) throw new Error('unsupported synthetic criteria');
	return Object.entries(criteria).every(([key, value]) => {
		const actual = Reflect.get(row, key);
		if (!(value instanceof FindOperator)) return value && typeof value === 'object' ? actual !== null && typeof actual === 'object' && matches(actual, value) : actual === value;
		if (value.type === 'isNull') return actual === null;
		if (value.type === 'lessThanOrEqual') return actual <= value.value;
		throw new Error('unsupported synthetic operator');
	});
}

function fixture() {
	const repository = mockDeep<BrowserSessionsRepository>();
	const rows = new Map<string, MiBrowserSession>();
	let sequence = 0;
	repository.insert.mockImplementation(async entity => {
		const row = entity as MiBrowserSession;
		rows.set(row.id, { ...row, user: mockDeep<MiUser>({ id: row.userId, host: null, isSuspended: false, isDeleted: false }) });
		return { identifiers: [], generatedMaps: [], raw: [] };
	});
	repository.findOne.mockImplementation(async options => {
		const row = [...rows.values()].find(value => matches(value, options.where));
		if (!row) return null;
		if (!options.select || Array.isArray(options.select)) throw new Error('explicit object metadata select required');
		return Object.fromEntries(Object.entries(options.select).filter(([, selected]) => selected === true).map(([key]) => [key, Reflect.get(row, key)])) as MiBrowserSession;
	});
	repository.update.mockImplementation(async (criteria, patch) => {
		const selected = [...rows.values()].filter(row => matches(row, criteria));
		for (const row of selected) Object.assign(row, patch);
		return { affected: selected.length, raw: [], generatedMaps: [] };
	});
	repository.existsBy.mockImplementation(async criteria => [...rows.values()].some(row => matches(row, criteria)));
	repository.find.mockImplementation(async options => {
		return [...rows.values()].filter(row => matches(row, options?.where)).map(row => {
			if (!options?.select || Array.isArray(options.select)) throw new Error('explicit object metadata select required');
			return Object.fromEntries(Object.entries(options.select).filter(([, selected]) => selected === true).map(([key]) => [key, Reflect.get(row, key)])) as MiBrowserSession;
		});
	});
	const service = new BrowserSessionService(repository, { gen: () => `session-${++sequence}` });
	return { service, repository, rows };
}

describe('individual browser session foundation (synthetic persistence only)', () => {
	test('issues unique opaque secrets and persists only their digest, without sudo', async () => {
		const { service, rows } = fixture();
		const first = await service.issue('alice');
		const second = await service.issue('alice');
		expect(first.token).toMatch(/^bs_[A-Za-z0-9_-]{43}$/);
		expect(Buffer.from(first.token.slice(3), 'base64url')).toHaveLength(32);
		expect(first.token).not.toBe(second.token);
		expect(rows.get(first.session.id)?.tokenHash).toBe(createHash('sha256').update(first.token).digest('hex'));
		expect(JSON.stringify([...rows.values()])).not.toContain(first.token);
		expect(first.session.sudoUntil).toBeNull();
		expect(first.session).not.toHaveProperty('tokenHash');
	});

	test('rejects malformed and legacy tokens without consulting persistence', async () => {
		const { service, repository } = fixture();
		for (const token of ['', 'legacy-user-token', 'bs_short', `bs_${'a'.repeat(44)}`, `bs_${'!'.repeat(43)}`]) expect(await service.verify(token)).toBeNull();
		expect(repository.findOne).not.toHaveBeenCalled();
	});

	test('rejects unknown secrets and checks persistence each time', async () => {
		const { service, repository } = fixture();
		const issued = await service.issue('alice');
		expect(await service.verify(`bs_${'a'.repeat(43)}`)).toBeNull();
		expect(await service.verify(issued.token)).toMatchObject({ id: issued.session.id, userId: 'alice' });
		expect(await service.verify(issued.token)).not.toBeNull();
		expect(repository.findOne).toHaveBeenCalledTimes(5);
		expect(repository.findOne.mock.calls[1][0].where).toEqual({ tokenHash: createHash('sha256').update(issued.token).digest('hex'), revokedAt: IsNull() });
		expect(repository.findOne.mock.calls[2][0].where).toEqual({ id: issued.session.id, userId: 'alice', revokedAt: IsNull(), user: { id: 'alice', host: IsNull(), isSuspended: false, isDeleted: false } });
		expect(repository.update).not.toHaveBeenCalled();
	});

	test('owned revocation rejects other users and invalidates only the selected session', async () => {
		const { service } = fixture();
		const first = await service.issue('alice');
		const second = await service.issue('alice');
		expect(await service.revokeOwned('bob', first.session.id)).toBe(false);
		expect(await service.verify(first.token)).not.toBeNull();
		expect(await service.revokeOwned('alice', first.session.id)).toBe(true);
		expect(await service.verify(first.token)).toBeNull();
		expect(await service.verify(second.token)).not.toBeNull();
		expect(await service.revokeOwned('alice', first.session.id)).toBe(false);
	});

	test('revocation between lookup and final durable read wins without resurrecting the row', async () => {
		const { service, repository, rows } = fixture();
		const issued = await service.issue('alice');
		const original = repository.findOne.getMockImplementation();
		if (!original) throw new Error('missing synthetic lookup');
		repository.findOne.mockImplementationOnce(async options => {
			const result = await original(options);
			await service.revokeOwned('alice', issued.session.id);
			return result;
		});
		expect(await service.verify(issued.token)).toBeNull();
		expect(rows.get(issued.session.id)?.revokedAt).toBeInstanceOf(Date);
	});

	test('lists only owned metadata, explicitly excluding digest and token', async () => {
		const { service, repository } = fixture();
		const alice = await service.issue('alice');
		await service.issue('bob');
		const listed = await service.listOwned('alice');
		expect(listed).toHaveLength(1);
		expect(listed[0].id).toBe(alice.session.id);
		expect(listed[0]).not.toHaveProperty('tokenHash');
		expect(listed[0]).not.toHaveProperty('token');
		expect(repository.find.mock.calls[0][0]?.select).not.toHaveProperty('tokenHash');
	});

	test('touches lastUsedAt only after the minute threshold and rechecks active state', async () => {
		const { service, repository, rows } = fixture();
		const issued = await service.issue('alice');
		const row = rows.get(issued.session.id);
		if (!row) throw new Error('missing row');
		row.lastUsedAt = new Date(Date.now() - 120_000);
		expect(await service.verify(issued.token)).not.toBeNull();
		expect(repository.update).toHaveBeenCalledOnce();
		expect(repository.update.mock.calls[0][0]).toMatchObject({ id: issued.session.id, revokedAt: IsNull() });
		expect(row.lastUsedAt.getTime()).toBeGreaterThan(Date.now() - 1000);
		await service.verify(issued.token);
		expect(repository.update).toHaveBeenCalledOnce();
	});

	test('stream durable checks never touch timestamps or cache positive results', async () => {
		const { service, repository } = fixture();
		const issued = await service.issue('alice');
		expect(await service.isActive(issued.session.id, 'alice')).toBe(true);
		expect(await service.isActive(issued.session.id, 'bob')).toBe(false);
		expect(repository.update).not.toHaveBeenCalled();
		await service.revokeOwned('alice', issued.session.id);
		expect(await service.isActive(issued.session.id, 'alice')).toBe(false);
	});

	test('durable session gates reject suspension and soft deletion after connection without pubsub', async () => {
		const { service, rows } = fixture();
		const issued = await service.issue('alice');
		const user = rows.get(issued.session.id)?.user;
		if (!user) throw new Error('missing synthetic owner');
		expect(await service.isActive(issued.session.id, 'alice')).toBe(true);
		user.isSuspended = true;
		expect(await service.isActive(issued.session.id, 'alice')).toBe(false);
		expect(await service.verify(issued.token)).toBeNull();
		user.isSuspended = false;
		user.isDeleted = true;
		expect(await service.isActive(issued.session.id, 'alice')).toBe(false);
		expect(await service.verify(issued.token)).toBeNull();
	});

	test('global invalidation affects all owned sessions and no other user', async () => {
		const { service } = fixture();
		const alice1 = await service.issue('alice');
		const alice2 = await service.issue('alice');
		const bob = await service.issue('bob');
		await service.revokeAllOwned('alice');
		expect(await service.verify(alice1.token)).toBeNull();
		expect(await service.verify(alice2.token)).toBeNull();
		expect(await service.verify(bob.token)).not.toBeNull();
	});

	test('persistence failure does not return an issued secret', async () => {
		const { service, repository } = fixture();
		repository.insert.mockRejectedValueOnce(new Error('synthetic DB failure'));
		await expect(service.issue('alice')).rejects.toThrow('synthetic DB failure');
	});
});
