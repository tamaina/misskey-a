/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain, registryJsonValue } from './registry.schema.js';

const requestName = 'i/registry/set';
export const registrySetContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___set', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors(commonErrors)
	.input(objectInput({ key: v.pipe(v.string(), v.minLength(1)), value: registryJsonValue, scope: registryScope, domain: registryDomain })).output(v.void());
