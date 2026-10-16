/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../channel.schema.js';
import { objectInput } from '../../request.schema.js';

export const channelsFeaturedErrors = {} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const channelsFeaturedContract = oc.$meta({
	requestName: 'channels/featured',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/channels/featured', tags: ['channels'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(packedChannelSchema));
