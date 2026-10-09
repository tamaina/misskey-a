/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain, registryKeyTypes } from './registry.schema.js';

export const registryKeysWithTypeInput = objectInput({ scope: registryScope, domain: registryDomain });
export const registryKeysWithTypeOutput = registryKeyTypes;

const requestName = 'i/registry/keys-with-type';
export const registryKeysWithTypeContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___keys-with-type', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(registryKeysWithTypeInput).output(registryKeysWithTypeOutput);
