/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { rolesContract } from '../../api.contract.js';
import type { RolesDependencies } from '../../api.dependencies.js';
import { Brackets } from 'typeorm';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../api.errors.js';
export function createRolesNotesProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'idService' | 'rolesRepository' | 'fanoutTimelineService' | 'notesRepository' | 'channelMutingService' | 'queryService' | 'noteEntityService'>) {
	return implement(rolesContract.rolesNotes, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'roles/notes', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'number', sinceDate: 'number', untilDate: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate) : null);
			const role = await deps.rolesRepository.findOneBy({
				id: ps.roleId,
				isPublic: true,
			});
			if (role == null) {
				throw apiError(rolesErrors.rolesNotes.noSuchRole);
			}
			if (!role.isExplorable) {
				return [];
			}
			let noteIds = await deps.fanoutTimelineService.get(`roleTimeline:${role.id}`, untilId, sinceId);
			noteIds = noteIds.slice(0, ps.limit);
			if (noteIds.length === 0) {
				return [];
			}
			const query = deps.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.andWhere('(note.visibility = \'public\')')
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
			deps.queryService.generateVisibilityQuery(query, me);
			deps.queryService.generateBaseNoteFilteringQuery(query, me);
			const notes = await query.getMany();
			notes.sort((a, b) => a.id > b.id ? -1 : 1);
			return await deps.noteEntityService.packMany(notes, me);
		});
}
