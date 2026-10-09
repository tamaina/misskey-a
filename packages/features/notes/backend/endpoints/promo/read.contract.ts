/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const promoReadInput = objectInput({ noteId: misskeyId });
export const promoReadOutput = v.void();
export const promoReadErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'd785b897-fcd3-4fe9-8fc3-b85c26e6c932',
	},
} as const;
export const promoReadPolicy = { name: 'promo/read', requireCredential: true, kind: 'write:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const promoReadContract = oc.$meta<{ requestName: 'promo/read' }>({ requestName: 'promo/read' })
	.route({ method: 'POST', path: '/promo/read', operationId: 'post___promo___read', tags: ['notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(promoReadInput).output(promoReadOutput);
