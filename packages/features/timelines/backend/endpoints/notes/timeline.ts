/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesTimelineDefinition, packedNotesTimelineInput, packedNotesTimelineOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { MiLocalUser } from '@features/users/backend/models/User.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';

const contractProjection = projectEndpointContract(packedNotesTimelineDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesTimelineInput, typeof packedNotesTimelineOutput> {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private userFollowingService: UserFollowingService,
		private channelMutingService: ChannelMutingService,
		private channelFollowingService: ChannelFollowingService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			if (!this.serverSettings.enableFanoutTimeline) {
				const timeline = await this.getFromDb({
					untilId,
					sinceId,
					limit: ps.limit,
					includeMyRenotes: ps.includeMyRenotes,
					includeRenotedMyNotes: ps.includeRenotedMyNotes,
					includeLocalRenotes: ps.includeLocalRenotes,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
				}, me);

				process.nextTick(() => {
					this.activeUsersChart.read(me);
				});

				return await this.noteEntityService.packMany(timeline, me);
			}

			const [
				followings,
			] = await Promise.all([
				this.cacheService.userFollowingsCache.fetch(me.id),
			]);

			const timeline = this.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				useDbFallback: this.serverSettings.enableFanoutTimelineDbFallback,
				redisTimelines: ps.withFiles ? [`homeTimelineWithFiles:${me.id}`] : [`homeTimeline:${me.id}`],
				alwaysIncludeMyNotes: true,
				excludePureRenotes: !ps.withRenotes,
				noteFilter: note => {
					if (note.reply && note.reply.visibility === 'followers') {
						if (!Object.hasOwn(followings, note.reply.userId) && note.reply.userId !== me.id) return false;
					}

					return true;
				},
				dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
					untilId,
					sinceId,
					limit,
					includeMyRenotes: ps.includeMyRenotes,
					includeRenotedMyNotes: ps.includeRenotedMyNotes,
					includeLocalRenotes: ps.includeLocalRenotes,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
				}, me),
			});

			process.nextTick(() => {
				this.activeUsersChart.read(me);
			});

			return timeline;
		});
	}

	private async getFromDb(ps: { untilId: string | null; sinceId: string | null; limit: number; includeMyRenotes: boolean; includeRenotedMyNotes: boolean; includeLocalRenotes: boolean; withFiles: boolean; withRenotes: boolean; }, me: MiLocalUser) {
		const followees = await this.userFollowingService.getFollowees(me.id);

		const mutingChannelIds = await this.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		const followingChannelIds = await this.channelFollowingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id).filter(x => !mutingChannelIds.includes(x)));

		//#region Construct query
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (followees.length > 0 && followingChannelIds.length > 0) {
			// ユーザー・チャンネルともにフォローあり
			const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
			query.andWhere(new Brackets(qb => {
				qb
					.where(new Brackets(qb2 => {
						qb2
							.andWhere('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds })
							.andWhere('note.channelId IS NULL');
					}))
					.orWhere('note.channelId IN (:...followingChannelIds)', { followingChannelIds });
			}));
		} else if (followees.length > 0) {
			// ユーザーフォローのみ（チャンネルフォローなし）
			const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
			query.andWhere(new Brackets(qb => {
				qb
					.andWhere('note.channelId IS NULL')
					.andWhere('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds });
				if (mutingChannelIds.length > 0) {
					qb.andWhere(new Brackets(qb2 => {
						qb2.orWhere('note.renoteChannelId IS NULL');
						qb2.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
					}));
				}
			}));
		} else if (followingChannelIds.length > 0) {
			// チャンネルフォローのみ（ユーザーフォローなし）
			query.andWhere(new Brackets(qb => {
				qb
					// renoteChannelIdは見る必要が無い
					// ・HTLに流れてくるチャンネル＝フォローしているチャンネル
					// ・HTLにフォロー外のチャンネルが流れるのは、フォローしているユーザがそのチャンネル投稿をリノートした場合のみ
					// つまり、ユーザフォローしてない前提のこのブロックでは見る必要が無い
					.where('note.channelId IN (:...followingChannelIds)', { followingChannelIds })
					.orWhere('note.userId = :meId', { meId: me.id });
			}));
		} else {
			// フォローなし
			query.andWhere(new Brackets(qb => {
				qb
					.andWhere('note.channelId IS NULL')
					.andWhere('note.userId = :meId', { meId: me.id });
			}));
		}

		query.andWhere(new Brackets(qb => {
			qb
				.where('note.replyId IS NULL') // 返信ではない
				.orWhere(new Brackets(qb => {
					qb // 返信だけど投稿者自身への返信
						.where('note.replyId IS NOT NULL')
						.andWhere('note.replyUserId = note.userId');
				}));
		}));

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);
		this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

		if (ps.includeMyRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.userId != :meId', { meId: me.id });
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		if (ps.includeRenotedMyNotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteUserId != :meId', { meId: me.id });
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		if (ps.includeLocalRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteUserHost IS NOT NULL');
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}

		if (ps.withRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere(new Brackets(qb => {
					qb.orWhere('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}));
		}
		//#endregion

		return await query.limit(ps.limit).getMany();
	}
}
