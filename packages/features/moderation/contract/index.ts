/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { misskeyId } from '../../api/contract/index.js';

/** Legacy API objects accept unrecognized fields; these validators intentionally remain loose. */
export const moderationCommandInputs = {
	'admin/suspend-user': v.looseObject({ userId: misskeyId }),
	'admin/unsuspend-user': v.looseObject({ userId: misskeyId }),
	'admin/unset-user-avatar': v.looseObject({ userId: misskeyId }),
	'admin/unset-user-banner': v.looseObject({ userId: misskeyId }),
	'admin/update-user-note': v.looseObject({ userId: misskeyId, text: v.string() }),
	'admin/forward-abuse-user-report': v.looseObject({ reportId: misskeyId }),
	'admin/resolve-abuse-user-report': v.looseObject({
		reportId: misskeyId,
		resolvedAs: v.exactOptional(v.nullable(v.picklist(['accept', 'reject']))),
	}),
	'admin/update-abuse-user-report': v.looseObject({
		reportId: misskeyId,
		moderationNote: v.exactOptional(v.string()),
	}),
	'admin/abuse-report/notification-recipient/delete': v.looseObject({ id: misskeyId }),
};

export const moderationCommandErrors = {
	'admin/forward-abuse-user-report': {
		noSuchAbuseReport: {
			message: 'No such abuse report.',
			code: 'NO_SUCH_ABUSE_REPORT',
			id: '8763e21b-d9bc-40be-acf6-54c1a6986493',
			kind: 'server',
			httpStatusCode: 404,
		},
	},
	'admin/resolve-abuse-user-report': {
		noSuchAbuseReport: {
			message: 'No such abuse report.',
			code: 'NO_SUCH_ABUSE_REPORT',
			id: 'ac3794dd-2ce4-d878-e546-73c60c06b398',
			kind: 'server',
			httpStatusCode: 404,
		},
	},
	'admin/update-abuse-user-report': {
		noSuchAbuseReport: {
			message: 'No such abuse report.',
			code: 'NO_SUCH_ABUSE_REPORT',
			id: '15f51cf5-46d1-4b1d-a618-b35bcbed0662',
			kind: 'server',
			httpStatusCode: 404,
		},
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

const voidOutput = v.void();

export const moderationCommandsContract = {
	'admin/suspend-user': oc.route({ method: 'POST', path: '/admin/suspend-user', tags: ['admin'] })
		.input(moderationCommandInputs['admin/suspend-user'])
		.output(voidOutput),
	'admin/unsuspend-user': oc.route({ method: 'POST', path: '/admin/unsuspend-user', tags: ['admin'] })
		.input(moderationCommandInputs['admin/unsuspend-user'])
		.output(voidOutput),
	'admin/unset-user-avatar': oc.route({ method: 'POST', path: '/admin/unset-user-avatar', tags: ['admin'] })
		.input(moderationCommandInputs['admin/unset-user-avatar'])
		.output(voidOutput),
	'admin/unset-user-banner': oc.route({ method: 'POST', path: '/admin/unset-user-banner', tags: ['admin'] })
		.input(moderationCommandInputs['admin/unset-user-banner'])
		.output(voidOutput),
	'admin/update-user-note': oc.route({ method: 'POST', path: '/admin/update-user-note', tags: ['admin'] })
		.input(moderationCommandInputs['admin/update-user-note'])
		.output(voidOutput),
	'admin/forward-abuse-user-report': oc.route({ method: 'POST', path: '/admin/forward-abuse-user-report', tags: ['admin'] })
		.input(moderationCommandInputs['admin/forward-abuse-user-report'])
		.output(voidOutput),
	'admin/resolve-abuse-user-report': oc.route({ method: 'POST', path: '/admin/resolve-abuse-user-report', tags: ['admin'] })
		.input(moderationCommandInputs['admin/resolve-abuse-user-report'])
		.output(voidOutput),
	'admin/update-abuse-user-report': oc.route({ method: 'POST', path: '/admin/update-abuse-user-report', tags: ['admin'] })
		.input(moderationCommandInputs['admin/update-abuse-user-report'])
		.output(voidOutput),
	'admin/abuse-report/notification-recipient/delete': oc.route({
		method: 'POST',
		path: '/admin/abuse-report/notification-recipient/delete',
		tags: ['admin', 'abuse-report', 'notification-recipient'],
	})
		.input(moderationCommandInputs['admin/abuse-report/notification-recipient/delete'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof moderationCommandsContract>;
type Outputs = InferContractRouterOutputs<typeof moderationCommandsContract>;
export type ModerationCommandEndpoints = {
	[K in keyof typeof moderationCommandsContract]: { req: Inputs[K]; res: Outputs[K] };
};
