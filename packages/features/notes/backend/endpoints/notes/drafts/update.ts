/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Injectable } from '@nestjs/common';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import * as v from 'valibot';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';
import { NoteDraftService } from '../../../services/NoteDraftService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { notesDraftsUpdateContract, notesDraftsUpdatePolicy, notesDraftsUpdateInput, notesDraftsUpdateOutput, notesDraftsUpdateErrors } from './update.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { NotesApiContext } from '../../../operations.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';

export function createNotesDraftsUpdateProcedure<Actor extends ApiActor>() {
	return implement(notesDraftsUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesDraftsUpdatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesDraftsUpdate(input, context.principal));
}

@Injectable()
export class NotesDraftsUpdateOperation {
	constructor(
		private noteDraftService: NoteDraftService,
		private noteDraftEntityService: NoteDraftEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof notesDraftsUpdateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof notesDraftsUpdateOutput>> {
		return v.parse(notesDraftsUpdateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof notesDraftsUpdateInput>, me: MiLocalUser) {
		const draft = await this.noteDraftService.update(me, ps.draftId, {
			fileIds: ps.fileIds,
			pollChoices: ps.poll?.choices,
			pollMultiple: ps.poll?.multiple,
			pollExpiresAt: ps.poll?.expiresAt ? new Date(ps.poll.expiresAt) : null,
			pollExpiredAfter: ps.poll?.expiredAfter,
			text: ps.text,
			replyId: ps.replyId,
			renoteId: ps.renoteId,
			cw: ps.cw,
			hashtag: ps.hashtag,
			localOnly: ps.localOnly,
			reactionAcceptance: ps.reactionAcceptance,
			visibility: ps.visibility,
			visibleUserIds: ps.visibleUserIds,
			channelId: ps.channelId,
			scheduledAt: ps.scheduledAt ? new Date(ps.scheduledAt) : null,
			isActuallyScheduled: ps.isActuallyScheduled,
		}).catch((err: unknown) => {
			if (err instanceof IdentifiableError) {
				switch (readErrorId(err)) {
					case '49cd6b9d-848e-41ee-b0b9-adaca711a6b1':
						throw apiError(notesDraftsUpdateErrors.noSuchNoteDraft);
					case '04da457d-b083-4055-9082-955525eda5a5':
						throw apiError(notesDraftsUpdateErrors.cannotCreateAlreadyExpiredPoll);
					case 'b6992544-63e7-67f0-fa7f-32444b1b5306':
						throw apiError(notesDraftsUpdateErrors.noSuchFile);
					case '64929870-2540-4d11-af41-3b484d78c956':
						throw apiError(notesDraftsUpdateErrors.noSuchRenote);
					case '76cc5583-5a14-4ad3-8717-0298507e32db':
						throw apiError(notesDraftsUpdateErrors.cannotRenote);
					case '075ca298-e6e7-485a-b570-51a128bb5168':
						throw apiError(notesDraftsUpdateErrors.youHaveBeenBlocked);
					case '81eb8188-aea1-4e35-9a8f-3334a3be9855':
						throw apiError(notesDraftsUpdateErrors.cannotRenoteDueToVisibility);
					case '6815399a-6f13-4069-b60d-ed5156249d12':
						throw apiError(notesDraftsUpdateErrors.noSuchChannel);
					case 'ed1952ac-2d26-4957-8b30-2deda76bedf7':
						throw apiError(notesDraftsUpdateErrors.cannotRenoteToExternal);
					case 'c4721841-22fc-4bb7-ad3d-897ef1d375b5':
						throw apiError(notesDraftsUpdateErrors.noSuchReply);
					case 'e6c10b57-2c09-4da3-bd4d-eda05d51d140':
						throw apiError(notesDraftsUpdateErrors.cannotReplyToPureRenote);
					case '593c323c-6b6a-4501-a25c-2f36bd2a93d6':
						throw apiError(notesDraftsUpdateErrors.cannotReplyToInvisibleNote);
					case '215dbc76-336c-4d2a-9605-95766ba7dab0':
						throw apiError(notesDraftsUpdateErrors.cannotReplyToSpecifiedNoteWithExtendedVisibility);
					case 'b5c90186-4ab0-49c8-9bba-a1f76c282ba4':
						throw apiError(notesDraftsUpdateErrors.noSuchRenoteTarget);
					case 'fd4cc33e-2a37-48dd-99cc-9b806eb2031a':
						throw apiError(notesDraftsUpdateErrors.cannotReRenote);
					case '749ee0f6-d3da-459a-bf02-282e2da4292c':
						throw apiError(notesDraftsUpdateErrors.noSuchReplyTarget);
					case '33510210-8452-094c-6227-4a6c05d99f00':
						throw apiError(notesDraftsUpdateErrors.cannotRenoteOutsideOfChannel);
					case 'aa6e01d3-a85c-669d-758a-76aab43af334':
						throw apiError(notesDraftsUpdateErrors.containsProhibitedWords);
					case '4de0363a-3046-481b-9b0f-feff3e211025':
						throw apiError(notesDraftsUpdateErrors.containsTooManyMentions);
					case 'bacdf856-5c51-4159-b88a-804fa5103be5':
						throw apiError(notesDraftsUpdateErrors.tooManyScheduledNotes);
					case '94a89a43-3591-400a-9c17-dd166e71fdfa':
						throw apiError(notesDraftsUpdateErrors.scheduledAtRequired);
					case 'b34d0c1b-996f-4e34-a428-c636d98df457':
						throw apiError(notesDraftsUpdateErrors.scheduledAtMustBeInFuture);
					default:
						throw err;
				}
			}
			throw err;
		});

		const updatedDraft = await this.noteDraftEntityService.pack(draft, me);

		return {
			updatedDraft,
		};
	}
}
