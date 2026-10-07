/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { allOfNotesSearchByTagDefinition, allOfNotesSearchByTagInput, allOfNotesSearchByTagOutput } from '../../../contract/selector-common-endpoint-definitions.js';
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '../../../../notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(allOfNotesSearchByTagDefinition);

export const meta = {
	tags: ['notes', 'hashtags'],

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof allOfNotesSearchByTagInput, typeof allOfNotesSearchByTagOutput, 'legacy-declared'> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			if (me == null) this.queryService.generateUgcVisibilityQueryForVisitor(query);
			this.queryService.generateBaseNoteFilteringQuery(query, me);

			try {
				if ('tag' in ps) {
					if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
					query.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(ps.tag)] });
				} else {
					query.andWhere(new Brackets(qb => {
						for (const tags of ps.query) {
							qb.orWhere(new Brackets(qb => {
								for (const tag of tags) {
									if (!safeForSql(normalizeForSearch(tag))) throw new Error('Injection');
									qb.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(tag)] });
								}
							}));
						}
					}));
				}
			} catch (e) {
				if (e === 'Injection') return [];
				throw e;
			}

			if (ps.reply != null) {
				if (ps.reply) {
					query.andWhere('note.replyId IS NOT NULL');
				} else {
					query.andWhere('note.replyId IS NULL');
				}
			}

			if (ps.renote != null) {
				if (ps.renote) {
					query.andWhere('note.renoteId IS NOT NULL');
				} else {
					query.andWhere('note.renoteId IS NULL');
				}
			}

			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}

			if (ps.poll != null) {
				if (ps.poll) {
					query.andWhere('note.hasPoll = TRUE');
				} else {
					query.andWhere('note.hasPoll = FALSE');
				}
			}

			// Search notes
			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
