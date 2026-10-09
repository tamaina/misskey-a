/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaInput, InferSchemaOutput } from '@orpc/contract';
import type * as v from 'valibot';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { notesApiContract } from '@features/notes/backend/api.contract.js';
import type { createNotesDraftsCreateProcedure } from '@features/notes/backend/endpoints/notes/drafts/create.js';
import type { InferRouterOutputs } from '@orpc/server';
import type { packedNoteDraftSchema } from '@features/notes/backend/note-aux.schema.js';
import type { notesDraftsCreateContract } from '@features/notes/backend/endpoints/notes/drafts/create.contract.js';
import type { notesDraftsUpdateContract } from '@features/notes/backend/endpoints/notes/drafts/update.contract.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Flatten<T> = { [K in keyof T]: T[K] };
type CreateRequest = InferContractRouterInputs<typeof notesDraftsCreateContract>;
type UpdateRequest = InferContractRouterInputs<typeof notesDraftsUpdateContract>;
type CreateHandler = InferSchemaOutput<NonNullable<typeof notesDraftsCreateContract['~orpc']['inputSchema']>>;
type UpdateHandler = InferSchemaOutput<NonNullable<typeof notesDraftsUpdateContract['~orpc']['inputSchema']>>;
type Reaction = null | 'likeOnly' | 'likeOnlyForRemote' | 'nonSensitiveOnly' | 'nonSensitiveOnlyForLocalLikeOnlyForRemote';
type Visibility = 'public' | 'home' | 'followers' | 'specified';

type Draft = v.InferOutput<typeof packedNoteDraftSchema>;
type NativeKeys = Assert<Equal<Extract<keyof typeof notesApiContract, `notesDrafts${string}`>, 'notesDraftsCreate' | 'notesDraftsUpdate' | 'notesDraftsList' | 'notesDraftsDelete' | 'notesDraftsCount'>>;
type CreateContractInput = Assert<Equal<CreateRequest, InferSchemaInput<NonNullable<typeof notesDraftsCreateContract['~orpc']['inputSchema']>>>>;
type UpdateContractInput = Assert<Equal<UpdateRequest, InferSchemaInput<NonNullable<typeof notesDraftsUpdateContract['~orpc']['inputSchema']>>>>;
type CreateContractOutput = Assert<Equal<InferContractRouterOutputs<typeof notesApiContract>['notesDraftsCreate'], InferContractRouterOutputs<typeof notesDraftsCreateContract>>>;
type UpdateContractOutput = Assert<Equal<InferContractRouterOutputs<typeof notesApiContract>['notesDraftsUpdate'], InferContractRouterOutputs<typeof notesDraftsUpdateContract>>>;
type CreateResponse = Assert<Equal<Flatten<InferContractRouterOutputs<typeof notesDraftsCreateContract>>, { createdDraft: Draft }>>;
type UpdateResponse = Assert<Equal<Flatten<InferContractRouterOutputs<typeof notesDraftsUpdateContract>>, { updatedDraft: Draft }>>;
type NativeResponse = Assert<Equal<InferRouterOutputs<ReturnType<typeof createNotesDraftsCreateProcedure>>, InferContractRouterOutputs<typeof notesDraftsCreateContract>>>;
type RequestFields = Assert<Equal<keyof CreateRequest, 'visibility' | 'visibleUserIds' | 'cw' | 'hashtag' | 'localOnly' | 'reactionAcceptance' | 'replyId' | 'renoteId' | 'channelId' | 'text' | 'fileIds' | 'poll' | 'scheduledAt' | 'isActuallyScheduled'>>;
type UpdateFields = Assert<Equal<keyof UpdateRequest, keyof CreateRequest | 'draftId'>>;
type CreateDefaultInput = Assert<Equal<CreateRequest['visibility'], Visibility | undefined>>;
type CreateDefaultOutput = Assert<Equal<CreateHandler['visibility'], Visibility>>;
type CreateBooleanInput = Assert<Equal<CreateRequest['localOnly'], boolean | undefined>>;
type CreateBooleanOutput = Assert<Equal<CreateHandler['localOnly'], boolean>>;
type CreateSchedulingOutput = Assert<Equal<CreateHandler['isActuallyScheduled'], boolean>>;
type CreateReactionInput = Assert<Equal<CreateRequest['reactionAcceptance'], Reaction | undefined>>;
type CreateReactionOutput = Assert<Equal<CreateHandler['reactionAcceptance'], Reaction>>;
type UpdateVisibility = Assert<Equal<UpdateHandler['visibility'], Visibility | undefined>>;
type UpdateReaction = Assert<Equal<UpdateHandler['reactionAcceptance'], Reaction | undefined>>;
type DraftId = Assert<Equal<UpdateRequest['draftId'], string>>;
type NullableText = Assert<Equal<CreateRequest['text'], string | null | undefined>>;
type NullableSchedule = Assert<Equal<CreateRequest['scheduledAt'], number | null | undefined>>;
type PollChoices = Assert<Equal<NonNullable<CreateRequest['poll']>['choices'], string[]>>;
type PollMultiple = Assert<Equal<NonNullable<CreateRequest['poll']>['multiple'], boolean | undefined>>;
type PollExpiry = Assert<Equal<NonNullable<CreateRequest['poll']>['expiredAfter'], number | null | undefined>>;
type OptionalFileIds = Assert<Equal<CreateRequest['fileIds'], string[] | undefined>>;

const create: CreateRequest = {};
const update: UpdateRequest = { draftId: 'draft1' };
const nullable: CreateRequest = { text: null, poll: null, scheduledAt: null, reactionAcceptance: null, replyId: null };
const emptyPoll: CreateRequest = { poll: { choices: [] } };
const duplicatesRemainStrings: CreateRequest = { fileIds: ['a', 'a'], poll: { choices: ['same', 'same'] } };
// @ts-expect-error Updates require draftId.
const missingDraftId: UpdateRequest = {};
// @ts-expect-error draftId is not nullable.
const nullDraftId: UpdateRequest = { draftId: null };
// @ts-expect-error Poll choices remain required if the poll is present.
const missingChoices: CreateRequest = { poll: {} };
// @ts-expect-error Visibility is the exact portable picklist.
const invalidVisibility: CreateRequest = { visibility: 'private' };
// @ts-expect-error The null-inclusive reaction picklist excludes unknown strings.
const invalidReaction: CreateRequest = { reactionAcceptance: 'unknown' };
// @ts-expect-error JSON integer fields remain numeric, without coercion.
const invalidSchedule: CreateRequest = { scheduledAt: '123' };
// @ts-expect-error Native requests expose only declared fields.
const extraRequestField: CreateRequest = { future: true };
void create; void update; void nullable; void emptyPoll; void duplicatesRemainStrings; void missingDraftId; void nullDraftId; void missingChoices; void invalidVisibility; void invalidReaction; void invalidSchedule; void extraRequestField;
export type Cases = [NativeKeys, CreateContractInput, UpdateContractInput, CreateContractOutput, UpdateContractOutput, CreateResponse, UpdateResponse, NativeResponse, RequestFields, UpdateFields, CreateDefaultInput, CreateDefaultOutput, CreateBooleanInput, CreateBooleanOutput, CreateSchedulingOutput, CreateReactionInput, CreateReactionOutput, UpdateVisibility, UpdateReaction, DraftId, NullableText, NullableSchedule, PollChoices, PollMultiple, PollExpiry, OptionalFileIds];
