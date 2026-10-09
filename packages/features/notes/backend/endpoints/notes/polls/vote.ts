/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserBlockingService } from '@features/relationships/backend/services/UserBlockingService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { NoteEntityService } from '../../../serializers/NoteEntityService.js';
import { PollService } from '../../../services/PollService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { notesPollsVoteContract, notesPollsVotePolicy, notesPollsVoteErrors } from './vote.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { UsersRepository, PollsRepository, PollVotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { NotesApiContext } from '../../../operations.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';

export function createNotesPollsVoteProcedure<Actor extends ApiActor>() {
	return implement(notesPollsVoteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesPollsVotePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesPollsVote(input, context.principal));
}

@Injectable()
export class NotesPollsVoteOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		private idService: IdService,
		private getterService: GetterService,
		private queueService: QueueService,
		private pollService: PollService,
		private apRendererService: ApRendererService,
		private globalEventService: GlobalEventService,
		private userBlockingService: UserBlockingService,
		private noteEntityService: NoteEntityService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesPollsVoteContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof notesPollsVoteContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesPollsVoteContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesPollsVoteContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const createdAt = new Date();

		// Get votee
		const note = await this.getterService.getNote(ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesPollsVoteErrors.noSuchNote);
			throw err;
		});

		// check visibility
		if (!await this.noteEntityService.isVisibleForMe(note, me.id)) {
			throw apiError(notesPollsVoteErrors.noSuchNote);
		}

		if (!note.hasPoll) {
			throw apiError(notesPollsVoteErrors.noPoll);
		}

		// Check blocking
		if (note.userId !== me.id) {
			const blocked = await this.userBlockingService.checkBlocked(note.userId, me.id);
			if (blocked) {
				throw apiError(notesPollsVoteErrors.youHaveBeenBlocked);
			}
		}

		const poll = await this.pollsRepository.findOneByOrFail({ noteId: note.id });

		if (poll.expiresAt && poll.expiresAt < createdAt) {
			throw apiError(notesPollsVoteErrors.alreadyExpired);
		}

		if (poll.choices[ps.choice] == null) {
			throw apiError(notesPollsVoteErrors.invalidChoice);
		}

		// if already voted
		const exist = await this.pollVotesRepository.findBy({
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
		const vote = await this.pollVotesRepository.insertOne({
			id: this.idService.gen(createdAt.getTime()),
			noteId: note.id,
			userId: me.id,
			choice: ps.choice,
		});

		// Increment votes count
		const index = ps.choice + 1; // In SQL, array index is 1 based
		await this.pollsRepository.query('UPDATE poll SET votes[$1] = votes[$1] + 1 WHERE "noteId" = $2', [index, poll.noteId]);

		this.globalEventService.publishNoteStream(note, 'pollVoted', {
			choice: ps.choice,
			userId: me.id,
		});

		// リモート投票の場合リプライ送信
		if (note.userHost != null) {
			const owner = await this.usersRepository.findOneByOrFail({ id: note.userId });
			if (owner.host === null || owner.uri === null) throw new Error('Remote poll owner is missing its federation identity');
			const pollOwner = { ...owner, host: owner.host, uri: owner.uri };

			this.queueService.deliver(me, this.apRendererService.addContext(await this.apRendererService.renderVote(me, vote, note, poll, pollOwner)), pollOwner.inbox, false);
		}

		// リモートフォロワーにUpdate配信
		this.pollService.deliverQuestionUpdate(note.id);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
