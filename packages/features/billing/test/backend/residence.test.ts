/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { createRouterClient } from '@orpc/server';
import { readyResidence, requireDeclaredResidence } from '../../backend/residence-store.js';
import { declaredResidenceInput, residenceRegionRequirements } from '../../backend/residence.schema.js';
import { createResidenceRouter } from '../../backend/residence.implementation.js';
import type { ApiContext } from '../../../api/backend/transport/context.js';
import type { EntityManager } from 'typeorm';
import type { createResidenceStore } from '../../backend/residence-store.js';
const residence = { country: 'JP' as const, subdivision: 'JP-13', revision: 1, declaredAt: 1000, kind: 'self_declared' as const };
test('residence is explicit, valid ISO country/subdivision and distinct from verified tax location', () => {
	for (const value of [null, {}, { country: '', subdivision: null }, { country: 'ZZ', subdivision: null }, { country: 'EU', subdivision: null }, { country: 'JP', subdivision: '' }, { country: 'JP', subdivision: 'US-CA' }, { country: 'JP', subdivision: 'JP-XX' }, { ...residence, kind: 'verified' }]) expect(readyResidence(value, [])).toBeNull();
	expect(readyResidence(residence, ['JP'])).toEqual(residence);
	expect(readyResidence({ ...residence, subdivision: null }, ['JP'])).toBeNull();
	expect(readyResidence({ ...residence, subdivision: null }, ['US'])).toMatchObject({ country: 'JP', kind: 'self_declared' });
	expect(v.safeParse(declaredResidenceInput, { country: 'US', subdivision: 'US-CA' }).success).toBe(true);
	for (const value of [['ZZ'], ['JP', 'JP'], ['AQ']]) expect(v.safeParse(residenceRegionRequirements, value).success).toBe(false);
});
test('shared guard rejects missing or newly incomplete residence without inferring country', async () => {
	let stored: unknown = null; let required: string[] = [];
	const manager = { query: async () => [], getRepository: () => ({ findOne: async () => ({ userId: 'alice', billingResidence: stored }) }), findOneBy: async () => ({ policy: { residenceRequiredSubdivisions: required } }) } as unknown as EntityManager;
	await expect(requireDeclaredResidence(manager, 'alice')).rejects.toMatchObject({ code: 'RESIDENCE_REQUIRED' });
	stored = { ...residence, subdivision: null }; await expect(requireDeclaredResidence(manager, 'alice')).resolves.toEqual(stored);
	required = ['JP']; await expect(requireDeclaredResidence(manager, 'alice')).rejects.toMatchObject({ code: 'RESIDENCE_REQUIRED' });
	stored = residence; await expect(requireDeclaredResidence(manager, 'alice')).resolves.toEqual(residence);
});
test('residence owner API rejects direct invalid codes/foreign user fields before save and fixes authenticated owner', async () => {
	const store = { get: vi.fn(async () => ({ residence, requiredSubdivisions: [], isReady: true })), save: vi.fn(async () => residence), require: vi.fn(async () => residence) } satisfies ReturnType<typeof createResidenceStore>;
	const context: ApiContext = { credential: 'synthetic', ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [{ id: 'alice', isSuspended: false, movedToUri: null }, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } };
	const client = createRouterClient(createResidenceRouter(store), { context });
	for (const value of [{ revision: 0, residence: { country: '', subdivision: null } }, { revision: 0, residence: { country: 'ZZ', subdivision: null } }, { revision: 0, residence: { country: 'JP', subdivision: 'US-CA' } }, { revision: 0, residence: { country: 'JP', subdivision: null }, userId: 'bob' }]) await expect(client.setResidence(value as never)).rejects.toBeDefined();
	expect(store.save).not.toHaveBeenCalled();
	await client.setResidence({ revision: 0, residence: { country: 'JP', subdivision: 'JP-13' } });
	expect(store.save).toHaveBeenCalledExactlyOnceWith('alice', { revision: 0, residence: { country: 'JP', subdivision: 'JP-13' } });
	await client.getResidence({}); expect(store.get).toHaveBeenCalledExactlyOnceWith('alice');
});
