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
import { misskeyId } from '../../input.schema.js';

export const federationUpdateRemoteUserErrors = {} as const;

const requestName = 'federation/update-remote-user';
export const federationUpdateRemoteUserContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'read:account',
	limit: {
		duration: 3600000,
		max: 30,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['federation'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"userId": misskeyId,
	})).output(v.void());

export type FederationUpdateRemoteUserInput = v.InferOutput<NonNullable<typeof federationUpdateRemoteUserContract['~orpc']['inputSchema']>>;
export type FederationUpdateRemoteUserOutput = v.InferOutput<NonNullable<typeof federationUpdateRemoteUserContract['~orpc']['outputSchema']>>;
