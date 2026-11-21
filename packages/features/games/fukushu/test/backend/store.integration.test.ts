/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { FukushuDriveImporter } from '../../backend/drive-import.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { call } from '@orpc/server';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { FukushuQuestionVersions1794880800000 } from '../../../../../backend/migration/1794880800000-FukushuQuestionVersions.js';
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { FukushuStore } from '../../backend/store.js';
import { material } from './fixture.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const managed = (value: ReturnType<typeof material>) => ({ ...value, revision: 1, archivedAt: null });
const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('Fukushu private PostgreSQL persistence and API', () => {
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', entities, synchronize: false });
	const store = new FukushuStore(db);
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		const migration = new FukushuMaterial1794838800000();
		const runner = db.createQueryRunner();
		try {
			await migration.up(runner); await migration.down(runner); await migration.up(runner);
			const management = new FukushuMaterialManagement1794871800000();
			await management.up(runner); await management.down(runner); await management.up(runner);
			const versions = new FukushuQuestionVersions1794880800000();
			await versions.up(runner); await versions.down(runner); await versions.up(runner);
		} finally { await runner.release(); }
	});
	afterAll(async () => { if (db.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await db.query('TRUNCATE "user", fukushu_deck, fukushu_question CASCADE');
		await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']);
	});
	test('imports a BOM source through the real parser and store without changing its hash or another owner', async () => {
		const source = '\uFEFF#html:false\n#separator:Tab\n表\t裏';
		const bytes = Buffer.from(source);
		const file = { id: 'source', userId: 'alice', userHost: null, uri: null, isLink: false, storedInternal: true, accessKey: 'source.tsv', name: '教材.tsv', size: bytes.length, md5: createHash('md5').update(bytes).digest('hex') } as MiDriveFile;
		const importer = new FukushuDriveImporter({ findOneBy: async where => !Array.isArray(where) && where.userId === 'alice' ? file : null }, { read: () => Readable.from([bytes]) as ReturnType<InternalStorageService['read']> }, { downloadUrl: async () => { throw new Error('Must use the local original'); } }, store);
		const saved = await importer.import('alice', 'source');
		expect(saved.deck.sourceText).toBe(source);
		expect(saved.deck.sourceHash).toBe(createHash('sha256').update(source).digest('hex'));
		expect(saved.questions[0].payload.prompt.value).toBe('表');
		expect(await store.show('alice', saved.deck.id)).toEqual(managed(saved));
		await expect(importer.import('alice', 'source')).rejects.toMatchObject({ code: 'MATERIAL_EXISTS' });
		await expect(importer.import('bob', 'source')).rejects.toMatchObject({ code: 'NO_SUCH_FILE' });
		expect(await store.list('bob')).toEqual([]);
	});
	test('round trips exact records across store instances and isolates owners sharing original IDs', async () => {
		const original = material();
		const second = material(original.deck.id, 'second-card').questions[0];
		second.sourceKey = second.payload.sourceKey = 'another-source';
		second.sourceOrder = 0;
		second.enabled = false;
		second.enabledKey = 0;
		original.questions.push(second);
		original.deck.questionCount = 2;
		expect(await store.create('alice', original)).toEqual(original);
		await expect(store.show('bob', original.deck.id)).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(store.show('bob', 'missing')).rejects.toThrow('NO_SUCH_MATERIAL');
		const other = material(); other.questions[0].payload.answer.value = 'Bob private';
		await store.create('bob', other);
		expect(await new FukushuStore(db).show('alice', original.deck.id)).toEqual(managed(original));
		expect(await new FukushuStore(db).show('bob', original.deck.id)).toEqual(managed(other));
	});
	test('serializes concurrent creates without overwrite and rolls back a duplicate card in another deck', async () => {
		const results = await Promise.allSettled([store.create('alice', material()), new FukushuStore(db).create('alice', material())]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_EXISTS' } });
		await expect(store.create('alice', material('another-deck'))).rejects.toThrow('MATERIAL_EXISTS');
		await expect(store.show('alice', 'another-deck')).rejects.toThrow('NO_SUCH_MATERIAL');
		expect(await store.show('alice', 'deck-original')).toEqual(managed(material()));
	});
	test('lists only owned summaries in stable ID order without source text', async () => {
		const later = material('z-deck', 'z-card'); later.deck.sourceText = 'private raw source';
		const earlier = material('a-deck', 'a-card');
		await store.create('alice', later);
		await store.create('alice', earlier);
		await store.create('bob', material('bob-deck', 'bob-card'));
		const summaries = await store.list('alice');
		expect(summaries.map(deck => deck.id)).toEqual(['a-deck', 'z-deck']);
		expect(summaries.every(deck => !('sourceText' in deck))).toBe(true);
		expect((await store.list('bob')).map(deck => deck.id)).toEqual(['bob-deck']);
		expect(await store.list('missing-owner')).toEqual([]);
	});
	test('deduplicates source hashes atomically across imports without consuming quota or changing saved cards', async () => {
		const results = await Promise.allSettled(['a', 'b'].map(id => new FukushuStore(db).create('alice', material(id, id), { deduplicateSource: true })));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_EXISTS' } });
		expect(await db.query('SELECT id FROM fukushu_deck')).toHaveLength(1);
		expect(await db.query('SELECT id FROM fukushu_question')).toHaveLength(1);
		const saved = (await store.list('alice'))[0];
		await expect(store.create('alice', material('retry', 'retry'), { deduplicateSource: true })).rejects.toThrow('MATERIAL_EXISTS');
		expect(await store.show('alice', saved.id)).toEqual(managed(material(saved.id, saved.id)));
		// Identical source data can still belong to independent users.
		await expect(store.create('bob', material('other', 'other'), { deduplicateSource: true })).resolves.toEqual(material('other', 'other'));
		// Manual create preserves its original ID-based semantics; source kind matters.
		await store.create('alice', material('manual', 'manual'));
		const otherKind = material('gift', 'gift'); otherKind.deck.sourceType = 'gift';
		await expect(store.create('alice', otherKind, { deduplicateSource: true })).resolves.toEqual(otherKind);
	});
	test('a source retry at the quota is a duplicate and never consumes another slot', async () => {
		await store.create('alice', material());
		await db.query('INSERT INTO fukushu_deck ("ownerId", id, data) SELECT $1, n::text, $2::jsonb FROM generate_series(1,99) n', ['alice', JSON.stringify(material().deck)]);
		await expect(store.create('alice', material('retry', 'retry'), { deduplicateSource: true })).rejects.toThrow('MATERIAL_EXISTS');
		expect(await store.list('alice')).toHaveLength(100);
		expect(await db.query('SELECT id FROM fukushu_question')).toHaveLength(1);
	});
	test('rejects invalid input before any write and cascades account deletion', async () => {
		const invalid = material(); invalid.questions[0].payload.deckId = 'other';
		await expect(store.create('alice', invalid)).rejects.toThrow('INVALID_MATERIAL');
		expect(await db.query('SELECT id FROM fukushu_deck')).toEqual([]);
		await store.create('alice', material());
		await db.query('DELETE FROM "user" WHERE id = $1', ['alice']);
		expect(await db.query('SELECT id FROM fukushu_question')).toEqual([]);
	});
	test('quota remains atomic across workers', async () => {
		await db.query('INSERT INTO fukushu_deck ("ownerId", id, data) SELECT $1, n::text, $2::jsonb FROM generate_series(1,99) n', ['alice', JSON.stringify(material().deck)]);
		const results = await Promise.allSettled(['a', 'b'].map(id => new FukushuStore(db).create('alice', material(id, id))));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_LIMIT' } });
	});

	test('metadata updates preserve cards, original source, IDs and import time; omitted description clears only that field', async () => {
		const original = material();
		original.deck.description = 'old description';
		original.deck.sourceText = 'original source';
		await store.create('alice', original);
		const before = await db.query('SELECT data, position FROM fukushu_question');
		expect(await store.update('alice', original.deck.id, 1, 'new name', 'new description')).toEqual({ revision: 2, archivedAt: null });
		const saved = await store.show('alice', original.deck.id);
		expect(saved.questions).toEqual(original.questions);
		expect({ ...saved.deck, name: original.deck.name, description: original.deck.description, updatedAt: original.deck.updatedAt }).toEqual(original.deck);
		expect(saved.deck.name).toBe('new name');
		expect(saved.deck.description).toBe('new description');
		expect(saved.deck.updatedAt).not.toBe(original.deck.updatedAt);
		await store.update('alice', original.deck.id, 2, 'without description');
		expect((await store.show('alice', original.deck.id)).deck).not.toHaveProperty('description');
		expect(await db.query('SELECT data, position FROM fukushu_question')).toEqual(before);
	});
	test('concurrent metadata changes allow one revision and reject stale requests across workers', async () => {
		await store.create('alice', material());
		const results = await Promise.allSettled(['first', 'second'].map(name => new FukushuStore(db).update('alice', 'deck-original', 1, name)));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_CONFLICT' } });
		await expect(store.archive('alice', 'deck-original', 1, true)).rejects.toThrow('MATERIAL_CONFLICT');
		expect((await store.show('alice', 'deck-original')).revision).toBe(2);
	});
	test('archive and restore change only management columns and keep exact material data accessible to its owner', async () => {
		const original = material();
		await store.create('alice', original);
		const archived = await store.archive('alice', original.deck.id, 1, true);
		expect(archived.revision).toBe(2);
		expect(archived.archivedAt).toEqual(expect.any(String));
		expect(await store.list('alice')).toEqual([]);
		expect((await store.list('alice', { archived: true })).map(deck => deck.id)).toEqual([original.deck.id]);
		expect(await store.show('alice', original.deck.id)).toEqual({ ...original, ...archived });
		expect(await store.archive('alice', original.deck.id, 2, false)).toEqual({ revision: 3, archivedAt: null });
		expect(await store.show('alice', original.deck.id)).toEqual({ ...original, revision: 3, archivedAt: null });
		expect(await store.list('alice', { archived: true })).toEqual([]);
		expect(await store.list('alice')).toHaveLength(1);
	});
	test('foreign and missing mutation IDs remain indistinguishable and invalid input does not write', async () => {
		await store.create('alice', material());
		for (const id of ['deck-original', 'missing']) {
			await expect(store.update('bob', id, 1, 'foreign')).rejects.toThrow('NO_SUCH_MATERIAL');
			await expect(store.archive('bob', id, 1, true)).rejects.toThrow('NO_SUCH_MATERIAL');
		}
		for (const name of ['', 'x'.repeat(257), '\uD800']) await expect(store.update('alice', 'deck-original', 1, name)).rejects.toThrow('INVALID_MATERIAL');
		for (const revision of [0, 1.5, Number.MAX_SAFE_INTEGER]) await expect(store.archive('alice', 'deck-original', revision, true)).rejects.toThrow('INVALID_MATERIAL');
		expect(await store.show('alice', 'deck-original')).toEqual(managed(material()));
	});
	test('metadata growth cannot invalidate the stored one-MiB material boundary', async () => {
		const original = material();
		original.questions = Array.from({ length: 60 }, (_, i) => {
			const question = structuredClone(original.questions[0]);
			question.id = question.payload.id = `card-${i}`;
			question.sourceKey = question.payload.sourceKey = `source-${i}`;
			question.payload.prompt.value = 'x'.repeat(16_384);
			return question;
		});
		original.deck.questionCount = original.deck.enabledQuestionCount = original.questions.length;
		original.deck.sourceText = '';
		original.deck.sourceText = 'x'.repeat(1_048_576 - 16 - new TextEncoder().encode(JSON.stringify(original)).byteLength);
		await store.create('alice', original);
		await expect(store.update('alice', original.deck.id, 1, 'x'.repeat(256))).rejects.toThrow('INVALID_MATERIAL');
		expect(await store.show('alice', original.deck.id)).toEqual(managed(original));
	});
	test('archive and metadata updates share the same revision guard across workers', async () => {
		await store.create('alice', material());
		const results = await Promise.allSettled([
			store.archive('alice', 'deck-original', 1, true),
			new FukushuStore(db).update('alice', 'deck-original', 1, 'competing name'),
		]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_CONFLICT' } });
		expect((await store.show('alice', 'deck-original')).revision).toBe(2);
	});
	test('archived materials retain source deduplication and total quota', async () => {
		await store.create('alice', material());
		await store.archive('alice', 'deck-original', 1, true);
		await expect(store.create('alice', material('copy', 'copy'), { deduplicateSource: true })).rejects.toThrow('MATERIAL_EXISTS');
		await db.query('INSERT INTO fukushu_deck ("ownerId", id, data, "archivedAt") SELECT $1, n::text, $2::jsonb, now() FROM generate_series(1,99) n', ['alice', JSON.stringify(material().deck)]);
		await expect(store.create('alice', material('new', 'new'))).rejects.toThrow('MATERIAL_LIMIT');
		expect(await store.list('alice')).toEqual([]);
		expect(await store.list('alice', { archived: true })).toHaveLength(100);
		await store.archive('alice', 'deck-original', 2, false);
		expect(await store.list('alice')).toHaveLength(1);
	});
	test('management migration round trips existing payloads without dropping a card', async () => {
		const original = material();
		await store.create('alice', original);
		await store.archive('alice', original.deck.id, 1, true);
		const migration = new FukushuMaterialManagement1794871800000();
		const runner = db.createQueryRunner();
		try {
			await migration.down(runner);
			expect((await db.query('SELECT data FROM fukushu_deck'))[0].data).toEqual(original.deck);
			expect((await db.query('SELECT data FROM fukushu_question'))[0].data).toEqual(original.questions[0]);
			await migration.up(runner);
		} finally { await runner.release(); }
		expect(await store.show('alice', original.deck.id)).toEqual(managed(original));
	});
	describe('card explanation versions', () => {
		const byteSize = (value: unknown) => Buffer.byteLength(JSON.stringify(value), 'utf8');
		const versionRows = () => db.query('SELECT * FROM fukushu_question_version ORDER BY "ownerId", "questionId", version');
		test('keeps a virtual baseline until an edit and preserves every non-explanation field', async () => {
			const original = material();
			original.deck.sourceText = 'unchanged original\n原文';
			original.questions[0].payload.typeAnswer = true;
			original.questions[0].payload.acceptedAnswer = 'accepted answer';
			original.questions[0].enabled = false;
			original.questions[0].enabledKey = 0;
			const other = material(original.deck.id, 'other-card').questions[0];
			other.sourceKey = other.payload.sourceKey = 'other-key';
			original.questions.push(other);
			original.deck.questionCount = 2;
			const card = original.questions[0];
			await store.create('alice', original);
			expect(await versionRows()).toEqual([]);
			expect(await store.listCardVersions('alice', original.deck.id, card.id)).toEqual({ currentVersion: 1, versions: [{ version: 1, recordedAt: null, kind: 'baseline' }] });
			expect(await store.showCardVersion('alice', original.deck.id, card.id, 1)).toEqual({ version: 1, recordedAt: null, kind: 'baseline', question: card });
			expect(await store.listCardVersions('alice', original.deck.id, card.id, { before: 1 })).toEqual({ currentVersion: 1, versions: [] });
			expect(await store.updateCardExplanation('alice', original.deck.id, card.id, 1, null)).toEqual({ revision: 1, archivedAt: null, version: 1 });
			expect(await versionRows()).toEqual([]);
			expect(await store.updateCardExplanation('alice', original.deck.id, card.id, 1, '解説🌟')).toEqual({ revision: 2, archivedAt: null, version: 2 });
			const saved = await store.show('alice', original.deck.id);
			expect({ ...saved.deck, updatedAt: original.deck.updatedAt }).toEqual(original.deck);
			expect(saved.questions[1]).toEqual(other);
			expect({ ...saved.questions[0], payload: { ...saved.questions[0].payload, explanation: undefined }, updatedAt: card.updatedAt }).toEqual({ ...card, payload: { ...card.payload, explanation: undefined } });
			expect(saved.questions[0].payload.explanation).toEqual({ format: 'plain', value: '解説🌟' });
			const rows = await versionRows();
			expect(rows.map((row: { version: number; kind: string }) => [row.version, row.kind])).toEqual([[1, 'baseline'], [2, 'explanation']]);
			expect(rows[0].data).toEqual(card);
			expect(rows[1].data).toEqual(saved.questions[0]);
			for (const row of rows) expect(row.byteSize).toBe(byteSize(row.data));
			expect(rows[1].byteSize).toBeGreaterThan(JSON.stringify(rows[1].data).length);
			expect((await store.showCardVersion('alice', original.deck.id, card.id, 1)).recordedAt).toEqual(expect.any(String));
			const firstVersions = await versionRows();
			await expect(store.updateCardExplanation('alice', original.deck.id, card.id, 1, '解説🌟')).rejects.toThrow('MATERIAL_CONFLICT');
			expect(await store.updateCardExplanation('alice', original.deck.id, card.id, 2, '解説🌟')).toEqual({ revision: 2, archivedAt: null, version: 2 });
			expect(await versionRows()).toEqual(firstVersions);
			expect(await store.updateCardExplanation('alice', original.deck.id, card.id, 2, null)).toEqual({ revision: 3, archivedAt: null, version: 3 });
			expect((await store.show('alice', original.deck.id)).questions[0].payload).not.toHaveProperty('explanation');
			expect((await versionRows()).slice(0, 2)).toEqual(firstVersions);
			const latest = await store.listCardVersions('alice', original.deck.id, card.id, { limit: 2 });
			expect(latest.currentVersion).toBe(3);
			expect(latest.versions.map(row => row.version)).toEqual([3, 2]);
			expect((await store.listCardVersions('alice', original.deck.id, card.id, { before: 2, limit: 1 })).versions.map(row => row.version)).toEqual([1]);
		});
		test('isolates owners with matching IDs and hides missing deck, card and version identities', async () => {
			await store.create('alice', material());
			const bob = material(); bob.questions[0].payload.answer.value = 'private Bob answer';
			await store.create('bob', bob);
			await store.create('alice', material('other-deck', 'other-card'));
			await store.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'Alice explanation');
			expect(await store.showCardVersion('bob', 'deck-original', 'card-original', 1)).toMatchObject({ question: bob.questions[0], recordedAt: null });
			expect((await store.listCardVersions('bob', 'deck-original', 'card-original')).currentVersion).toBe(1);
			for (const [owner, deck, card] of [['missing-owner', 'deck-original', 'card-original'], ['bob', 'other-deck', 'other-card'], ['alice', 'other-deck', 'card-original'], ['alice', 'deck-original', 'missing-card']]) {
				await expect(store.updateCardExplanation(owner, deck, card, 1, 'unavailable')).rejects.toThrow('NO_SUCH_MATERIAL');
				await expect(store.listCardVersions(owner, deck, card)).rejects.toThrow('NO_SUCH_MATERIAL');
				await expect(store.showCardVersion(owner, deck, card, 1)).rejects.toThrow('NO_SUCH_MATERIAL');
			}
			await expect(store.showCardVersion('alice', 'deck-original', 'card-original', 3)).rejects.toThrow('NO_SUCH_MATERIAL');
			await expect(store.showCardVersion('bob', 'deck-original', 'card-original', 2)).rejects.toThrow('NO_SUCH_MATERIAL');
			expect(await store.show('bob', 'deck-original')).toEqual(managed(bob));
		});
		test('validates direct input before creating any baseline or changing a revision', async () => {
			await store.create('alice', material());
			for (const explanation of ['x'.repeat(16_385), '\uD800', '\0', 1, undefined]) {
				await expect(store.updateCardExplanation('alice', 'deck-original', 'card-original', 1, explanation as string)).rejects.toThrow('INVALID_MATERIAL');
			}
			for (const expectedRevision of [0, -1, 1.5, Number.MAX_SAFE_INTEGER]) {
				await expect(store.updateCardExplanation('alice', 'deck-original', 'card-original', expectedRevision, 'text')).rejects.toThrow('INVALID_MATERIAL');
			}
			for (const options of [{ before: 0 }, { before: 1.5 }, { before: 2_147_483_648 }, { limit: 0 }, { limit: 21 }, { limit: 1.5 }]) {
				await expect(store.listCardVersions('alice', 'deck-original', 'card-original', options)).rejects.toThrow('INVALID_MATERIAL');
			}
			await expect(store.showCardVersion('alice', 'deck-original', 'card-original', 0)).rejects.toThrow('INVALID_MATERIAL');
			expect(await versionRows()).toEqual([]);
			expect(await store.show('alice', 'deck-original')).toEqual(managed(material()));
			await store.updateCardExplanation('alice', 'deck-original', 'card-original', 1, '');
			expect((await store.show('alice', 'deck-original')).questions[0].payload.explanation).toEqual({ format: 'plain', value: '' });
		});
		test.each(['card', 'metadata', 'archive'] as const)('serializes a competing %s mutation against a card edit', async competing => {
			await store.create('alice', material());
			const other = new FukushuStore(db);
			const second = competing === 'card'
				? () => other.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'second')
				: competing === 'metadata'
					? () => other.update('alice', 'deck-original', 1, 'renamed')
					: () => other.archive('alice', 'deck-original', 1, true);
			const results = await Promise.allSettled([store.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'first'), second()]);
			expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
			expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_CONFLICT' } });
			const saved = await store.show('alice', 'deck-original');
			expect(saved.revision).toBe(2);
			expect(await versionRows()).toHaveLength(saved.questions[0].payload.explanation ? 2 : 0);
		});
		test('allows edits to archived materials while retaining archive state and old snapshots', async () => {
			await store.create('alice', material());
			const archived = await store.archive('alice', 'deck-original', 1, true);
			expect(await store.updateCardExplanation('alice', 'deck-original', 'card-original', 2, 'archived explanation')).toEqual({ ...archived, revision: 3, version: 2 });
			expect(await store.list('alice')).toEqual([]);
			expect((await store.show('alice', 'deck-original')).archivedAt).toBe(archived.archivedAt);
			expect((await store.showCardVersion('alice', 'deck-original', 'card-original', 1)).question).toEqual(material().questions[0]);
		});
		test('includes baseline and current versions in the 64-version limit without pruning', async () => {
			await store.create('alice', material());
			for (let revision = 1; revision < 64; revision++) {
				await store.updateCardExplanation('alice', 'deck-original', 'card-original', revision, `explanation ${revision}`);
			}
			const before = await versionRows();
			expect(before).toHaveLength(64);
			await expect(store.updateCardExplanation('alice', 'deck-original', 'card-original', 64, 'limit')).rejects.toThrow('CARD_HISTORY_LIMIT');
			expect(await versionRows()).toEqual(before);
			expect((await store.show('alice', 'deck-original')).revision).toBe(64);
			expect(await store.updateCardExplanation('alice', 'deck-original', 'card-original', 64, 'explanation 63')).toEqual({ revision: 64, archivedAt: null, version: 64 });
			expect((await store.listCardVersions('alice', 'deck-original', 'card-original')).versions).toHaveLength(20);
			expect((await store.listCardVersions('alice', 'deck-original', 'card-original', { before: 2 })).versions.map(row => row.version)).toEqual([1]);
		}, 30_000);
		test('counts UTF-8 bytes across owned snapshots and accepts exactly 32 MiB without partial writes', async () => {
			const original = material();
			await store.create('alice', original);
			await store.create('bob', original);
			await store.updateCardExplanation('bob', 'deck-original', 'card-original', 1, 'Bob history must not consume Alice quota');
			const next = structuredClone(original.questions[0]);
			next.payload.explanation = { format: 'plain', value: '日本語🌟' };
			const needed = byteSize(original.questions[0]) + byteSize(next);
			// Seed valid full QuestionRecord snapshots through SQL to exercise a real
			// 32 MiB aggregate without thousands of API transactions or large JS arrays.
			const quota = material('quota-deck', 'quota-card-00');
			quota.questions = Array.from({ length: 18 }, (_, index) => {
				const card = material(quota.deck.id, `quota-card-${String(index).padStart(2, '0')}`).questions[0];
				card.sourceKey = card.payload.sourceKey = `quota-key-${String(index).padStart(2, '0')}`;
				card.payload.prompt.value = card.payload.answer.value = 'x'.repeat(16_384);
				card.payload.explanation = { format: 'plain', value: '' };
				return card;
			});
			quota.deck.questionCount = quota.deck.enabledQuestionCount = quota.questions.length;
			await store.create('alice', quota);
			const fullSize = byteSize(quota.questions[0]);
			const target = 32 * 1024 * 1024 - needed + 1;
			let fullCount = Math.floor(target / fullSize);
			let remainder = target - fullCount * fullSize;
			const small = structuredClone(quota.questions[0]);
			small.payload.prompt.value = small.payload.answer.value = '';
			if (remainder < byteSize(small)) { fullCount--; remainder += fullSize; }
			let remainingFull = fullCount;
			let tailWritten = false;
			for (const card of quota.questions) {
				const count = Math.min(remainingFull, 64);
				if (count) {
					await db.query('INSERT INTO fukushu_question_version ("ownerId", "questionId", version, data, "recordedAt", kind, "byteSize") SELECT $1, $2, n, $3::jsonb, now(), CASE WHEN n = 1 THEN \'baseline\' ELSE \'explanation\' END, $4 FROM generate_series(1, $5::integer) n', ['alice', card.id, JSON.stringify(card), byteSize(card), count]);
					remainingFull -= count;
				}
				let currentVersion = count;
				if (!remainingFull && count < 64 && !tailWritten) {
					const tail = structuredClone(card);
					tail.payload.prompt.value = tail.payload.answer.value = '';
					let fill = remainder - byteSize(tail);
					for (const content of [tail.payload.prompt, tail.payload.answer, tail.payload.explanation!]) {
						const length = Math.min(fill, 16_384); content.value = 'x'.repeat(length); fill -= length;
					}
					expect(fill).toBe(0);
					expect(byteSize(tail)).toBe(remainder);
					currentVersion++;
					await db.query('INSERT INTO fukushu_question_version ("ownerId", "questionId", version, data, "recordedAt", kind, "byteSize") VALUES ($1, $2, $3, $4::jsonb, now(), $5, $6)', ['alice', card.id, currentVersion, JSON.stringify(tail), 'explanation', byteSize(tail)]);
					tailWritten = true;
				}
				if (currentVersion) await db.query('UPDATE fukushu_question SET "currentVersion" = $1 WHERE "ownerId" = $2 AND id = $3', [currentVersion, 'alice', card.id]);
			}
			expect(remainingFull).toBe(0); expect(tailWritten).toBe(true);
			const total = async () => Number((await db.query('SELECT SUM("byteSize") AS bytes FROM fukushu_question_version WHERE "ownerId" = $1', ['alice']))[0].bytes);
			expect(await total()).toBe(target);
			await expect(store.updateCardExplanation('alice', original.deck.id, original.questions[0].id, 1, '日本語🌟')).rejects.toThrow('CARD_HISTORY_LIMIT');
			expect(await store.show('alice', original.deck.id)).toEqual(managed(original));
			expect((await store.listCardVersions('alice', original.deck.id, original.questions[0].id)).currentVersion).toBe(1);
			expect(await total()).toBe(target);
			// Release exactly one byte by shortening one ASCII prompt in a seeded snapshot.
			await db.query('UPDATE fukushu_question_version SET data = jsonb_set(data, \'{payload,prompt,value}\', to_jsonb(substring(data #>> \'{payload,prompt,value}\' FROM 2))), "byteSize" = "byteSize" - 1 WHERE "ownerId" = $1 AND "questionId" = $2 AND version = 1', ['alice', quota.questions[0].id]);
			expect(await store.updateCardExplanation('alice', original.deck.id, original.questions[0].id, 1, '日本語🌟')).toEqual({ revision: 2, archivedAt: null, version: 2 });
			expect(await total()).toBe(32 * 1024 * 1024);
		}, 30_000);
		test('rolls back both baseline and new version when material would exceed one MiB', async () => {
			const original = material();
			original.questions = Array.from({ length: 60 }, (_, i) => {
				const question = structuredClone(original.questions[0]);
				question.id = question.payload.id = `card-${i}`;
				question.sourceKey = question.payload.sourceKey = `source-${i}`;
				question.payload.prompt.value = 'x'.repeat(16_384);
				return question;
			});
			original.deck.questionCount = original.deck.enabledQuestionCount = original.questions.length;
			original.deck.sourceText = '';
			original.deck.sourceText = 'x'.repeat(1_048_576 - 16 - byteSize(original));
			await store.create('alice', original);
			await expect(store.updateCardExplanation('alice', original.deck.id, original.questions[0].id, 1, '日本語')).rejects.toThrow('INVALID_MATERIAL');
			expect(await versionRows()).toEqual([]);
			expect(await store.show('alice', original.deck.id)).toEqual(managed(original));
		});
		test.each(['material', 'versions'] as const)('reads one committed %s snapshot while another connection edits the card', async kind => {
			const original = material();
			await store.create('alice', original);
			if (kind === 'versions') await store.updateCardExplanation('alice', original.deck.id, original.questions[0].id, 1, 'version two');
			const writer = new DataSource(db.options);
			await writer.initialize();
			let continueRead!: () => void;
			let signalRead!: () => void;
			const suspended = new Promise<void>(resolve => { continueRead = resolve; });
			const firstSelect = new Promise<void>(resolve => { signalRead = resolve; });
			const createRunner = db.createQueryRunner.bind(db);
			let gated = false;
			const spy = vi.spyOn(db, 'createQueryRunner').mockImplementation(mode => {
				const runner = createRunner(mode);
				const query = runner.query.bind(runner);
				vi.spyOn(runner, 'query').mockImplementation(async (sql: string, parameters?: Parameters<typeof runner.query>[1], structured?: boolean) => {
					const result = structured ? await query(sql, parameters, true) : await query(sql, parameters);
					if (!gated && sql.startsWith('SELECT') && sql.includes('FROM "fukushu_deck"')) {
						gated = true; signalRead(); await suspended;
					}
					return result;
				});
				return runner;
			});
			const reading = kind === 'material'
				? store.show('alice', original.deck.id)
				: store.listCardVersions('alice', original.deck.id, original.questions[0].id);
			try {
				await firstSelect;
				await new FukushuStore(writer).updateCardExplanation('alice', original.deck.id, original.questions[0].id, kind === 'material' ? 1 : 2, 'concurrent explanation');
				continueRead();
				if (kind === 'material') expect(await reading).toEqual(managed(original));
				else expect(await reading).toMatchObject({ currentVersion: 2, versions: [{ version: 2 }, { version: 1 }] });
			} finally {
				continueRead(); spy.mockRestore(); await reading.catch(() => {}); await writer.destroy();
			}
		});
		test('empty migration round trip preserves cards and populated down refuses to lose history', async () => {
			const original = material();
			await store.create('alice', original);
			const migration = new FukushuQuestionVersions1794880800000();
			const runner = db.createQueryRunner();
			try {
				await migration.down(runner);
				expect((await db.query('SELECT data FROM fukushu_question'))[0].data).toEqual(original.questions[0]);
				await migration.up(runner);
				expect(await versionRows()).toEqual([]);
				await store.updateCardExplanation('alice', original.deck.id, original.questions[0].id, 1, 'keep this history');
				const before = await versionRows();
				await expect(migration.down(runner)).rejects.toThrow('saved card versions must be preserved');
				expect(await versionRows()).toEqual(before);
				expect((await store.showCardVersion('alice', original.deck.id, original.questions[0].id, 1)).question).toEqual(original.questions[0]);
			} finally { await runner.release(); }
		});
		test('account removal cascades only that owner card history', async () => {
			for (const owner of ['alice', 'bob']) {
				await store.create(owner, material());
				await store.updateCardExplanation(owner, 'deck-original', 'card-original', 1, owner);
			}
			await db.query('DELETE FROM "user" WHERE id = $1', ['alice']);
			expect((await versionRows()).map((row: { ownerId: string }) => row.ownerId)).toEqual(['bob', 'bob']);
			expect((await store.showCardVersion('bob', 'deck-original', 'card-original', 1)).question).toEqual(material().questions[0]);
		});
	});
	test('real API authenticates, enforces scopes and never accepts a caller-supplied owner', async () => {
		const api = createFukushuRouter(store);
		const alice = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
		const bob = mockDeep<MiLocalUser>({ id: 'bob', isSuspended: false, movedToUri: null });
		const input = { material: material() };
		await expect(call(api.create, input, { context: testContext(null) })).rejects.toThrow();
		await expect(call(api.create, input, { context: testContext(alice, { permission: ['read:account'] }) })).rejects.toThrow();
		await call(api.create, input, { context: testContext(alice, { permission: ['write:account'] }) });
		await expect(call(api.show, { id: input.material.deck.id }, { context: testContext(alice, { permission: ['write:account'] }) })).rejects.toThrow();
		expect(await call(api.show, { id: input.material.deck.id }, { context: testContext(alice, { permission: ['read:account'] }) })).toEqual(managed(input.material));
		await expect(call(api.show, { id: input.material.deck.id, ownerId: 'alice' } as never, { context: testContext(bob) })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL' });
	});
});
