/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets, EntityNotFoundError } from 'typeorm';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { MiAnnouncement } from './models/Announcement.js';
import type { announcementsContract } from './api.contract.js';
import type { InferSchemaOutput, InferContractRouterOutputs } from '@orpc/contract';

export interface AnnouncementUpdateValues {
	updatedAt: Date;
	title: string | undefined;
	text: string | undefined;
	imageUrl: string | null;
	display: MiAnnouncement['display'] | undefined;
	icon: MiAnnouncement['icon'] | undefined;
	forExistingUsers: boolean | undefined;
	silence: boolean | undefined;
	needConfirmationToRead: boolean | undefined;
	isActive: boolean | undefined;
}

type Inputs = { [K in keyof typeof announcementsContract]: InferSchemaOutput<NonNullable<(typeof announcementsContract)[K]['~orpc']['inputSchema']>> };
type Outputs = InferContractRouterOutputs<typeof announcementsContract>;
export interface AnnouncementsOperations<Actor extends ApiActor> {
	create(input: Inputs['create'], actor: Actor): Promise<Outputs['create']>;
	delete(input: Inputs['delete'], actor: Actor): Promise<void>;
	adminList(input: Inputs['adminList'], actor: Actor): Promise<Outputs['adminList']>;
	update(input: Inputs['update'], actor: Actor): Promise<void>;
	list(input: Inputs['list'], actor: Actor | null): Promise<Outputs['list']>;
	show(input: Inputs['show'], actor: Actor | null): Promise<Outputs['show']>;
	read(input: Inputs['read'], actor: Actor): Promise<void>;
}

export interface AnnouncementsDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsRepository, 'createQueryBuilder' | 'findOneBy'>;
	announcementReadsRepository: Pick<AnnouncementReadsRepository, 'countBy'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	idService: Pick<IdService, 'parse'>;
	announcementEntityService: {
		packMany(rows: MiAnnouncement[], actor: Actor | null): Promise<Outputs['list']>;
	};
	announcementService: {
		create(values: Partial<MiAnnouncement>, actor: Actor): Promise<{ packed: Outputs['create'] }>;
		update(row: MiAnnouncement, values: AnnouncementUpdateValues, actor: Actor): Promise<void>;
		delete(row: MiAnnouncement, actor: Actor): Promise<void>;
		getAnnouncement(id: string, actor: Actor | null): Promise<Outputs['show']>;
		read(actor: Actor, id: string): Promise<void>;
	};
}

/** Application behavior shared by the HTTP procedures without invoking legacy endpoints. */
export function createAnnouncementsOperations<Actor extends ApiActor>(deps: AnnouncementsDependencies<Actor>): AnnouncementsOperations<Actor> {
	const missing = (id: string) => apiError({ code: 'NO_SUCH_ANNOUNCEMENT', message: 'No such announcement.', id });
	return {
		async create(input, actor) {
			const { packed } = await deps.announcementService.create({ ...input, updatedAt: null, imageUrl: input.imageUrl || null }, actor);
			return packed;
		},
		async delete(input, actor) {
			const row = await deps.announcementsRepository.findOneBy({ id: input.id });
			if (row === null) throw missing('ecad8040-a276-4e85-bda9-015a708d291e');
			await deps.announcementService.delete(row, actor);
		},
		async update(input, actor) {
			const row = await deps.announcementsRepository.findOneBy({ id: input.id });
			if (row === null) throw missing('d3aae5a7-6372-4cb4-b61c-f511ffc2d7cc');
			await deps.announcementService.update(row, {
				updatedAt: new Date(), title: input.title, text: input.text, imageUrl: input.imageUrl || null,
				display: input.display, icon: input.icon, forExistingUsers: input.forExistingUsers,
				silence: input.silence, needConfirmationToRead: input.needConfirmationToRead, isActive: input.isActive,
			}, actor);
		},
		async adminList(input) {
			const query = deps.queryService.makePaginationQuery(deps.announcementsRepository.createQueryBuilder('announcement'), input.sinceId, input.untilId, input.sinceDate, input.untilDate);
			if (input.status === 'archived') query.andWhere('announcement.isActive = false');
			else if (input.status === 'active') query.andWhere('announcement.isActive = true');
			if (input.userId) query.andWhere('announcement.userId = :userId', { userId: input.userId });
			else query.andWhere('announcement.userId IS NULL');
			const rows = await query.limit(input.limit).getMany();
			const result: Outputs['adminList'] = [];
			for (const row of rows) result.push({
				id: row.id, createdAt: deps.idService.parse(row.id).date.toISOString(), updatedAt: row.updatedAt?.toISOString() ?? null,
				title: row.title, text: row.text, imageUrl: row.imageUrl, icon: row.icon, display: row.display,
				isActive: row.isActive, forExistingUsers: row.forExistingUsers, silence: row.silence,
				needConfirmationToRead: row.needConfirmationToRead, userId: row.userId,
				reads: await deps.announcementReadsRepository.countBy({ announcementId: row.id }),
			});
			return result;
		},
		async list(input, actor) {
			const query = deps.queryService.makePaginationQuery(deps.announcementsRepository.createQueryBuilder('announcement'), input.sinceId, input.untilId, input.sinceDate, input.untilDate)
				.andWhere('announcement.isActive = :isActive', { isActive: input.isActive })
				.andWhere(new Brackets(qb => {
					if (actor) qb.orWhere('announcement.userId = :meId', { meId: actor.id });
					qb.orWhere('announcement.userId IS NULL');
				}));
			return deps.announcementEntityService.packMany(await query.limit(input.limit).getMany(), actor);
		},
		async show(input, actor) {
			try {
				return await deps.announcementService.getAnnouncement(input.announcementId, actor);
			} catch (error) {
				if (error instanceof EntityNotFoundError) throw missing('b57b5e1d-4f49-404a-9edb-46b00268f121');
				throw error;
			}
		},
		async read(input, actor) {
			await deps.announcementService.read(actor, input.announcementId);
		},
	};
}
