/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { Ajv } from 'ajv';
import { EndpointImplementation as Create, paramDef as createSchema } from '../../../../features/roles/backend/endpoints/admin/roles/create.js';
import { EndpointImplementation as Update, paramDef as updateSchema } from '../../../../features/roles/backend/endpoints/admin/roles/update.js';
import { EndpointImplementation as DefaultPolicies, paramDef as defaultSchema } from '../../../../features/roles/backend/endpoints/admin/roles/update-default-policies.js';

vi.mock('../../../../features/roles/backend/serializers/RoleEntityService.js', () => ({ RoleEntityService: class {} }));
vi.mock('../../../../features/roles/backend/services/RoleService.js', () => ({ RoleService: class {} }));
vi.mock('../../../../features/runtime/backend/services/GlobalEventService.js', () => ({ GlobalEventService: class {} }));
vi.mock('../../../../features/instance/backend/services/MetaService.js', () => ({ MetaService: class {} }));
vi.mock('../../../../features/moderation/backend/services/ModerationLogService.js', () => ({ ModerationLogService: class {} }));

// Frozen pre-migration wire schema, independent of the native schema builders.
const originalCreateSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		color: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		target: { type: 'string', enum: ['manual', 'conditional'] },
		condFormula: { type: 'object' },
		isPublic: { type: 'boolean' },
		isModerator: { type: 'boolean' },
		isAdministrator: { type: 'boolean' },
		isExplorable: { type: 'boolean', default: false }, // optional for backward compatibility
		asBadge: { type: 'boolean' },
		preserveAssignmentOnMoveAccount: { type: 'boolean' },
		canEditMembersByModerator: { type: 'boolean' },
		displayOrder: { type: 'number' },
		policies: {
			type: 'object',
		},
	},
	required: [
		'name',
		'description',
		'color',
		'iconUrl',
		'target',
		'condFormula',
		'isPublic',
		'isModerator',
		'isAdministrator',
		'asBadge',
		'canEditMembersByModerator',
		'displayOrder',
		'policies',
	],
} as const;

const originalUpdateSchema = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string' }, description: { type: 'string' },
		color: { type: 'string', nullable: true }, iconUrl: { type: 'string', nullable: true },
		target: { type: 'string', enum: ['manual', 'conditional'] },
		condFormula: { type: 'object' }, isPublic: { type: 'boolean' },
		isModerator: { type: 'boolean' }, isAdministrator: { type: 'boolean' },
		isExplorable: { type: 'boolean' }, asBadge: { type: 'boolean' },
		preserveAssignmentOnMoveAccount: { type: 'boolean' }, canEditMembersByModerator: { type: 'boolean' },
		displayOrder: { type: 'number' }, policies: { type: 'object' },
	},
	required: ['roleId'],
} as const;
const originalDefaultSchema = { type: 'object', properties: { policies: { type: 'object' } }, required: ['policies'] } as const;
const body = () => ({ name: 'x', description: '', color: null, iconUrl: null, target: 'manual', condFormula: { nonsense: true }, isPublic: true, isModerator: false, isAdministrator: false, asBadge: false, canEditMembersByModerator: false, displayOrder: 0, policies: { invalid: 'still accepted' } });

type Adapter = Pick<Create, 'exec'>;

function createHarness() {
	const calls: unknown[][] = [], role = { id: 'role' }, packed = { deliberatelyUnparsed: true }, me = { id: 'admin' };
	const endpoint: Adapter = Reflect.construct(Create, [
		{ pack: async (...args: unknown[]) => { calls.push(['pack', ...args]); return packed; } },
		{ create: async (...args: unknown[]) => { calls.push(['create', ...args]); return role; } },
	]);
	return { endpoint, calls, role, packed, me };
}

function updateHarness(missing = false) {
	const calls: unknown[][] = [], role = { id: 'role' }, me = { id: 'admin' };
	const endpoint: Pick<Update, 'exec'> = Reflect.construct(Update, [
		{ findOneBy: async (...args: unknown[]) => { calls.push(['find', ...args]); return missing ? null : role; } },
		{ update: async (...args: unknown[]) => { calls.push(['update', ...args]); } },
	]);
	return { endpoint, calls, role, me };
}

test('frozen role schemas and original AJV errors/default mutations remain identical', () => {
	const ajv = new Ajv({ useDefaults: true }); ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
	for (const [original, current, valid] of [[originalCreateSchema, createSchema, body()], [originalUpdateSchema, updateSchema, { roleId: 'abc' }], [originalDefaultSchema, defaultSchema, { policies: {} }]] as const) {
		expect(current).toEqual(original);
		const before = ajv.compile(original), after = ajv.compile(current);
		for (const input of [valid, {}, ...['condFormula', 'policies'].flatMap(field => [null, [], 1, {}, undefined, { bad: true }].map(value => ({ ...valid, [field]: value })))]) {
			const a = structuredClone(input), b = structuredClone(input);
			expect(after(b)).toBe(before(a)); expect(after.errors).toEqual(before.errors); expect(b).toEqual(a);
		}
	}
});

test('create passes malformed opaque objects unchanged, defaults before service, and leaves output unparsed', async () => {
	const { endpoint, calls, role, packed, me } = createHarness();
	const input = body();
	const result = await endpoint.exec(input, me as never, null, undefined, '192.0.2.1');
	expect(result).toBe(packed);
	expect(calls).toEqual([['create', { ...input, isExplorable: false }, me], ['pack', role, me]]);
	expect(calls[0][1]).toBe(input);
	expect(Reflect.get(calls[0][1] as object, 'condFormula')).toBe(input.condFormula);
	expect(Reflect.get(calls[0][1] as object, 'policies')).toBe(input.policies);
});

test('update finds the role first then forwards the unchecked exact field set', async () => {
	const { endpoint, calls, role, me } = updateHarness();
	const condFormula = { notAFormula: true }, policies = { notAnOverride: null };
	await endpoint.exec({ roleId: 'abc', condFormula, policies }, me as never, null, undefined, '192.0.2.1');
	expect(calls[0]).toEqual(['find', { id: 'abc' }]);
	expect(calls[1]).toEqual(['update', role, {
		name: undefined, description: undefined, color: undefined, iconUrl: undefined, target: undefined,
		condFormula, isPublic: undefined, isModerator: undefined, isAdministrator: undefined,
		isExplorable: undefined, asBadge: undefined, preserveAssignmentOnMoveAccount: undefined,
		canEditMembersByModerator: undefined, displayOrder: undefined, policies,
	}, me]);
	expect(Reflect.get(calls[1][2] as object, 'condFormula')).toBe(condFormula);
	expect(Reflect.get(calls[1][2] as object, 'policies')).toBe(policies);
});

test('missing roles retain their error and never call update', async () => {
	const { endpoint, calls, me } = updateHarness(true);
	await expect(endpoint.exec({ roleId: 'abc', condFormula: {} }, me as never, null, undefined, '192.0.2.1')).rejects.toMatchObject({ code: 'NO_SUCH_ROLE', id: 'cd23ef55-09ad-428a-ac61-95a45e124b32' });
	expect(calls).toEqual([['find', { id: 'abc' }]]);
});

test('default policies keep fetch/update/refetch/event/log order and opaque identity', async () => {
	const calls: unknown[][] = [], before = { old: true }, after = { new: true }, policies = { invalidDomain: null }, me = { id: 'admin' };
	let count = 0;
	const endpoint: Pick<DefaultPolicies, 'exec'> = Reflect.construct(DefaultPolicies, [
		{ fetch: async (...args: unknown[]) => { calls.push(['fetch', ...args]); return { policies: count++ ? after : before }; }, update: async (...args: unknown[]) => { calls.push(['update', ...args]); } },
		{ publishInternalEvent: (...args: unknown[]) => calls.push(['event', ...args]) },
		{ log: (...args: unknown[]) => calls.push(['log', ...args]) },
	]);
	expect(await endpoint.exec({ policies }, me as never, null, undefined, '192.0.2.1')).toBeUndefined();
	expect(calls).toEqual([['fetch', true], ['update', { policies }], ['fetch', true], ['event', 'policiesUpdated', after], ['log', me, 'updateServerSettings', { before, after }]]);
	expect(Reflect.get(calls[1][1] as object, 'policies')).toBe(policies);
});

test('invalid nonobject role fields fail before any consumer effects', async () => {
	for (const field of ['condFormula', 'policies']) for (const value of [null, [], 42]) {
		const a = createHarness(), b = updateHarness();
		await expect(a.endpoint.exec({ ...body(), [field]: value }, a.me as never, null, undefined, '192.0.2.1')).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(b.endpoint.exec({ roleId: 'abc', [field]: value }, b.me as never, null, undefined, '192.0.2.1')).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		expect(a.calls).toEqual([]); expect(b.calls).toEqual([]);
	}
});
