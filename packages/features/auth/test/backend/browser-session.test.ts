/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import type { BrowserSessionsRepository, MiBrowserSession } from '@features/persistence/backend/repositories/models.js';

function fixture() {
	const repository = mockDeep<BrowserSessionsRepository>();
	const rows = new Map<string, MiBrowserSession>();
	let sequence = 0;
	repository.insert.mockImplementation(async entity => {
		const row = entity as MiBrowserSession;
		rows.set(row.id, { ...row });
		return { identifiers: [], generatedMaps: [], raw: [] };
	});
	repository.findOne.mockImplementation(async options => {
		const where = options.where as { tokenHash: string };
		const row = [...rows.values()].find(value => value.tokenHash === where.tokenHash && value.revokedAt === null);
		if (!row) return null;
		const { tokenHash: _hash, ...metadata } = row;
		return metadata as MiBrowserSession;
	});
	repository.update.mockImplementation(async (criteria, patch) => {
		const where = criteria as { id: string; userId?: string; tokenHash?: string };
		const row = rows.get(where.id);
		if (!row || row.revokedAt !== null || (where.userId && row.userId !== where.userId) || (where.tokenHash && row.tokenHash !== where.tokenHash)) return { affected: 0, raw: [], generatedMaps: [] };
		Object.assign(row, patch);
		return { affected: 1, raw: [], generatedMaps: [] };
	});
	repository.find.mockImplementation(async options => {
		const where = options?.where as { userId: string };
		return [...rows.values()].filter(row => row.userId === where.userId).map(row => {
			const { tokenHash: _hash, ...metadata } = row;
			return metadata as MiBrowserSession;
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
		expect(repository.findOne).toHaveBeenCalledTimes(3);
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

	test('revocation between lookup and touch wins without resurrecting the row', async () => {
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
		expect(repository.find.mock.calls[0][0]?.select).not.toContain('tokenHash');
	});

	test('persistence failure does not return an issued secret', async () => {
		const { service, repository } = fixture();
		repository.insert.mockRejectedValueOnce(new Error('synthetic DB failure'));
		await expect(service.issue('alice')).rejects.toThrow('synthetic DB failure');
	});
});
