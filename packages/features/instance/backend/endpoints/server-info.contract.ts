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

const requestName = 'server-info';
export const serverInfoContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 60 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['meta'] })
	.errors(commonErrors)
	.input(v.optional(objectInput({}), {}))
	.output(v.strictObject({
	machine: v.string(),
	cpu: v.strictObject({ model: v.string(), cores: finiteNumber }),
	mem: v.strictObject({ total: finiteNumber }),
	fs: v.strictObject({ total: finiteNumber, used: finiteNumber }),
}));

/** GET is an HTTP alias; APIClient.request continues to use POST. */
export const serverInfoGetContract = oc
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['meta'] })
	.errors(commonErrors)
	.input(requiredSchema(serverInfoContract['~orpc'].inputSchema))
	.output(requiredSchema(serverInfoContract['~orpc'].outputSchema));

export const instancePilotContract = {
	serverInfo: serverInfoContract,
	serverInfoGet: serverInfoGetContract,
};

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}

export type ServerInfoOutput = v.InferOutput<NonNullable<typeof serverInfoContract['~orpc']['outputSchema']>>;
