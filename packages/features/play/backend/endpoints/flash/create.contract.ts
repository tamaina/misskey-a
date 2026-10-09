/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedFlashSchema } from '../../flash.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const flashCreateInput = objectInput({
	"title": v.string(),
	"summary": v.string(),
	"script": v.string(),
	"permissions": v.array(v.string()),
	"visibility": v.optional(v.picklist(["public", "private"]), "public"),
});
export const flashCreateOutput = packedFlashSchema;

const requestName = 'flash/create';
export const flashCreateContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['flash'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(flashCreateInput)
	.output(flashCreateOutput);
