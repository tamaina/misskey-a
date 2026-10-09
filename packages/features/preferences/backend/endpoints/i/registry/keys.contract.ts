/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain } from './registry.schema.js';

const requestName = 'i/registry/keys';
export const registryKeysContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___keys', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(objectInput({ scope: registryScope, domain: registryDomain })).output(v.array(v.string()));
