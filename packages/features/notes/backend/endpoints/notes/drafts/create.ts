/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import * as v from 'valibot';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';
import { NoteDraftService } from '../../../services/NoteDraftService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { notesDraftsCreateContract, notesDraftsCreatePolicy, notesDraftsCreateErrors } from './create.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesDraftsCreateDependencies {
	noteDraftService: Pick<NoteDraftService, 'create'>;
	noteDraftEntityService: Pick<NoteDraftEntityService, 'pack'>;
}
export function createNotesDraftsCreateProcedure(deps: NotesDraftsCreateDependencies) {
	return implement(notesDraftsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesDraftsCreatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesDraftsCreateContract['~orpc'].outputSchema), await (async () => {
				const draft = await deps.noteDraftService.create(me, {
					fileIds: ps.fileIds ?? [],
					pollChoices: ps.poll?.choices ?? [],
					pollMultiple: ps.poll?.multiple ?? false,
					pollExpiresAt: ps.poll?.expiresAt ? new Date(ps.poll.expiresAt) : null,
					pollExpiredAfter: ps.poll?.expiredAfter ?? null,
					hasPoll: ps.poll != null,
					text: ps.text ?? null,
					replyId: ps.replyId ?? null,
					renoteId: ps.renoteId ?? null,
					cw: ps.cw ?? null,
					hashtag: ps.hashtag ?? null,
					localOnly: ps.localOnly,
					reactionAcceptance: ps.reactionAcceptance,
					visibility: ps.visibility,
					visibleUserIds: ps.visibleUserIds ?? [],
					channelId: ps.channelId ?? null,
					scheduledAt: ps.scheduledAt ? new Date(ps.scheduledAt) : null,
					isActuallyScheduled: ps.isActuallyScheduled,
				}).catch((err: unknown) => {
					if (err instanceof IdentifiableError) {
						switch (readErrorId(err)) {
							case '9ee33bbe-fde3-4c71-9b51-e50492c6b9c8':
								throw apiError(notesDraftsCreateErrors.tooManyDrafts);
							case '04da457d-b083-4055-9082-955525eda5a5':
								throw apiError(notesDraftsCreateErrors.cannotCreateAlreadyExpiredPoll);
							case 'b6992544-63e7-67f0-fa7f-32444b1b5306':
								throw apiError(notesDraftsCreateErrors.noSuchFile);
							case '64929870-2540-4d11-af41-3b484d78c956':
								throw apiError(notesDraftsCreateErrors.noSuchRenoteTarget);
							case '76cc5583-5a14-4ad3-8717-0298507e32db':
								throw apiError(notesDraftsCreateErrors.cannotReRenote);
							case '075ca298-e6e7-485a-b570-51a128bb5168':
								throw apiError(notesDraftsCreateErrors.youHaveBeenBlocked);
							case '81eb8188-aea1-4e35-9a8f-3334a3be9855':
								throw apiError(notesDraftsCreateErrors.cannotRenoteDueToVisibility);
							case '6815399a-6f13-4069-b60d-ed5156249d12':
								throw apiError(notesDraftsCreateErrors.noSuchChannel);
							case 'ed1952ac-2d26-4957-8b30-2deda76bedf7':
								throw apiError(notesDraftsCreateErrors.cannotRenoteToExternal);
							case 'c4721841-22fc-4bb7-ad3d-897ef1d375b5':
								throw apiError(notesDraftsCreateErrors.noSuchReplyTarget);
							case 'e6c10b57-2c09-4da3-bd4d-eda05d51d140':
								throw apiError(notesDraftsCreateErrors.cannotReplyToPureRenote);
							case '593c323c-6b6a-4501-a25c-2f36bd2a93d6':
								throw apiError(notesDraftsCreateErrors.cannotReplyToInvisibleNote);
							case '215dbc76-336c-4d2a-9605-95766ba7dab0':
								throw apiError(notesDraftsCreateErrors.cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility);
							case 'c3275f19-4558-4c59-83e1-4f684b5fab66':
								throw apiError(notesDraftsCreateErrors.tooManyScheduledNotes);
							case '94a89a43-3591-400a-9c17-dd166e71fdfa':
								throw apiError(notesDraftsCreateErrors.scheduledAtRequired);
							case 'b34d0c1b-996f-4e34-a428-c636d98df457':
								throw apiError(notesDraftsCreateErrors.scheduledAtMustBeInFuture);
							default:
								throw err;
						}
					}
					throw err;
				});

				const createdDraft = await deps.noteDraftEntityService.pack(draft, me);

				return {
					createdDraft,
				};
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
