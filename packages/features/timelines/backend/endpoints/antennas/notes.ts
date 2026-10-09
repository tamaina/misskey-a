/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasNotesContract, antennasNotesErrors } from './notes.contract.js';
import { Brackets } from 'typeorm';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { trackPromise } from '@features/runtime/backend/async/promise-tracker.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { FanoutTimelineService } from '../../services/FanoutTimelineService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AntennasNotesDependencies {
	notesRepository: NotesRepository;
	antennasRepository: AntennasRepository;
	idService: IdService;
	noteEntityService: NoteEntityService;
	queryService: QueryService;
	fanoutTimelineService: FanoutTimelineService;
	globalEventService: GlobalEventService;
	channelMutingService: ChannelMutingService;
}
export function createAntennasNotesProcedure<Actor extends MiLocalUser>(deps: AntennasNotesDependencies) {
	return implement(antennasNotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: antennasNotesContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
			const antenna = await deps.antennasRepository.findOneBy({
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
			trackPromise(deps.antennasRepository.update(antenna.id, antenna));
			if (needPublishEvent) {
				deps.globalEventService.publishInternalEvent('antennaUpdated', antenna);
			}
			let noteIds = await deps.fanoutTimelineService.get(`antennaTimeline:${antenna.id}`, untilId, sinceId);
			noteIds = noteIds.slice(0, ps.limit);
			if (noteIds.length === 0) {
				return [];
			}
			const query = deps.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');
			// -- ミュートされたチャンネル対策
			const mutingChannelIds = await deps.channelMutingService
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
			deps.queryService.generateVisibilityQuery(query, me);
			deps.queryService.generateBaseNoteFilteringQuery(query, me);
			const notes = await query.getMany();
			if (sinceId != null && untilId == null) {
				notes.sort((a, b) => a.id < b.id ? -1 : 1);
			} else {
				notes.sort((a, b) => a.id > b.id ? -1 : 1);
			}
			return await deps.noteEntityService.packMany(notes, me);
		});
}
