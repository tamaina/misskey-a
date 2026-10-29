/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserBlockingService } from '@features/relationships/backend/services/UserBlockingService.js';
import { NoteEntityService } from '../../../serializers/NoteEntityService.js';
import { PollService } from '../../../services/PollService.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../../request.schema.js';
import { notesPollsVoteContract, notesPollsVoteErrors } from './vote.contract.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";
import type { UsersRepository, PollsRepository, PollVotesRepository } from '@features/persistence/backend/repositories/models.js';

export interface NotesPollsVoteDependencies {
	usersRepository: UsersRepository;
	pollsRepository: PollsRepository;
	pollVotesRepository: PollVotesRepository;
	idService: Pick<IdService, 'gen'>;
	getterService: Pick<GetterService, 'getNote'>;
	queueService: Pick<QueueService, 'deliver'>;
	pollService: Pick<PollService, 'deliverQuestionUpdate'>;
	apRendererService: Pick<ApRendererService, 'addContext' | 'renderVote'>;
	globalEventService: Pick<GlobalEventService, 'publishNoteStream'>;
	userBlockingService: Pick<UserBlockingService, 'checkBlocked'>;
	noteEntityService: Pick<NoteEntityService, 'isVisibleForMe'>;
}
export function createNotesPollsVoteProcedure(deps: NotesPollsVoteDependencies) {
	return createApiProcedure<MiLocalUser>()(notesPollsVoteContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;

				const createdAt = new Date();

				// Get votee
				const note = await deps.getterService.getNote(ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesPollsVoteErrors.noSuchNote);
					throw err;
				});

				// check visibility
				if (!await deps.noteEntityService.isVisibleForMe(note, me.id)) {
					throw apiError(notesPollsVoteErrors.noSuchNote);
				}

				if (!note.hasPoll) {
					throw apiError(notesPollsVoteErrors.noPoll);
				}

				// Check blocking
				if (note.userId !== me.id) {
					const blocked = await deps.userBlockingService.checkBlocked(note.userId, me.id);
					if (blocked) {
						throw apiError(notesPollsVoteErrors.youHaveBeenBlocked);
					}
				}

				const poll = await deps.pollsRepository.findOneByOrFail({ noteId: note.id });

				if (poll.expiresAt && poll.expiresAt < createdAt) {
					throw apiError(notesPollsVoteErrors.alreadyExpired);
				}

				if (poll.choices[ps.choice] == null) {
					throw apiError(notesPollsVoteErrors.invalidChoice);
				}

				// if already voted
				const exist = await deps.pollVotesRepository.findBy({
					noteId: note.id,
					userId: me.id,
				});

				if (exist.length) {
					if (poll.multiple) {
						if (exist.some(x => x.choice === ps.choice)) {
							throw apiError(notesPollsVoteErrors.alreadyVoted);
						}
					} else {
						throw apiError(notesPollsVoteErrors.alreadyVoted);
					}
				}

				// Create vote
				const vote = await deps.pollVotesRepository.insertOne({
					id: deps.idService.gen(createdAt.getTime()),
					noteId: note.id,
					userId: me.id,
					choice: ps.choice,
				});

				// Increment votes count
				const index = ps.choice + 1; // In SQL, array index is 1 based
				await deps.pollsRepository.query('UPDATE poll SET votes[$1] = votes[$1] + 1 WHERE "noteId" = $2', [index, poll.noteId]);

				deps.globalEventService.publishNoteStream(note, 'pollVoted', {
					choice: ps.choice,
					userId: me.id,
				});

				// リモート投票の場合リプライ送信
				if (note.userHost != null) {
					const owner = await deps.usersRepository.findOneByOrFail({ id: note.userId });
					if (owner.host === null || owner.uri === null) throw new Error('Remote poll owner is missing its federation identity');
					const pollOwner = { ...owner, host: owner.host, uri: owner.uri };

					deps.queueService.deliver(me, deps.apRendererService.addContext(await deps.apRendererService.renderVote(me, vote, note, poll, pollOwner)), pollOwner.inbox, false);
				}

				// リモートフォロワーにUpdate配信
				deps.pollService.deliverQuestionUpdate(note.id);
		});
}
