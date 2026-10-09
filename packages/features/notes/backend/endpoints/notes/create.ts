/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import * as v from 'valibot';
import { NoteCreateService } from '../../services/NoteCreateService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesCreateContract, notesCreatePolicy, notesCreateErrors } from './create.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesCreateDependencies {
	noteEntityService: Pick<NoteEntityService, 'pack'>;
	noteCreateService: Pick<NoteCreateService, 'fetchAndCreate'>;
}
export function createNotesCreateProcedure(deps: NotesCreateDependencies) {
	return implement(notesCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesCreatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesCreateContract['~orpc'].outputSchema), await (async () => {
				try {
					const note = await deps.noteCreateService.fetchAndCreate(me, {
						createdAt: new Date(),
						fileIds: ps.fileIds ?? ps.mediaIds ?? [],
						poll: ps.poll ? {
							choices: ps.poll.choices,
							multiple: ps.poll.multiple ?? false,
							expiresAt: ps.poll.expiredAfter ? new Date(Date.now() + ps.poll.expiredAfter) : ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
						} : null,
						text: ps.text ?? null,
						replyId: ps.replyId ?? null,
						renoteId: ps.renoteId ?? null,
						cw: ps.cw ?? null,
						localOnly: ps.localOnly,
						reactionAcceptance: ps.reactionAcceptance,
						visibility: ps.visibility,
						visibleUserIds: ps.visibleUserIds ?? [],
						channelId: ps.channelId ?? null,
						apMentions: ps.noExtractMentions ? [] : undefined,
						apHashtags: ps.noExtractHashtags ? [] : undefined,
						apEmojis: ps.noExtractEmojis ? [] : undefined,
					});

					return {
						createdNote: await deps.noteEntityService.pack(note, me),
					};
				} catch (err) {
					// TODO: 他のErrorもここでキャッチしてエラーメッセージを当てるようにしたい
					if (err instanceof IdentifiableError) {
						if (readErrorId(err) === '689ee33f-f97c-479a-ac49-1b9f8140af99') {
							throw apiError(notesCreateErrors.containsProhibitedWords);
						} else if (readErrorId(err) === '9f466dab-c856-48cd-9e65-ff90ff750580') {
							throw apiError(notesCreateErrors.containsTooManyMentions);
						} else if (readErrorId(err) === '801c046c-5bf5-4234-ad2b-e78fc20a2ac7') {
							throw apiError(notesCreateErrors.noSuchFile);
						} else if (readErrorId(err) === '53983c56-e163-45a6-942f-4ddc485d4290') {
							throw apiError(notesCreateErrors.noSuchRenoteTarget);
						} else if (readErrorId(err) === 'bde24c37-121f-4e7d-980d-cec52f599f02') {
							throw apiError(notesCreateErrors.cannotReRenote);
						} else if (readErrorId(err) === '2b4fe776-4414-4a2d-ae39-f3418b8fd4d3') {
							throw apiError(notesCreateErrors.youHaveBeenBlocked);
						} else if (readErrorId(err) === '90b9d6f0-893a-4fef-b0f1-e9a33989f71a') {
							throw apiError(notesCreateErrors.cannotRenoteDueToVisibility);
						} else if (readErrorId(err) === '48d7a997-da5c-4716-b3c3-92db3f37bf7d') {
							throw apiError(notesCreateErrors.cannotRenoteDueToVisibility);
						} else if (readErrorId(err) === 'b060f9a6-8909-4080-9e0b-94d9fa6f6a77') {
							throw apiError(notesCreateErrors.noSuchChannel);
						} else if (readErrorId(err) === '7e435f4a-780d-4cfc-a15a-42519bd6fb67') {
							throw apiError(notesCreateErrors.cannotRenoteOutsideOfChannel);
						} else if (readErrorId(err) === '60142edb-1519-408e-926d-4f108d27bee0') {
							throw apiError(notesCreateErrors.noSuchReplyTarget);
						} else if (readErrorId(err) === 'f089e4e2-c0e7-4f60-8a23-e5a6bf786b36') {
							throw apiError(notesCreateErrors.cannotReplyToPureRenote);
						} else if (readErrorId(err) === '11cd37b3-a411-4f77-8633-c580ce6a8dce') {
							throw apiError(notesCreateErrors.cannotReplyToInvisibleNote);
						} else if (readErrorId(err) === 'ced780a1-2012-4caf-bc7e-a95a291294cb') {
							throw apiError(notesCreateErrors.cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility);
						} else if (readErrorId(err) === 'b0df6025-f2e8-44b4-a26a-17ad99104612') {
							throw apiError(notesCreateErrors.youHaveBeenBlocked);
						} else if (readErrorId(err) === '0c11c11e-0c8d-48e7-822c-76ccef660068') {
							throw apiError(notesCreateErrors.cannotCreateAlreadyExpiredPoll);
						} else if (readErrorId(err) === 'bfa3905b-25f5-4894-b430-da331a490e4b') {
							throw apiError(notesCreateErrors.noSuchChannel);
						}
					}
					throw err;
				}
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
