import type { ContractEndpoints } from '../src/contract.types.js';
import type { Packed } from '../built/contracts/index/backend/packed.schema.js';
import type { notesCreateContract } from '../built/contracts/notes/backend/endpoints/notes/create.contract.js';
import type { InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';
import type { notesApiContract } from '../built/contracts/notes/backend/api.contract.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Flatten<T> = { [K in keyof T]: T[K] };
type Request = ContractEndpoints['notes/create']['req'];
type Handler = InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['inputSchema']>>;
type Reaction = null | 'likeOnly' | 'likeOnlyForRemote' | 'nonSensitiveOnly' | 'nonSensitiveOnlyForLocalLikeOnlyForRemote';
type Visibility = 'public' | 'home' | 'followers' | 'specified';

type Response = Assert<Equal<Flatten<ContractEndpoints['notes/create']['res']>, { createdNote: Packed<'Note'> }>>;
type NativeResponse = Assert<Equal<Flatten<InferContractRouterOutputs<typeof notesApiContract>['notesCreate']>, { createdNote: Packed<'Note'> }>>;
type Fields = Assert<Equal<keyof Request, 'visibility' | 'visibleUserIds' | 'cw' | 'localOnly' | 'reactionAcceptance' | 'noExtractMentions' | 'noExtractHashtags' | 'noExtractEmojis' | 'replyId' | 'renoteId' | 'channelId' | 'text' | 'fileIds' | 'mediaIds' | 'poll'>>;
type InputVisibility = Assert<Equal<Request['visibility'], Visibility | undefined>>;
type OutputVisibility = Assert<Equal<Handler['visibility'], Visibility>>;
type InputBoolean = Assert<Equal<Request['localOnly'], boolean | undefined>>;
type OutputBoolean = Assert<Equal<Handler['localOnly'], boolean>>;
type OutputMentions = Assert<Equal<Handler['noExtractMentions'], boolean>>;
type OutputHashtags = Assert<Equal<Handler['noExtractHashtags'], boolean>>;
type OutputEmojis = Assert<Equal<Handler['noExtractEmojis'], boolean>>;
type InputReaction = Assert<Equal<Request['reactionAcceptance'], Reaction | undefined>>;
type OutputReaction = Assert<Equal<Handler['reactionAcceptance'], Reaction>>;
type OptionalNullableText = Assert<Equal<Request['text'], string | null | undefined>>;
type OptionalFiles = Assert<Equal<Request['fileIds'], string[] | undefined>>;
type OptionalMedia = Assert<Equal<Request['mediaIds'], string[] | undefined>>;
type Choices = Assert<Equal<NonNullable<Request['poll']>['choices'], string[]>>;
type Multiple = Assert<Equal<NonNullable<Request['poll']>['multiple'], boolean | undefined>>;
type ExpiresAt = Assert<Equal<NonNullable<Request['poll']>['expiresAt'], number | null | undefined>>;
type ExpiredAfter = Assert<Equal<NonNullable<Request['poll']>['expiredAfter'], number | null | undefined>>;

// The old SDK cannot express the documented if/then requirement either; runtime enforces it.
const conditionalTypeLimitation: Request = {};
const text: Request = { text: 'hello' };
const renote: Request = { renoteId: 'renote1', text: null };
const media: Request = { mediaIds: ['file1'] };
const poll: Request = { poll: { choices: ['a', 'b'], multiple: true, expiresAt: null, expiredAfter: 1000 } };
// @ts-expect-error Poll choices remain required if a poll is supplied.
const missingChoices: Request = { poll: {} };
// @ts-expect-error Legacy file arrays were not nullable.
const nullFiles: Request = { fileIds: null };
// @ts-expect-error Legacy media arrays were not nullable.
const nullMedia: Request = { mediaIds: null };
// @ts-expect-error Visibility remains the exact portable picklist.
const badVisibility: Request = { text: 'hello', visibility: 'private' };
// @ts-expect-error Reaction acceptance remains the exact null-inclusive picklist.
const badReaction: Request = { text: 'hello', reactionAcceptance: 'unknown' };
// @ts-expect-error Poll expiry remains numeric without coercion.
const badExpiry: Request = { poll: { choices: ['a', 'b'], expiredAfter: '1000' } };
// @ts-expect-error Defaulted extraction flags still only accept booleans.
const badExtraction: Request = { text: 'hello', noExtractMentions: 'true' };
// @ts-expect-error The SDK removes the transport's unknown-key index signature.
const extraField: Request = { text: 'hello', future: true };
void conditionalTypeLimitation; void text; void renote; void media; void poll; void missingChoices; void nullFiles; void nullMedia; void badVisibility; void badReaction; void badExpiry; void badExtraction; void extraField;
export type Cases = [Response, NativeResponse, Fields, InputVisibility, OutputVisibility, InputBoolean, OutputBoolean, OutputMentions, OutputHashtags, OutputEmojis, InputReaction, OutputReaction, OptionalNullableText, OptionalFiles, OptionalMedia, Choices, Multiple, ExpiresAt, ExpiredAfter];
