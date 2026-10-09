/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../request.schema.js';

export const chatReadAllErrors = {} as const;
export const chatReadAllPolicy = { name: 'chat/read-all', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatReadAllContract = oc.$meta({ requestName: 'chat/read-all' } as const)
	.route({ method: 'POST', path: '/chat/read-all', operationId: 'post___chat___read-all', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.void());
