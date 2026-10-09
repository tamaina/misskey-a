/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';

export const adDeleteInput = objectInput({
	'id': v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)),
});

export const adDeleteContract = oc.$meta<{ requestName: 'admin/ad/delete'; allowGet: boolean; cacheSec?: number }>({ requestName: 'admin/ad/delete', allowGet: false })
	.route({ method: 'POST', path: '/admin/ad/delete', operationId: 'post___admin___ad___delete', tags: ['admin'], successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_AD: { status: 400, data: apiErrorData } })
	.input(adDeleteInput)
	.output(v.void());
