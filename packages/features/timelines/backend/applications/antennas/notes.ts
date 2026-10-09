/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { trackPromise } from '@features/runtime/backend/async/promise-tracker.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { FanoutTimelineService } from '../../services/FanoutTimelineService.js';

import { antennasNotesInput, antennasNotesErrors } from '../../endpoints/antennas/notes.contract.js';
import type * as v from 'valibot';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class AntennasNotesApplicationService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private idService: IdService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private fanoutTimelineService: FanoutTimelineService,
		private globalEventService: GlobalEventService,
		private channelMutingService: ChannelMutingService,
	) {}

	async execute(ps: v.InferOutput<typeof antennasNotesInput>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		const antenna = await this.antennasRepository.findOneBy({
			id: ps.antennaId,
			userId: me.id,
		});

		if (antenna == null) {
			throw apiError(antennasNotesErrors.noSuchAntenna);
		}

		// falseだった場合はアンテナの配信先が増えたことを通知したい
		const needPublishEvent = !antenna.isActive;

		antenna.isActive = true;
		antenna.lastUsedAt = new Date();
		trackPromise(this.antennasRepository.update(antenna.id, antenna));

		if (needPublishEvent) {
			this.globalEventService.publishInternalEvent('antennaUpdated', antenna);
		}

		let noteIds = await this.fanoutTimelineService.get(`antennaTimeline:${antenna.id}`, untilId, sinceId);
		noteIds = noteIds.slice(0, ps.limit);
		if (noteIds.length === 0) {
			return [];
		}

		const query = this.notesRepository.createQueryBuilder('note')
			.where('note.id IN (:...noteIds)', { noteIds: noteIds })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		// -- ミュートされたチャンネル対策
		const mutingChannelIds = await this.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		if (mutingChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.channelId IS NULL');
				qb.orWhere('note.channelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteChannelId IS NULL');
				qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
		}

		// NOTE: センシティブ除外の設定はこのエンドポイントでは無視する。
		// https://github.com/misskey-dev/misskey/pull/15346#discussion_r1929950255

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);

		const notes = await query.getMany();
		if (sinceId != null && untilId == null) {
			notes.sort((a, b) => a.id < b.id ? -1 : 1);
		} else {
			notes.sort((a, b) => a.id > b.id ? -1 : 1);
		}

		return await this.noteEntityService.packMany(notes, me);
	}
}
