/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const adminPromoCreateErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'ee449fbe-af2a-453b-9cae-cf2fe7c895fc',
	},

	alreadyPromoted: {
		message: 'The note has already promoted.',
		code: 'ALREADY_PROMOTED',
		id: 'ae427aa2-7a41-484f-a18c-2c1104051604',
	},
} as const;
export const adminPromoCreatePolicy = { name: 'admin/promo/create', requireCredential: true, requireModerator: true, kind: 'write:admin:promo' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const adminPromoCreateContract = oc.$meta({ requestName: 'admin/promo/create' } as const)
	.route({ method: 'POST', path: '/admin/promo/create', operationId: 'post___admin___promo___create', tags: ['admin'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_PROMOTED: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
	'expiresAt': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
})).output(v.void());
