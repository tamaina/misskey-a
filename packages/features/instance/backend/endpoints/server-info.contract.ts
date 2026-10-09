/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';

import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

const finiteNumber = v.pipe(v.number(), v.finite());
/** Empty object inputs still reject arrays; an absent POST body retains the legacy default. */
const serverInfoInput = v.optional(objectInput({}), {});

export const serverInfoOutput = v.strictObject({
	machine: v.string(),
	cpu: v.strictObject({ model: v.string(), cores: finiteNumber }),
	mem: v.strictObject({ total: finiteNumber }),
	fs: v.strictObject({ total: finiteNumber, used: finiteNumber }),
});

const requestName = 'server-info';
export const serverInfoContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 60 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['meta'] })
	.errors(commonErrors)
	.input(serverInfoInput)
	.output(serverInfoOutput);

/** GET is an HTTP alias; APIClient.request continues to use POST. */
export const serverInfoGetContract = oc
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['meta'] })
	.errors(commonErrors)
	.input(serverInfoInput)
	.output(serverInfoOutput);

export const instancePilotContract = {
	serverInfo: serverInfoContract,
	serverInfoGet: serverInfoGetContract,
};
