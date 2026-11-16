/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { QueryFailedError } from 'typeorm';
import { materialSchema } from '../shared/material.schema.js';
import { MiFukushuDeck } from './models/FukushuDeck.js';
import { MiFukushuQuestion } from './models/FukushuQuestion.js';
import type { DataSource } from 'typeorm';

export class MaterialError extends Error {
	constructor(public readonly code: 'NO_SUCH_MATERIAL' | 'MATERIAL_EXISTS' | 'MATERIAL_LIMIT' | 'INVALID_MATERIAL') {
		super(code);
	}
}

export class FukushuStore {
	constructor(private readonly db: DataSource) {}

	async create(ownerId: string, input: unknown) {
		const parsed = v.safeParse(materialSchema, input);
		if (!parsed.success) throw new MaterialError('INVALID_MATERIAL');
		const material = parsed.output;
		try {
			await this.db.transaction(async manager => {
				// Enforce the owner quota atomically across server workers.
				await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
				const decks = manager.getRepository(MiFukushuDeck);
				if (await decks.existsBy({ ownerId, id: material.deck.id })) throw new MaterialError('MATERIAL_EXISTS');
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

	async show(ownerId: string, id: string) {
		const deck = await this.db.getRepository(MiFukushuDeck).findOneBy({ ownerId, id });
		if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
		const questions = await this.db.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { position: 'ASC' } });
		return { deck: deck.data, questions: questions.map(question => question.data) };
	}
}
