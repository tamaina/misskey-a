/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const announcementCommandInputs = {
	'admin/announcements/update': v.looseObject({
		id: misskeyId,
		title: v.exactOptional(jsonString({ minLength: 1 })),
		text: v.exactOptional(jsonString({ minLength: 1 })),
		imageUrl: v.exactOptional(v.nullable(jsonString({ minLength: 0 }))),
		icon: v.exactOptional(v.picklist(['info', 'warning', 'error', 'success'])),
		display: v.exactOptional(v.picklist(['normal', 'banner', 'dialog'])),
		forExistingUsers: v.exactOptional(v.boolean()),
		silence: v.exactOptional(v.boolean()),
		needConfirmationToRead: v.exactOptional(v.boolean()),
		isActive: v.exactOptional(v.boolean()),
	}),
	'admin/announcements/delete': v.looseObject({
		id: misskeyId,
	}),
	'i/read-announcement': v.looseObject({
		announcementId: misskeyId,
	}),
};

/** Preserve distinct route-specific no-such-announcement IDs from the legacy API. */
export const announcementCommandErrors = {
	'admin/announcements/update': {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc',
		},
	},
	'admin/announcements/delete': {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'ecad8040-a276-4e85-bda9-015a708d291e',
		},
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

export const announcementCommandsContract = {
	'admin/announcements/update': oc.route({ method: 'POST', path: '/admin/announcements/update', tags: ['admin'] })
		.input(announcementCommandInputs['admin/announcements/update'])
		.output(v.void()),
	'admin/announcements/delete': oc.route({ method: 'POST', path: '/admin/announcements/delete', tags: ['admin'] })
		.input(announcementCommandInputs['admin/announcements/delete'])
		.output(v.void()),
	'i/read-announcement': oc.route({ method: 'POST', path: '/i/read-announcement', tags: ['account'] })
		.input(announcementCommandInputs['i/read-announcement'])
		.output(v.void()),
};

type Inputs = InferContractRouterInputs<typeof announcementCommandsContract>;
type Outputs = InferContractRouterOutputs<typeof announcementCommandsContract>;
export type AnnouncementEndpoints = {
	[K in keyof typeof announcementCommandsContract]: { req: Inputs[K]; res: Outputs[K] };
};
