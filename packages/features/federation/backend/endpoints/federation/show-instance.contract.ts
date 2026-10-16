/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { federationInstanceSchema } from '../../federation.schema.js';

export const federationShowInstanceErrors = {} as const;

const requestName = 'federation/show-instance';
export const federationShowInstanceContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(objectInput({
		"host": v.string(),
	})).output(v.nullable(federationInstanceSchema));

export type FederationShowInstanceInput = v.InferOutput<NonNullable<typeof federationShowInstanceContract['~orpc']['inputSchema']>>;
export type FederationShowInstanceOutput = v.InferOutput<NonNullable<typeof federationShowInstanceContract['~orpc']['outputSchema']>>;
