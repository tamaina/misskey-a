/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const promoReadErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'd785b897-fcd3-4fe9-8fc3-b85c26e6c932',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const promoReadContract = oc.$meta({
	requestName: 'promo/read',
	requireCredential: true,
	kind: 'write:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/promo/read', tags: ['notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(objectInput({ noteId: misskeyId })).output(v.void());
