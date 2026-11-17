/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { IsNull, Not, QueryFailedError } from 'typeorm';
import { metadataSchema, revisionSchema } from './material.contract.js';
import { materialSchema } from '../shared/material.schema.js';
import { MiFukushuDeck } from './models/FukushuDeck.js';
import { MiFukushuQuestion } from './models/FukushuQuestion.js';
import type { DataSource, EntityManager } from 'typeorm';

export class MaterialError extends Error {
	constructor(public readonly code: 'MATERIAL_CONFLICT' | 'NO_SUCH_MATERIAL' | 'MATERIAL_EXISTS' | 'MATERIAL_LIMIT' | 'INVALID_MATERIAL' | 'NO_SUCH_FILE' | 'IMPORT_FAILED') {
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
		const deck = await this.db.getRepository(MiFukushuDeck).findOneBy({ ownerId, id });
		if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
		const questions = await this.db.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { position: 'ASC' } });
		return { deck: deck.data, questions: questions.map(question => question.data), ...this.management(deck) };
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
