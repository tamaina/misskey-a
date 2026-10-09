/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain } from './registry.schema.js';

export const registryRemoveInput = objectInput({ key: v.string(), scope: registryScope, domain: registryDomain });
export const registryRemoveOutput = v.void();

const requestName = 'i/registry/remove';
export const registryRemoveContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___remove', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_KEY: { status: 400, data: apiErrorData } })
	.input(registryRemoveInput).output(registryRemoveOutput);
