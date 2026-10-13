/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { signup } from '../../../../backend/test/utils.js';

const harness = vi.hoisted(() => {
	const config = { url: 'http://misskey.local', port: 61812, db: { host: '127.0.0.1', port: 54312, db: 'test-misskey', user: 'synthetic', pass: '', extra: {} }, dbReplications: false, dbSlaves: [] as unknown[] };
	const fetch = vi.fn();
	const findOne = vi.fn();
	const initialize = vi.fn();
	const destroy = vi.fn();
	const getRepository = vi.fn(() => ({ findOne }));
	const construct = vi.fn();
	return { config, fetch, findOne, initialize, destroy, getRepository, construct };
});

vi.mock('@/config.js', () => ({ loadConfig: () => harness.config }));
vi.mock('@features/boot/backend/node/common.js', () => ({ server: vi.fn(), jobQueue: vi.fn() }));
vi.mock('@features/persistence/backend/postgres.js', () => ({ entities: [] }));
vi.mock('node-fetch', async importOriginal => ({ ...await importOriginal<typeof import('node-fetch')>(), default: harness.fetch }));
vi.mock('typeorm', async importOriginal => ({
	...await importOriginal<typeof import('typeorm')>(),
	DataSource: class {
		constructor(options: unknown) { harness.construct(options); }
		initialize = harness.initialize;
		getRepository = harness.getRepository;
		destroy = harness.destroy;
	},
}));

const browserToken = `bs_${'a'.repeat(43)}`;
const remoteHost = 'fixture.example.invalid';

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubEnv('NODE_ENV', 'test');
	vi.stubEnv('CI', 'true');
	vi.stubEnv('MISSKEY_CONFIG_YML', 'test.yml');
	harness.config.url = 'http://misskey.local';
	harness.config.port = 61812;
	harness.config.db = { host: '127.0.0.1', port: 54312, db: 'test-misskey', user: 'synthetic', pass: '', extra: {} };
	harness.config.dbReplications = false;
	harness.config.dbSlaves = [];
	harness.initialize.mockResolvedValue(undefined);
	harness.destroy.mockResolvedValue(undefined);
	harness.findOne.mockResolvedValue({ id: 'remote-fixture', host: remoteHost, token: 'syntheticlegacy1' });
});
afterEach(() => vi.unstubAllEnvs());

function response(host: string | null) {
	harness.fetch.mockResolvedValue({
		status: 200, headers: { get: () => 'application/json; charset=utf-8' },
		json: async () => ({ id: 'remote-fixture', host, token: browserToken }),
	});
}

test('ordinary local signup retains its browser credential without any database connection', async () => {
	response(null);
	expect((await signup()).token).toBe(browserToken);
	expect(harness.construct).not.toHaveBeenCalled();
	expect(harness.findOne).not.toHaveBeenCalled();
});

test('remote simulation borrows only its newly created native fixture credential without schema changes', async () => {
	response(remoteHost);
	expect((await signup({ host: remoteHost })).token).toBe('syntheticlegacy1');
	expect(harness.construct).toHaveBeenCalledWith(expect.objectContaining({ database: 'test-misskey', host: '127.0.0.1', port: 54312, synchronize: false, dropSchema: false }));
	expect(harness.findOne).toHaveBeenCalledWith({ where: { id: 'remote-fixture', host: remoteHost }, select: { id: true, host: true, token: true } });
	expect(harness.destroy).toHaveBeenCalledTimes(1);
});

test.each([
	['production environment', () => vi.stubEnv('NODE_ENV', 'production')],
	['non-CI environment', () => vi.stubEnv('CI', 'false')],
	['custom configuration', () => vi.stubEnv('MISSKEY_CONFIG_YML', 'default.yml')],
	['other application URL', () => { harness.config.url = 'https://production.invalid'; }],
	['other application port', () => { harness.config.port = 3000; }],
	['other database', () => { harness.config.db.db = 'production'; }],
	['other host', () => { harness.config.db.host = 'database.invalid'; }],
	['other database port', () => { harness.config.db.port = 5432; }],
	['replication', () => { harness.config.dbReplications = true; }],
	['replica targets', () => { harness.config.dbSlaves = [{}]; }],
	['connection URL', () => { Object.assign(harness.config.db, { url: 'postgres://production.invalid' }); }],
	['connection replica overrides', () => { Object.assign(harness.config.db, { replication: {} }); }],
	['connection extras', () => { harness.config.db.extra = { host: 'production.invalid' }; }],
] as const)('remote fixture refuses %s before constructing a database connection', async (_name, change) => {
	response(remoteHost);
	change();
	await expect(signup({ host: remoteHost })).rejects.toThrow('isolated CI test configuration');
	expect(harness.construct).not.toHaveBeenCalled();
	expect(harness.findOne).not.toHaveBeenCalled();
});

test.each([null, { id: 'remote-fixture', host: remoteHost, token: browserToken }, { id: 'remote-fixture', host: remoteHost, token: 'bad' }, { id: 'another-user', host: remoteHost, token: 'syntheticlegacy1' }, { id: 'remote-fixture', host: 'another.invalid', token: 'syntheticlegacy1' }])('missing or non-native fixture credential fails without browser fallback', async row => {
	response(remoteHost);
	harness.findOne.mockResolvedValue(row);
	await expect(signup({ host: remoteHost })).rejects.toThrow('Missing synthetic remote native credential');
	expect(harness.destroy).toHaveBeenCalledTimes(1);
});

test('fixture query error closes only the borrowed connection and propagates failure', async () => {
	response(remoteHost);
	harness.findOne.mockRejectedValue(new Error('synthetic read failure'));
	await expect(signup({ host: remoteHost })).rejects.toThrow('synthetic read failure');
	expect(harness.destroy).toHaveBeenCalledTimes(1);
});
