/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const registryScopesWithDomainInput = v.optional(objectInput({}), {});
export const registryScopesWithDomainOutput = v.array(v.strictObject({ domain: v.nullable(v.string()), scopes: v.array(v.array(v.string())) }));

const requestName = 'i/registry/scopes-with-domain';
export const registryScopesWithDomainContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___scopes-with-domain', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(registryScopesWithDomainInput).output(registryScopesWithDomainOutput);
