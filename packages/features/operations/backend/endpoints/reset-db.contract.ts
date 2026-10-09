/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

export const resetDbInput = objectInput({});
export const resetDbOutput = v.void();
export const resetDbErrors = {

	} as const;

const requestName = 'reset-db';
export const resetDbContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['non-productive'] })
	.errors({ ...commonErrors })
	.input(resetDbInput).output(resetDbOutput);
