/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { misskeyId } from '../../api/contract/index.js';

export const collectionsInputs = {
	'clips/delete': v.object({ clipId: misskeyId }),
	'clips/add-note': v.object({ clipId: misskeyId, noteId: misskeyId }),
	'clips/remove-note': v.object({ clipId: misskeyId, noteId: misskeyId }),
};

/** These definitions intentionally retain each legacy route's distinct error UUID. */
export const collectionsErrors = {
	'clips/delete': {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '70ca08ba-6865-4630-b6fb-8494759aa754',
		},
	},
	'clips/add-note': {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
		},
		alreadyClipped: {
			message: 'The note has already been clipped.',
			code: 'ALREADY_CLIPPED',
			id: '734806c4-542c-463a-9311-15c512803965',
		},
		tooManyClipNotes: {
			message: 'You cannot add notes to the clip any more.',
			code: 'TOO_MANY_CLIP_NOTES',
			id: 'f0dba960-ff73-4615-8df4-d6ac5d9dc118',
		},
	},
	'clips/remove-note': {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'b80525c6-97f7-49d7-a42d-ebccd49cfd52',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'aff017de-190e-434b-893e-33a9ff5049d8',
		},
	},
} as const;

export const clipFavoriteInputs = {
	'clips/favorite': v.object({ clipId: misskeyId }),
	'clips/unfavorite': v.object({ clipId: misskeyId }),
};

/** Keep the exact legacy metadata, including distinct UUIDs for the two routes. */
export const clipFavoriteErrors = {
	'clips/favorite': {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '4c2aaeae-80d8-4250-9606-26cb1fdb77a5',
		},
		alreadyFavorited: {
			message: 'The clip has already been favorited.',
			code: 'ALREADY_FAVORITED',
			id: '92658936-c625-4273-8326-2d790129256e',
		},
	},
	'clips/unfavorite': {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '2603966e-b865-426c-94a7-af4a01241dc1',
		},
		notFavorited: {
			message: 'You have not favorited the clip.',
			code: 'NOT_FAVORITED',
			id: '90c3a9e8-b321-4dae-bf57-2bf79bbcc187',
		},
	},
} as const;

export const clipFavoriteContract = {
	'clips/favorite': oc.route({ method: 'POST', path: '/clips/favorite', tags: ['clip'] })
		.input(clipFavoriteInputs['clips/favorite'])
		.output(v.void()),
	'clips/unfavorite': oc.route({ method: 'POST', path: '/clips/unfavorite', tags: ['clip'] })
		.input(clipFavoriteInputs['clips/unfavorite'])
		.output(v.void()),
};

export const collectionsContract = {
	'clips/delete': oc.route({ method: 'POST', path: '/clips/delete', tags: ['clips'] })
		.input(collectionsInputs['clips/delete'])
		.output(v.void()),
	'clips/add-note': oc.route({ method: 'POST', path: '/clips/add-note', tags: ['account', 'notes', 'clips'] })
		.input(collectionsInputs['clips/add-note'])
		.output(v.void()),
	'clips/remove-note': oc.route({ method: 'POST', path: '/clips/remove-note', tags: ['account', 'notes', 'clips'] })
		.input(collectionsInputs['clips/remove-note'])
		.output(v.void()),
	...clipFavoriteContract,
};

type Inputs = InferContractRouterInputs<typeof collectionsContract>;
type Outputs = InferContractRouterOutputs<typeof collectionsContract>;
export type CollectionEndpoints = {
	[K in keyof typeof collectionsContract]: { req: Inputs[K]; res: Outputs[K] };
};
