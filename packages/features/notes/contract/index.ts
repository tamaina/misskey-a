/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

/** Inputs for the existing void-returning note commands being served through oRPC. */
export const notesCommandInputs = {
	'notes/delete': v.looseObject({
		noteId: misskeyId,
	}),
	'notes/drafts/delete': v.looseObject({
		draftId: misskeyId,
	}),
	'notes/reactions/create': v.looseObject({
		noteId: misskeyId,
		reaction: jsonString(),
	}),
	'notes/reactions/delete': v.looseObject({
		noteId: misskeyId,
	}),
	'notes/thread-muting/create': v.looseObject({
		noteId: misskeyId,
	}),
	'notes/thread-muting/delete': v.looseObject({
		noteId: misskeyId,
	}),
	'notes/unrenote': v.looseObject({
		noteId: misskeyId,
	}),
	'promo/read': v.looseObject({
		noteId: misskeyId,
	}),
};

/** Preserve the distinct route-specific legacy API error identifiers. */
export const notesCommandErrors = {
	'notes/delete': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '490be23f-8c1f-4796-819f-94cb4f9d1630',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
		},
	},
	'notes/drafts/delete': {
		noSuchNoteDraft: {
			message: 'No such note draft.',
			code: 'NO_SUCH_NOTE_DRAFT',
			id: '49cd6b9d-848e-41ee-b0b9-adaca711a6b1',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
		},
	},
	'notes/reactions/create': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '033d0620-5bfe-4027-965d-980b0c85a3ea',
		},
		alreadyReacted: {
			message: 'You are already reacting to that note.',
			code: 'ALREADY_REACTED',
			id: '71efcf98-86d6-4e2b-b2ad-9d032369366b',
		},
		youHaveBeenBlocked: {
			message: 'You cannot react this note because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '20ef5475-9f38-4e4c-bd33-de6d979498ec',
		},
		cannotReactToRenote: {
			message: 'You cannot react to Renote.',
			code: 'CANNOT_REACT_TO_RENOTE',
			id: 'eaccdc08-ddef-43fe-908f-d108faad57f5',
		},
	},
	'notes/reactions/delete': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '764d9fce-f9f2-4a0e-92b1-6ceac9a7ad37',
		},
		notReacted: {
			message: 'You are not reacting to that note.',
			code: 'NOT_REACTED',
			id: '92f4426d-4196-4125-aa5b-02943e2ec8fc',
		},
	},
	'notes/thread-muting/create': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '5ff67ada-ed3b-2e71-8e87-a1a421e177d2',
		},
		alreadyMuting: {
			message: 'You are already muting that thread.',
			code: 'ALREADY_MUTING',
			id: 'c146e22d-1141-4b31-b28d-176371014d18',
		},
	},
	'notes/thread-muting/delete': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bddd57ac-ceb3-b29d-4334-86ea5fae481a',
		},
	},
	'notes/unrenote': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'efd4a259-2442-496b-8dd7-b255aa1a160f',
		},
	},
	'promo/read': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'd785b897-fcd3-4fe9-8fc3-b85c26e6c932',
		},
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

const voidOutput = v.void();

export const notesCommandsContract = {
	'notes/delete': oc.route({ method: 'POST', path: '/notes/delete', tags: ['notes'] })
		.input(notesCommandInputs['notes/delete'])
		.output(voidOutput),
	'notes/drafts/delete': oc.route({ method: 'POST', path: '/notes/drafts/delete', tags: ['notes', 'drafts'] })
		.input(notesCommandInputs['notes/drafts/delete'])
		.output(voidOutput),
	'notes/reactions/create': oc.route({ method: 'POST', path: '/notes/reactions/create', tags: ['reactions', 'notes'] })
		.input(notesCommandInputs['notes/reactions/create'])
		.output(voidOutput),
	'notes/reactions/delete': oc.route({ method: 'POST', path: '/notes/reactions/delete', tags: ['reactions', 'notes'] })
		.input(notesCommandInputs['notes/reactions/delete'])
		.output(voidOutput),
	'notes/thread-muting/create': oc.route({ method: 'POST', path: '/notes/thread-muting/create', tags: ['notes'] })
		.input(notesCommandInputs['notes/thread-muting/create'])
		.output(voidOutput),
	'notes/thread-muting/delete': oc.route({ method: 'POST', path: '/notes/thread-muting/delete', tags: ['notes'] })
		.input(notesCommandInputs['notes/thread-muting/delete'])
		.output(voidOutput),
	'notes/unrenote': oc.route({ method: 'POST', path: '/notes/unrenote', tags: ['notes'] })
		.input(notesCommandInputs['notes/unrenote'])
		.output(voidOutput),
	'promo/read': oc.route({ method: 'POST', path: '/promo/read', tags: ['notes'] })
		.input(notesCommandInputs['promo/read'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof notesCommandsContract>;
type Outputs = InferContractRouterOutputs<typeof notesCommandsContract>;

export type NotesCommandEndpoints = {
	[K in keyof typeof notesCommandsContract]: { req: Inputs[K]; res: Outputs[K] };
};
