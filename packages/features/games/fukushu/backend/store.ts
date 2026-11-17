/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { IsNull, LessThan, Not, QueryFailedError } from 'typeorm';
import { cardVersionPageSchema, explanationUpdateSchema, metadataSchema, revisionSchema } from './material.contract.js';
import { materialSchema, questionSchema, sourceIdSchema } from '../shared/material.schema.js';
import { MiFukushuDeck } from './models/FukushuDeck.js';
import { MiFukushuQuestion } from './models/FukushuQuestion.js';
import { MiFukushuQuestionVersion } from './models/FukushuQuestionVersion.js';
import type { DataSource, EntityManager } from 'typeorm';

export class MaterialError extends Error {
	constructor(public readonly code: 'CARD_HISTORY_LIMIT' | 'MATERIAL_CONFLICT' | 'NO_SUCH_MATERIAL' | 'MATERIAL_EXISTS' | 'MATERIAL_LIMIT' | 'INVALID_MATERIAL' | 'NO_SUCH_FILE' | 'IMPORT_FAILED') {
		super(code);
	}
}

export class FukushuStore {
	constructor(private readonly db: DataSource) {}

	async create(ownerId: string, input: unknown, options: { deduplicateSource?: boolean } = {}) {
		const parsed = v.safeParse(materialSchema, input);
		if (!parsed.success) throw new MaterialError('INVALID_MATERIAL');
		const material = parsed.output;
		try {
			await this.db.transaction(async manager => {
				// Enforce the owner quota atomically across server workers.
				await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
				const decks = manager.getRepository(MiFukushuDeck);
				if (await decks.existsBy({ ownerId, id: material.deck.id })) throw new MaterialError('MATERIAL_EXISTS');
				if (options.deduplicateSource && await decks.createQueryBuilder('deck')
					.where('deck.ownerId = :ownerId', { ownerId })
					.andWhere("deck.data ->> 'sourceType' = :sourceType", { sourceType: material.deck.sourceType })
					.andWhere("deck.data ->> 'sourceHash' = :sourceHash", { sourceHash: material.deck.sourceHash })
					.getExists()) throw new MaterialError('MATERIAL_EXISTS');
				if (await decks.countBy({ ownerId }) >= 100) throw new MaterialError('MATERIAL_LIMIT');
				await decks.insert({ ownerId, id: material.deck.id, data: material.deck });
				await manager.getRepository(MiFukushuQuestion).insert(material.questions.map((data, position) => ({
					ownerId, id: data.id, deckId: data.deckId, position, data,
				})));
			});
		} catch (error) {
			// A card ID belongs to exactly one deck for each owner. Never overwrite it.
			if (error instanceof QueryFailedError && error.driverError.code === '23505') throw new MaterialError('MATERIAL_EXISTS');
			throw error;
		}
		return material;
	}

	async list(ownerId: string, options: { archived?: boolean } = {}) {
		const decks = await this.db.getRepository(MiFukushuDeck).find({ where: { ownerId, archivedAt: options.archived ? Not(IsNull()) : IsNull() }, order: { id: 'ASC' }, take: 100 });
		return decks.map(({ data: { sourceText: _sourceText, ...summary } }) => summary);
	}

	async show(ownerId: string, id: string) {
		// Deck revision and cards must describe one committed state during an edit.
		return this.db.transaction('REPEATABLE READ', async manager => {
			const deck = await manager.getRepository(MiFukushuDeck).findOneBy({ ownerId, id });
			if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
			const questions = await manager.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { position: 'ASC' } });
			return { deck: deck.data, questions: questions.map(question => question.data), ...this.management(deck) };
		});
	}

	async update(ownerId: string, id: string, expectedRevision: number, name: string, description?: string) {
		const parsed = v.safeParse(metadataSchema, { name, description });
		if (!parsed.success || !v.safeParse(revisionSchema, expectedRevision).success) throw new MaterialError('INVALID_MATERIAL');
		return this.mutate(ownerId, id, expectedRevision, async (deck, manager) => {
			const { description: _previousDescription, ...previous } = deck.data;
			const data = { ...previous, name: parsed.output.name, ...(parsed.output.description === undefined ? {} : { description: parsed.output.description }), updatedAt: new Date().toISOString() };
			// Metadata growth must not make the existing bounded material unreadable.
			const questions = await manager.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { position: 'ASC' } });
			if (!v.safeParse(materialSchema, { deck: data, questions: questions.map(question => question.data) }).success) throw new MaterialError('INVALID_MATERIAL');
			return { data };
		});
	}

	async archive(ownerId: string, id: string, expectedRevision: number, archived: boolean) {
		if (!v.safeParse(revisionSchema, expectedRevision).success || typeof archived !== 'boolean') throw new MaterialError('INVALID_MATERIAL');
		return this.mutate(ownerId, id, expectedRevision, async deck => {
			return { archivedAt: archived ? (deck.archivedAt ?? new Date()) : null };
		});
	}

	async updateCardExplanation(ownerId: string, id: string, questionId: string, expectedRevision: number, explanation: string | null) {
		const parsed = v.safeParse(explanationUpdateSchema, explanation);
		if (!parsed.success || !v.safeParse(revisionSchema, expectedRevision).success) throw new MaterialError('INVALID_MATERIAL');
		this.validateCardIds(id, questionId);
		return this.db.transaction(async manager => {
			await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
			const { deck, question } = await this.ownedCard(manager, ownerId, id, questionId);
			if (deck.revision !== expectedRevision) throw new MaterialError('MATERIAL_CONFLICT');
			// A stale no-op still conflicts, but an actual no-op consumes no history or revision.
			if ((question.data.payload.explanation?.value ?? null) === parsed.output) {
				return { ...this.management(deck), version: question.currentVersion };
			}
			if (deck.revision === 2_147_483_647) throw new MaterialError('MATERIAL_CONFLICT');
			const now = new Date();
			const { explanation: _oldExplanation, ...payload } = question.data.payload;
			const data = {
				...question.data,
				payload: { ...payload, ...(parsed.output === null ? {} : { explanation: { format: 'plain' as const, value: parsed.output } }) },
				updatedAt: now.toISOString(),
			};
			const deckData = { ...deck.data, updatedAt: now.toISOString() };
			const questions = await manager.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { position: 'ASC' } });
			if (!v.safeParse(materialSchema, { deck: deckData, questions: questions.map(row => row.id === questionId ? data : row.data) }).success) {
				throw new MaterialError('INVALID_MATERIAL');
			}
			const snapshots = [
				...(question.currentVersion === 1 ? [{ version: 1, kind: 'baseline' as const, data: question.data }] : []),
				{ version: question.currentVersion + 1, kind: 'explanation' as const, data },
			].map(snapshot => {
				if (!v.safeParse(questionSchema, snapshot.data).success) throw new MaterialError('INVALID_MATERIAL');
				return { ...snapshot, ownerId, questionId, recordedAt: now, byteSize: Buffer.byteLength(JSON.stringify(snapshot.data), 'utf8') };
			});
			const versions = manager.getRepository(MiFukushuQuestionVersion);
			const count = await versions.countBy({ ownerId, questionId });
			const [{ bytes }] = await manager.query('SELECT COALESCE(SUM("byteSize"), 0)::text AS bytes FROM "fukushu_question_version" WHERE "ownerId" = $1', [ownerId]) as { bytes: string }[];
			if (question.currentVersion >= 64 || count + snapshots.length > 64
				|| Number(bytes) + snapshots.reduce((sum, snapshot) => sum + snapshot.byteSize, 0) > 32 * 1024 * 1024) {
				throw new MaterialError('CARD_HISTORY_LIMIT');
			}
			await versions.insert(snapshots);
			await manager.getRepository(MiFukushuQuestion).update({ ownerId, id: questionId, deckId: id }, { data, currentVersion: question.currentVersion + 1 });
			await manager.getRepository(MiFukushuDeck).update({ ownerId, id }, { data: deckData, revision: deck.revision + 1 });
			return { revision: deck.revision + 1, archivedAt: deck.archivedAt?.toISOString() ?? null, version: question.currentVersion + 1 };
		});
	}

	async listCardVersions(ownerId: string, id: string, questionId: string, options: { before?: number; limit?: number } = {}) {
		this.validateCardIds(id, questionId);
		const parsed = v.safeParse(cardVersionPageSchema, options);
		if (!parsed.success) throw new MaterialError('INVALID_MATERIAL');
		const { before, limit } = parsed.output;
		return this.db.transaction('REPEATABLE READ', async manager => {
			const { question } = await this.ownedCard(manager, ownerId, id, questionId);
			if (question.currentVersion === 1) {
				return { currentVersion: 1, versions: before === 1 ? [] : [{ version: 1, recordedAt: null, kind: 'baseline' as const }] };
			}
			const rows = await manager.getRepository(MiFukushuQuestionVersion).find({
				where: { ownerId, questionId, ...(before === undefined ? {} : { version: LessThan(before) }) },
				select: { version: true, recordedAt: true, kind: true },
				order: { version: 'DESC' }, take: limit,
			});
			return { currentVersion: question.currentVersion, versions: rows.map(row => this.versionSummary(row)) };
		});
	}

	async showCardVersion(ownerId: string, id: string, questionId: string, version: number) {
		this.validateCardIds(id, questionId);
		if (!v.safeParse(revisionSchema, version).success) throw new MaterialError('INVALID_MATERIAL');
		return this.db.transaction('REPEATABLE READ', async manager => {
			const { question } = await this.ownedCard(manager, ownerId, id, questionId);
			if (question.currentVersion === 1 && version === 1) {
				return { version: 1, recordedAt: null, kind: 'baseline' as const, question: question.data };
			}
			if (version > question.currentVersion) throw new MaterialError('NO_SUCH_MATERIAL');
			const row = await manager.getRepository(MiFukushuQuestionVersion).findOneBy({ ownerId, questionId, version });
			if (!row) throw new MaterialError('NO_SUCH_MATERIAL');
			return { ...this.versionSummary(row), question: row.data };
		});
	}

	private validateCardIds(id: string, questionId: string) {
		if (!v.safeParse(sourceIdSchema, id).success || !v.safeParse(sourceIdSchema, questionId).success) throw new MaterialError('INVALID_MATERIAL');
	}

	private async ownedCard(manager: EntityManager, ownerId: string, id: string, questionId: string) {
		const deck = await manager.getRepository(MiFukushuDeck).findOneBy({ ownerId, id });
		const question = await manager.getRepository(MiFukushuQuestion).findOneBy({ ownerId, deckId: id, id: questionId });
		if (!deck || !question) throw new MaterialError('NO_SUCH_MATERIAL');
		return { deck, question };
	}

	private versionSummary(row: Pick<MiFukushuQuestionVersion, 'version' | 'recordedAt' | 'kind'>) {
		return { version: row.version, recordedAt: row.recordedAt.toISOString(), kind: row.kind };
	}

	private async mutate(ownerId: string, id: string, expectedRevision: number, change: (deck: MiFukushuDeck, manager: EntityManager) => Promise<Partial<Pick<MiFukushuDeck, 'data' | 'archivedAt'>>>) {
		return this.db.transaction(async manager => {
			// Share the create lock: all owner mutations are serialized across workers.
			await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
			const decks = manager.getRepository(MiFukushuDeck);
			const deck = await decks.findOneBy({ ownerId, id });
			if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
			if (deck.revision !== expectedRevision || deck.revision === 2_147_483_647) throw new MaterialError('MATERIAL_CONFLICT');
			const changes = await change(deck, manager);
			Object.assign(deck, changes, { revision: deck.revision + 1 });
			await decks.update({ ownerId, id }, { ...changes, revision: deck.revision });
			return this.management(deck);
		});
	}

	private management(deck: MiFukushuDeck) {
		return { revision: deck.revision, archivedAt: deck.archivedAt?.toISOString() ?? null };
	}
}
