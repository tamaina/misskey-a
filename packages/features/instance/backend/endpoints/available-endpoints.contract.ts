/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';

export const availableEndpointsResult = v.object({
	permissions: v.nullable(v.array(v.string())),
	endpoints: v.array(v.string()),
	definitions: v.array(v.object({ name: v.string(), permission: v.nullable(v.string()), inputSchema: v.unknown(), mcpSupported: v.boolean() })),
});

/** Static authorization candidates, not a promise of input/visibility/rate-limit success.
 * A handler principal guard permits scoped credentials without the native kindless/required rejection.
 */
export const availableEndpointsContract = oc.$meta({ requestName: 'available-endpoints', requireCredential: false } as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/available-endpoints', tags: ['meta'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({ endpoint: v.exactOptional(v.string()) }))
	.output(availableEndpointsResult);
